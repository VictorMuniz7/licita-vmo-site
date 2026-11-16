// Recebe os eventos do Asaas e atualiza assinaturas e cobranças.
// Configure no Asaas: URL desta função + token igual a ASAAS_WEBHOOK_TOKEN.
// Publique com --no-verify-jwt (o Asaas não envia JWT do Supabase).
import { admin, json } from '../_shared/comum.ts';
import { centavos, type AsaasCobranca } from '../_shared/asaas.ts';

const PAGO = new Set(['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED']);
const FIM_ASSINATURA = new Set(['SUBSCRIPTION_DELETED', 'SUBSCRIPTION_INACTIVATED']);

function maisUmMes(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(a, m, 1));            // primeiro dia do mês seguinte
  const ultimo = new Date(Date.UTC(a, m + 1, 0)).getUTCDate();
  dt.setUTCDate(Math.min(d, ultimo));
  return dt.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: true });
  if (req.headers.get('asaas-access-token') !== Deno.env.get('ASAAS_WEBHOOK_TOKEN')) {
    return json({ error: 'token inválido' }, 401);
  }

  const evento = await req.json().catch(() => null) as
    { id?: string; event?: string; payment?: AsaasCobranca; subscription?: { id: string } } | null;
  if (!evento?.event) return json({ ok: true });

  const db = admin();

  // Idempotência: o Asaas pode reenviar o mesmo evento
  if (evento.id) {
    const { error } = await db.from('billing_events').insert({ id: evento.id, event: evento.event, payload: evento });
    if (error?.code === '23505') return json({ ok: true, repetido: true });
  }

  try {
    if (evento.payment) await tratarCobranca(db, evento.event, evento.payment);
    if (FIM_ASSINATURA.has(evento.event) && evento.subscription?.id) {
      const { data: sub } = await db.from('subscriptions').select('*')
        .eq('asaas_subscription_id', evento.subscription.id).maybeSingle();
      if (sub && sub.status !== 'canceled') {
        await db.from('subscriptions').update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          access_until: sub.status === 'pending' ? null : sub.next_due_date,
        }).eq('id', sub.id);
      }
    }
    return json({ ok: true });
  } catch (e) {
    console.error(e);
    // devolve 500 para o Asaas tentar de novo; libera o evento para reprocessar
    if (evento.id) await db.from('billing_events').delete().eq('id', evento.id);
    return json({ error: 'falha ao processar' }, 500);
  }
});

async function tratarCobranca(db: ReturnType<typeof admin>, tipo: string, p: AsaasCobranca) {
  if (!p.subscription) return; // cobrança avulsa: fora do escopo do portal

  const { data: sub } = await db.from('subscriptions').select('*')
    .eq('asaas_subscription_id', p.subscription).maybeSingle();
  if (!sub) { console.warn('assinatura desconhecida', p.subscription); return; }

  await db.from('payments').upsert({
    account_id: sub.account_id,
    subscription_id: sub.id,
    asaas_payment_id: p.id,
    value_cents: centavos(p.value),
    status: tipo === 'PAYMENT_DELETED' ? 'DELETED' : p.status,
    billing_type: p.billingType,
    due_date: p.dueDate,
    paid_at: p.paymentDate ?? p.confirmedDate ?? null,
    invoice_url: p.invoiceUrl,
    description: p.description ?? null,
  }, { onConflict: 'asaas_payment_id' });

  if (sub.status === 'canceled') return;

  if (PAGO.has(tipo)) {
    const proxima = maisUmMes(p.dueDate);
    await db.from('subscriptions').update({ status: 'active', next_due_date: proxima, access_until: proxima }).eq('id', sub.id);
  } else if (tipo === 'PAYMENT_OVERDUE' && sub.status === 'active') {
    await db.from('subscriptions').update({ status: 'overdue', next_due_date: p.dueDate }).eq('id', sub.id);
  }
}
