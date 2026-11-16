import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { MODO_DEMO } from './config';
import { chamarFuncao, supabase } from './supabase';
import { soDigitos, traduzirErro } from './formato';
import {
  AcaoUsuario, Assinatura, Cobranca, Conta, Direitos, Membro, NovaConta, PerfilRadar, Plano, PlanoId, PLANOS_PADRAO,
} from './modelos';
import { demo } from './demo';

/**
 * Estado do cliente logado: conta, assinatura, cobranças, usuários e perfil do radar.
 * No modo demonstração tudo vem de ./demo.ts.
 */
@Injectable({ providedIn: 'root' })
export class PortalService {
  private auth = inject(AuthService);

  readonly planos = signal<Plano[]>(PLANOS_PADRAO);
  readonly conta = signal<Conta | null>(null);
  readonly direitos = signal<Direitos | null>(null);
  readonly assinatura = signal<Assinatura | null>(null);
  readonly cobrancas = signal<Cobranca[]>([]);
  readonly membros = signal<Membro[]>([]);
  readonly radar = signal<PerfilRadar | null>(null);
  readonly carregando = signal(false);
  readonly carregado = signal(false);

  readonly ehTitular = computed(() => {
    const c = this.conta(); const u = this.auth.usuario();
    return !!c && !!u && c.owner_id === u.id;
  });
  readonly planoAtual = computed(() => this.planos().find(p => p.id === this.assinatura()?.plan_id) ?? null);
  readonly temLicita = computed(() => this.direitos()?.licita ?? false);
  readonly temRadar = computed(() => this.direitos()?.radar ?? false);
  readonly faturaPendente = computed(() =>
    this.cobrancas().find(c => c.status === 'PENDING' || c.status === 'OVERDUE') ?? null);

  private carregamento: Promise<void> | null = null;

  async carregarPlanos() {
    if (MODO_DEMO) return;
    const { data } = await supabase!.from('plans').select('*').order('sort');
    if (data?.length) this.planos.set(data as Plano[]);
  }

  /** Carrega tudo do usuário logado (uma vez; use recarregar() para forçar). */
  carregar(): Promise<void> {
    if (!this.carregamento) this.carregamento = this.buscar();
    return this.carregamento;
  }

  recarregar(): Promise<void> {
    this.carregamento = this.buscar();
    return this.carregamento;
  }

  limpar() {
    this.carregamento = null;
    this.conta.set(null); this.direitos.set(null); this.assinatura.set(null);
    this.cobrancas.set([]); this.membros.set([]); this.radar.set(null); this.carregado.set(false);
  }

  private async buscar() {
    this.carregando.set(true);
    try {
      if (MODO_DEMO) { this.aplicarDemo(); return; }
      const db = supabase!;
      const uid = this.auth.usuario()!.id;
      await this.carregarPlanos();

      const { data: dir } = await db.rpc('my_entitlements');
      const direitos = (dir?.[0] ?? null) as Direitos | null;
      this.direitos.set(direitos);

      let conta: Conta | null = null;
      if (direitos) {
        const { data } = await db.from('accounts').select('*').eq('id', direitos.account_id).maybeSingle();
        conta = data as Conta | null;
      } else {
        const { data } = await db.from('accounts').select('*').eq('owner_id', uid).maybeSingle();
        conta = data as Conta | null;
      }
      this.conta.set(conta);
      if (!conta) return;

      const titular = conta.owner_id === uid;
      const [membros, radar, subs, pays] = await Promise.all([
        db.from('account_members').select('*').eq('account_id', conta.id).order('created_at'),
        db.from('radar_profiles').select('*').eq('account_id', conta.id).maybeSingle(),
        titular ? db.from('subscriptions').select('*').eq('account_id', conta.id).order('created_at', { ascending: false }).limit(1)
                : Promise.resolve({ data: [] }),
        titular ? db.from('payments').select('*').eq('account_id', conta.id).order('due_date', { ascending: false })
                : Promise.resolve({ data: [] }),
      ]);
      this.membros.set((membros.data ?? []) as Membro[]);
      this.radar.set((radar.data ?? null) as PerfilRadar | null);
      this.assinatura.set(((subs.data ?? [])[0] ?? null) as Assinatura | null);
      this.cobrancas.set((pays.data ?? []) as Cobranca[]);
    } finally {
      this.carregando.set(false);
      this.carregado.set(true);
    }
  }

  // ------------------------------------------------------------------ ações

  async criarConta(dados: NovaConta) {
    const limpo: NovaConta = {
      ...dados,
      cnpj: soDigitos(dados.cnpj),
      phone: soDigitos(dados.phone) || null,
      address_zip: soDigitos(dados.address_zip) || null,
      trade_name: dados.trade_name?.trim() || null,
      billing_email: dados.billing_email?.trim() || null,
    };
    if (MODO_DEMO) { demo.criarConta(limpo, this.auth.usuario()!); return this.recarregar(); }
    const { error } = await supabase!.from('accounts').insert({ ...limpo, owner_id: this.auth.usuario()!.id });
    if (error) throw new Error(traduzirErro(error.message));
    await this.recarregar();
  }

  async salvarConta(dados: Partial<NovaConta>) {
    const conta = this.conta()!;
    const limpo = {
      company_name: dados.company_name?.trim(),
      trade_name: dados.trade_name?.trim() || null,
      phone: soDigitos(dados.phone) || null,
      billing_email: dados.billing_email?.trim() || null,
      address_zip: soDigitos(dados.address_zip) || null,
      address_city: dados.address_city?.trim() || null,
      address_state: dados.address_state || null,
    };
    if (MODO_DEMO) { demo.salvarConta(limpo); return this.recarregar(); }
    const { error } = await supabase!.from('accounts').update(limpo).eq('id', conta.id);
    if (error) throw new Error(traduzirErro(error.message));
    await this.recarregar();
  }

  /** Devolve o link da fatura (nova assinatura) ou null quando foi troca de plano ou reativação dentro do período pago. */
  async contratar(plano: PlanoId): Promise<string | null> {
    if (MODO_DEMO) { const url = demo.contratar(plano); await this.recarregar(); return url; }
    const r = await chamarFuncao<{ invoice_url?: string; changed?: boolean }>('criar-checkout', { plan_id: plano });
    await this.recarregar();
    return r.invoice_url ?? null;
  }

  async cancelar(): Promise<string | null> {
    if (MODO_DEMO) { demo.cancelar(); await this.recarregar(); return this.assinatura()?.access_until ?? null; }
    const r = await chamarFuncao<{ access_until: string | null }>('cancelar-assinatura', {});
    await this.recarregar();
    return r.access_until;
  }

  async criarUsuario(name: string, email: string) {
    if (MODO_DEMO) { demo.criarUsuario(name, email); return this.recarregar(); }
    await chamarFuncao('gerenciar-usuarios', { action: 'criar', name, email });
    await this.recarregar();
  }

  async acaoUsuario(acao: AcaoUsuario, membro: Membro) {
    if (MODO_DEMO) { demo.acaoUsuario(acao, membro.id); return this.recarregar(); }
    await chamarFuncao('gerenciar-usuarios', { action: acao, member_id: membro.id });
    if (acao !== 'reenviar-acesso') await this.recarregar();
  }

  async salvarRadar(perfil: Omit<PerfilRadar, 'account_id'>) {
    const conta = this.conta()!;
    if (MODO_DEMO) { demo.salvarRadar(perfil); return this.recarregar(); }
    const { error } = await supabase!.from('radar_profiles').update(perfil).eq('account_id', conta.id);
    if (error) throw new Error(traduzirErro(error.message));
    await this.recarregar();
  }

  private aplicarDemo() {
    const e = demo.estado(this.auth.usuario()!);
    this.conta.set(e.conta); this.direitos.set(e.direitos); this.assinatura.set(e.assinatura);
    this.cobrancas.set(e.cobrancas); this.membros.set(e.membros); this.radar.set(e.radar);
  }
}
