/**
 * Dados de exemplo do MODO DEMONSTRAÇÃO (config.supabaseUrl vazio).
 * Nada aqui é usado em produção.
 */
import type { UsuarioLogado } from './auth.service';
import {
  AcaoUsuario, Assinatura, Cobranca, Conta, Direitos, Membro, NovaConta, PerfilRadar, PlanoId, PLANOS_PADRAO,
} from './modelos';

interface Estado {
  conta: Conta | null;
  assinatura: Assinatura | null;
  cobrancas: Cobranca[];
  membros: Membro[];
  radar: PerfilRadar | null;
}

const CHAVE = 'licitavmo-demo-dados';
const hoje = () => new Date().toISOString().slice(0, 10);
const maisDias = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const id = () => Math.random().toString(36).slice(2, 10);

function exemplo(u: UsuarioLogado): Estado {
  const contaId = 'conta-demo';
  return {
    conta: {
      id: contaId, owner_id: u.id, company_name: 'Limpa Bem Distribuidora Ltda', trade_name: 'Limpa Bem',
      cnpj: '11222333000181', phone: '44999887766', billing_email: 'financeiro@limpabem.com.br',
      address_zip: '87013000', address_city: 'Maringá', address_state: 'PR', created_at: '2026-10-02T10:00:00Z',
    },
    assinatura: {
      id: 'sub-demo', account_id: contaId, plan_id: 'combo', status: 'active', price_cents: 24700,
      next_due_date: maisDias(26), access_until: maisDias(26), canceled_at: null, created_at: '2026-10-02T10:05:00Z',
    },
    cobrancas: [
      { id: 'p2', asaas_payment_id: 'pay_demo2', value_cents: 24700, status: 'PENDING', billing_type: 'UNDEFINED',
        due_date: maisDias(26), paid_at: null, invoice_url: '#', description: 'Radar + Gestão · Limpa Bem' },
      { id: 'p1', asaas_payment_id: 'pay_demo1', value_cents: 24700, status: 'RECEIVED', billing_type: 'PIX',
        due_date: maisDias(-4), paid_at: maisDias(-4), invoice_url: '#', description: 'Radar + Gestão · Limpa Bem' },
    ],
    membros: [
      { id: 'm1', account_id: contaId, user_id: u.id, name: u.name || 'Marcos Ribeiro', email: u.email, role: 'owner', active: true, created_at: '2026-10-02T10:00:00Z' },
      { id: 'm2', account_id: contaId, user_id: 'u2', name: 'Juliana Prado', email: 'juliana@limpabem.com.br', role: 'member', active: true, created_at: '2026-10-03T14:00:00Z' },
      { id: 'm3', account_id: contaId, user_id: 'u3', name: 'Rafael Souza', email: 'rafael@limpabem.com.br', role: 'member', active: false, created_at: '2026-10-05T09:30:00Z' },
    ],
    radar: {
      account_id: contaId, keywords: ['material de limpeza', 'higiene', 'descartáveis'], excluded_keywords: ['obra'],
      cnaes: ['4649-4/08'], states: ['PR', 'SP'], cities: ['Maringá', 'Londrina', 'Presidente Prudente'],
      min_value_cents: 1000000, max_value_cents: 50000000, only_me_epp: false,
      whatsapp_numbers: ['44999887766'], audio_summary: true, alert_hour: 6,
    },
  };
}

function ler(u: UsuarioLogado): Estado {
  try {
    const s = localStorage.getItem(CHAVE);
    if (s) return JSON.parse(s);
  } catch { /* ignore */ }
  const novo = localStorage.getItem('licitavmo-demo-novo') === '1';
  const e: Estado = novo ? { conta: null, assinatura: null, cobrancas: [], membros: [], radar: null } : exemplo(u);
  gravar(e);
  return e;
}

function gravar(e: Estado) { try { localStorage.setItem(CHAVE, JSON.stringify(e)); } catch { /* ignore */ } }

let atual: Estado | null = null;
let dono: UsuarioLogado | null = null;
const st = () => atual!;

function direitos(e: Estado): Direitos | null {
  if (!e.conta) return null;
  const s = e.assinatura;
  const vale = !!s && (s.status === 'active' || s.status === 'overdue' || (s.status === 'canceled' && (s.access_until ?? '') >= hoje()));
  const p = PLANOS_PADRAO.find(x => x.id === s?.plan_id);
  return {
    account_id: e.conta.id, company_name: e.conta.company_name, role: 'owner',
    plan_id: s?.plan_id ?? null, status: s?.status ?? null,
    licita: vale && !!p?.includes_licita, radar: vale && !!p?.includes_radar,
  };
}

export const demo = {
  estado(u: UsuarioLogado) {
    if (!atual || dono?.id !== u.id) { atual = ler(u); dono = u; }
    const copia = structuredClone(st());   // cópia nova a cada leitura, como viria do banco
    return { ...copia, direitos: direitos(copia) };
  },

  criarConta(d: NovaConta, u: UsuarioLogado) {
    const contaId = 'conta-' + id();
    st().conta = { ...d, id: contaId, owner_id: u.id, created_at: new Date().toISOString() } as Conta;
    st().membros = [{ id: id(), account_id: contaId, user_id: u.id, name: u.name, email: u.email, role: 'owner', active: true, created_at: new Date().toISOString() }];
    st().radar = { account_id: contaId, keywords: [], excluded_keywords: [], cnaes: [], states: [], cities: [], min_value_cents: null,
      max_value_cents: null, only_me_epp: false, whatsapp_numbers: [], audio_summary: true, alert_hour: 6 };
    gravar(st());
  },

  salvarConta(d: Partial<Conta>) { Object.assign(st().conta!, d); gravar(st()); },

  contratar(plano: PlanoId): string | null {
    const p = PLANOS_PADRAO.find(x => x.id === plano)!;
    const s = st().assinatura;
    if (s && (s.status === 'active' || s.status === 'overdue')) {
      s.plan_id = plano; s.price_cents = p.price_cents!; gravar(st()); return null;
    }
    // cancelada com período pago restante: reativa sem cobrar, próxima fatura no fim do período
    if (s && s.status === 'canceled' && (s.access_until ?? '') >= hoje()) {
      st().assinatura = { ...s, id: id(), plan_id: plano, status: 'active', price_cents: p.price_cents!,
        next_due_date: s.access_until, canceled_at: null, created_at: new Date().toISOString() };
      gravar(st()); return null;
    }
    // no demo a "fatura" é paga na hora
    st().assinatura = { id: id(), account_id: st().conta!.id, plan_id: plano, status: 'active', price_cents: p.price_cents!,
      next_due_date: maisDias(30), access_until: maisDias(30), canceled_at: null, created_at: new Date().toISOString() };
    st().cobrancas.unshift({ id: id(), asaas_payment_id: 'pay_' + id(), value_cents: p.price_cents!, status: 'RECEIVED',
      billing_type: 'PIX', due_date: hoje(), paid_at: hoje(), invoice_url: '#', description: p.name });
    gravar(st());
    return '/painel?pago=1';
  },

  cancelar() {
    const s = st().assinatura!;
    s.status = 'canceled'; s.canceled_at = new Date().toISOString(); s.access_until = s.next_due_date;
    st().cobrancas = st().cobrancas.filter(c => c.status !== 'PENDING');
    gravar(st());
  },

  criarUsuario(name: string, email: string) {
    if (st().membros.length >= 4) throw new Error('Sua conta já tem 4 usuários, o máximo do plano.');
    if (st().membros.some(m => m.email === email)) throw new Error('Este e-mail já tem cadastro. Use outro e-mail para este usuário.');
    st().membros.push({ id: id(), account_id: st().conta!.id, user_id: id(), name, email, role: 'member', active: true, created_at: new Date().toISOString() });
    gravar(st());
  },

  acaoUsuario(acao: AcaoUsuario, membroId: string) {
    const m = st().membros.find(x => x.id === membroId)!;
    if (acao === 'ativar') m.active = true;
    if (acao === 'desativar') m.active = false;
    if (acao === 'remover') st().membros = st().membros.filter(x => x.id !== membroId);
    gravar(st());
  },

  salvarRadar(p: Omit<PerfilRadar, 'account_id'>) { Object.assign(st().radar!, p); gravar(st()); },

  resetar() { atual = null; try { localStorage.removeItem(CHAVE); } catch { /* ignore */ } },
};
