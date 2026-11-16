// POST {} — cancela a assinatura do titular. O acesso continua até o fim do período pago.
import { admin, contaDoTitular, ErroHttp, json, preflight, responderErro, usuarioDaRequisicao } from '../_shared/comum.ts';
import { asaas } from '../_shared/asaas.ts';

Deno.serve(async (req) => {
  const pf = preflight(req); if (pf) return pf;
  try {
    const user = await usuarioDaRequisicao(req);
    const db = admin();
    const conta = await contaDoTitular(db, user.id);

    const { data: sub } = await db.from('subscriptions').select('*')
      .eq('account_id', conta.id).in('status', ['pending', 'active', 'overdue']).maybeSingle();
    if (!sub) throw new ErroHttp(404, 'Nenhuma assinatura ativa para cancelar.');

    if (sub.asaas_subscription_id) await asaas.cancelarAssinatura(sub.asaas_subscription_id);

    const acessoAte = sub.status === 'pending' ? null : sub.next_due_date;
    await db.from('subscriptions').update({
      status: 'canceled', canceled_at: new Date().toISOString(), access_until: acessoAte,
    }).eq('id', sub.id);

    return json({ ok: true, access_until: acessoAte });
  } catch (e) {
    return responderErro(e);
  }
});
