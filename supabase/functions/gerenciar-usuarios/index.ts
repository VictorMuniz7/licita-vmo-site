// Gestão dos usuários com acesso ao Licita-VMO (titular + até 3).
// POST { action: 'criar', name, email }
// POST { action: 'ativar' | 'desativar' | 'remover' | 'reenviar-acesso', member_id }
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  admin, contaDoTitular, ErroHttp, json, lerCorpo, preflight, responderErro, SITE_URL, usuarioDaRequisicao,
} from '../_shared/comum.ts';

const LIMITE = 4;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface Pedido { action?: string; name?: string; email?: string; member_id?: string }

Deno.serve(async (req) => {
  const pf = preflight(req); if (pf) return pf;
  try {
    const user = await usuarioDaRequisicao(req);
    const pedido = await lerCorpo<Pedido>(req);
    const db = admin();
    const conta = await contaDoTitular(db, user.id);

    if (pedido.action === 'criar') {
      const nome = (pedido.name ?? '').trim();
      const email = (pedido.email ?? '').trim().toLowerCase();
      if (nome.length < 2) throw new ErroHttp(400, 'Informe o nome do usuário.');
      if (!EMAIL.test(email)) throw new ErroHttp(400, 'E-mail inválido.');

      const { data: ent } = await db.rpc('account_live_subscription', { p_account: conta.id });
      const { data: plano } = ent?.plan_id
        ? await db.from('plans').select('includes_licita').eq('id', ent.plan_id).maybeSingle()
        : { data: null };
      if (!plano?.includes_licita) throw new ErroHttp(403, 'Contrate o Licita-VMO para liberar usuários.');

      const { count } = await db.from('account_members').select('id', { count: 'exact', head: true }).eq('account_id', conta.id);
      if ((count ?? 0) >= LIMITE) throw new ErroHttp(409, `Sua conta já tem ${LIMITE} usuários, o máximo do plano.`);

      const { data: convite, error: erroConvite } = await db.auth.admin.inviteUserByEmail(email, {
        data: { full_name: nome, invited_by_account: conta.id },
        redirectTo: `${SITE_URL}/definir-senha`,
      });
      if (erroConvite) {
        if (/already|registered|exists/i.test(erroConvite.message)) {
          throw new ErroHttp(409, 'Este e-mail já tem cadastro. Use outro e-mail para este usuário.');
        }
        throw erroConvite;
      }

      const { data: membro, error } = await db.from('account_members').insert({
        account_id: conta.id, user_id: convite.user.id, name: nome, email, role: 'member',
      }).select().single();
      if (error) {
        await db.auth.admin.deleteUser(convite.user.id);  // desfaz o convite
        throw new ErroHttp(409, error.message.includes('Limite') ? error.message : 'Não foi possível criar o usuário.');
      }
      return json({ member: membro });
    }

    // Ações sobre um membro existente
    const { data: membro } = await db.from('account_members').select('*')
      .eq('id', pedido.member_id ?? '').eq('account_id', conta.id).maybeSingle();
    if (!membro) throw new ErroHttp(404, 'Usuário não encontrado nesta conta.');

    switch (pedido.action) {
      case 'ativar':
      case 'desativar': {
        if (membro.role === 'owner') throw new ErroHttp(400, 'O titular não pode ser desativado.');
        const ativo = pedido.action === 'ativar';
        await db.from('account_members').update({ active: ativo }).eq('id', membro.id);
        // derruba as sessões abertas de quem foi desativado
        if (!ativo) await db.auth.admin.signOut(membro.user_id, 'global').catch(() => null);
        return json({ ok: true, active: ativo });
      }
      case 'remover': {
        if (membro.role === 'owner') throw new ErroHttp(400, 'O titular não pode ser removido.');
        await db.from('account_members').delete().eq('id', membro.id);
        await db.auth.admin.deleteUser(membro.user_id);
        return json({ ok: true });
      }
      case 'reenviar-acesso': {
        const anon = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
        const { error } = await anon.auth.resetPasswordForEmail(membro.email, { redirectTo: `${SITE_URL}/definir-senha` });
        if (error) throw new ErroHttp(429, 'Aguarde um pouco antes de reenviar o e-mail.');
        return json({ ok: true });
      }
      default:
        throw new ErroHttp(400, 'Ação desconhecida.');
    }
  } catch (e) {
    return responderErro(e);
  }
});
