// Cliente mínimo da API v3 do Asaas.
// ASAAS_ENV=sandbox (padrão) ou production. Chave em ASAAS_API_KEY.
import { ErroHttp } from './comum.ts';

const BASE = (Deno.env.get('ASAAS_ENV') ?? 'sandbox') === 'production'
  ? 'https://api.asaas.com/v3'
  : 'https://api-sandbox.asaas.com/v3';

async function chamar<T>(metodo: string, caminho: string, corpo?: unknown): Promise<T> {
  const resp = await fetch(BASE + caminho, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'licita-vmo-portal',
      'access_token': Deno.env.get('ASAAS_API_KEY')!,
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const texto = await resp.text();
  const dados = texto ? JSON.parse(texto) : {};
  if (!resp.ok) {
    console.error('Asaas', metodo, caminho, resp.status, texto);
    const msg = dados?.errors?.[0]?.description ?? 'Não foi possível falar com o sistema de pagamento.';
    throw new ErroHttp(502, msg);
  }
  return dados as T;
}

export interface AsaasCobranca {
  id: string;
  subscription?: string;
  customer: string;
  value: number;
  status: string;
  billingType: string;
  dueDate: string;
  paymentDate?: string | null;
  confirmedDate?: string | null;
  invoiceUrl: string;
  description?: string;
  externalReference?: string | null;
}

export interface AsaasAssinatura {
  id: string;
  customer: string;
  value: number;
  nextDueDate: string;
  status: string;
  externalReference?: string | null;
}

export const asaas = {
  criarCliente: (c: {
    name: string; cpfCnpj: string; email: string; mobilePhone?: string | null;
    postalCode?: string | null; externalReference: string;
  }) => chamar<{ id: string }>('POST', '/customers', { ...c, notificationDisabled: false }),

  atualizarCliente: (id: string, c: Record<string, unknown>) =>
    chamar<{ id: string }>('PUT', `/customers/${id}`, c),

  /** billingType UNDEFINED: o cliente escolhe Pix, boleto ou cartão na fatura do Asaas. */
  criarAssinatura: (a: {
    customer: string; value: number; nextDueDate: string; description: string; externalReference: string;
  }) => chamar<AsaasAssinatura>('POST', '/subscriptions', { ...a, billingType: 'UNDEFINED', cycle: 'MONTHLY' }),

  atualizarAssinatura: (id: string, a: { value: number; description: string; updatePendingPayments: boolean }) =>
    chamar<AsaasAssinatura>('PUT', `/subscriptions/${id}`, a),

  cancelarAssinatura: (id: string) => chamar<{ deleted: boolean }>('DELETE', `/subscriptions/${id}`),

  cobrancasDaAssinatura: (id: string) =>
    chamar<{ data: AsaasCobranca[] }>('GET', `/subscriptions/${id}/payments`),
};

export const reais = (centavos: number) => Math.round(centavos) / 100;
export const centavos = (valor: number) => Math.round(valor * 100);
