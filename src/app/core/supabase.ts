import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config, MODO_DEMO } from './config';

/** Cliente único. Nulo no modo demonstração. */
export const supabase: SupabaseClient | null = MODO_DEMO
  ? null
  : createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });

/** Chama uma Edge Function e devolve a mensagem de erro dela, se houver. */
export async function chamarFuncao<T>(nome: string, corpo: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase!.functions.invoke(nome, { body: corpo });
  if (error) {
    let msg = 'Não foi possível concluir. Tente de novo.';
    try {
      const ctx = (error as { context?: Response }).context;
      const body = ctx ? await ctx.json() : null;
      if (body?.error) msg = body.error;
    } catch { /* mantém mensagem padrão */ }
    throw new Error(msg);
  }
  return data as T;
}
