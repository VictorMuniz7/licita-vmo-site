// Utilitários compartilhados pelas Edge Functions do portal.
import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2';

export const SITE_URL = Deno.env.get('SITE_URL') ?? 'http://localhost:4200';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('CORS_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function preflight(req: Request): Response | null {
  return req.method === 'OPTIONS' ? new Response('ok', { headers: corsHeaders }) : null;
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export class ErroHttp extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function responderErro(e: unknown): Response {
  if (e instanceof ErroHttp) return json({ error: e.message }, e.status);
  console.error(e);
  return json({ error: 'Erro inesperado. Tente de novo em instantes.' }, 500);
}

/** Cliente com service role: ignora RLS. Use só depois de checar permissão. */
export function admin(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Usuário dono do token enviado pelo front. */
export async function usuarioDaRequisicao(req: Request): Promise<User> {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) throw new ErroHttp(401, 'Faça login para continuar.');
  const { data, error } = await admin().auth.getUser(token);
  if (error || !data.user) throw new ErroHttp(401, 'Sessão expirada. Entre de novo.');
  return data.user;
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
  asaas_customer_id: string | null;
}

/** Conta da qual o usuário é titular. Só o titular compra e gerencia. */
export async function contaDoTitular(db: SupabaseClient, userId: string): Promise<Conta> {
  const { data, error } = await db.from('accounts').select('*').eq('owner_id', userId).maybeSingle();
  if (error) throw error;
  if (!data) throw new ErroHttp(403, 'Só o titular da conta pode fazer isso.');
  return data as Conta;
}

export async function lerCorpo<T>(req: Request): Promise<T> {
  try { return await req.json() as T; } catch { throw new ErroHttp(400, 'Requisição inválida.'); }
}

export function hojeISO(): string {
  // data no fuso de Brasília
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}
