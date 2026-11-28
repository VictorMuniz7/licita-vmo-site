export type PlanoId = 'radar' | 'licita' | 'combo';

export interface Plano {
  id: PlanoId;
  name: string;
  tagline: string | null;
  price_cents: number | null;
  includes_radar: boolean;
  includes_licita: boolean;
  max_users: number;
  features: string[];
  highlight: boolean;
  sort: number;
}

export interface Conta {
  id: string;
  owner_id: string;
  company_name: string;
  trade_name: string | null;
  cnpj: string;
  phone: string | null;
  billing_email: string | null;
  address_zip: string | null;
  address_city: string | null;
  address_state: string | null;
  created_at: string;
}

export type NovaConta = Pick<Conta, 'company_name' | 'trade_name' | 'cnpj' | 'phone' | 'billing_email' | 'address_zip' | 'address_city' | 'address_state'>;

export type StatusAssinatura = 'pending' | 'active' | 'overdue' | 'canceled';

export interface Assinatura {
  id: string;
  account_id: string;
  plan_id: PlanoId;
  status: StatusAssinatura;
  price_cents: number;
  next_due_date: string | null;
  access_until: string | null;
  canceled_at: string | null;
  created_at: string;
}

export interface Cobranca {
  id: string;
  asaas_payment_id: string;
  value_cents: number;
  status: string;
  billing_type: string | null;
  due_date: string | null;
  paid_at: string | null;
  invoice_url: string | null;
  description: string | null;
}

export interface Membro {
  id: string;
  account_id: string;
  user_id: string;
  name: string;
  email: string;
  role: 'owner' | 'member';
  active: boolean;
  created_at: string;
}

export interface PerfilRadar {
  account_id: string;
  keywords: string[];
  excluded_keywords: string[];
  cnaes: string[];
  states: string[];
  cities: string[];
  min_value_cents: number | null;
  max_value_cents: number | null;
  only_me_epp: boolean;
  whatsapp_numbers: string[];
  audio_summary: boolean;
  alert_hour: number;
}

export interface Direitos {
  account_id: string;
  company_name: string;
  role: 'owner' | 'member';
  plan_id: PlanoId | null;
  status: StatusAssinatura | null;
  licita: boolean;
  radar: boolean;
}

export type AcaoUsuario = 'ativar' | 'desativar' | 'remover' | 'reenviar-acesso';

/** Planos exibidos se o banco estiver fora do ar ou no modo demonstração. */
export const PLANOS_PADRAO: Plano[] = [
  {
    id: 'radar', name: 'Radar', tagline: 'Encontre e entenda cada licitação sem abrir o edital',
    price_cents: 9700, includes_radar: true, includes_licita: false, max_users: 4, highlight: false, sort: 1,
    features: ['Alertas filtrados pelo perfil da empresa', 'Resumo do edital em texto e em áudio no WhatsApp',
      'Perguntas ao edital pelo WhatsApp', 'Lembrete de todos os prazos', 'Cofre com até 10 certidões'],
  },
  {
    id: 'licita', name: 'Licita-VMO', tagline: 'Gestão completa dos processos de licitação da empresa',
    price_cents: 19700, includes_radar: false, includes_licita: true, max_users: 4, highlight: false, sort: 2,
    features: ['Licitações, itens e prazos da equipe num lugar só', 'Proposta e declarações em PDF',
      'Atas, contratos e anexos guardados', 'Relatórios de ganhas, perdidas e contratantes',
      'Cofre de certidões com alerta de vencimento', 'Até 4 usuários com perfis e auditoria'],
  },
  {
    id: 'combo', name: 'Radar + Gestão', tagline: 'Do alerta no WhatsApp à proposta pronta',
    price_cents: 24700, includes_radar: true, includes_licita: true, max_users: 4, highlight: true, sort: 3,
    features: ['Tudo do Radar e do Licita-VMO', 'Licitação encontrada vira processo com um toque',
      'Compatibilidade pelos atestados e certidões', 'Aviso de quais licitações cada certidão vencida trava', 'Até 4 usuários com acesso'],
  },
];
