// POST { plan_id: 'radar' | 'licita' | 'combo' }
// Assina um plano (ou troca o plano atual) e devolve o link da fatura do Asaas.
// Quem cancelou e volta dentro do período pago é reativado sem cobrança imediata ({ reactivated }).
import {
  admin, contaDoTitular, ErroHttp, hojeISO, json, lerCorpo, preflight, responderErro, usuarioDaRequisicao,
} from '../_shared/comum.ts';
import { asaas, centavos, reais } from '../_shared/asaas.ts';

Deno.serve(async (req) => {
  const pf = preflight(req); if (pf) return pf;
  try {
    const user = await usuarioDaRequisicao(req);
    const { plan_id } = await lerCorpo<{ plan_id?: string }>(req);
    const db = admin();
    const conta = await contaDoTitular(db, user.id);

    const { data: plano } = await db.from('plans').select('*').eq('id', plan_id ?? '').eq('active', true).maybeSingle();
    if (!plano) throw new ErroHttp(404, 'Plano não encontrado.');
    if (plano.price_cents == null) throw new ErroHttp(409, 'Este plano ainda não está à venda.');

    const descricao = `${plano.name} · ${conta.trade_name || conta.company_name}`;

    // Assinatura "viva" atual, se houver
    const { data: atual } = await db.from('subscriptions').select('*')
      .eq('account_id', conta.id).in('status', ['pending', 'active', 'overdue']).maybeSingle();

    if (atual && atual.plan_id === plano.id) {
      if (atual.status === 'pending') return json({ invoice_url: await faturaPendente(db, atual.id) });
      throw new ErroHttp(409, 'Você já tem este plano.');
    }

    // Troca de plano com assinatura já paga: muda o valor a partir da próxima cobrança
    if (atual && atual.status !== 'pending') {
      await asaas.atualizarAssinatura(atual.asaas_subscription_id, {
        value: reais(plano.price_cents), description: descricao, updatePendingPayments: true,
      });
      await db.from('subscriptions').update({ plan_id: plano.id, price_cents: plano.price_cents }).eq('id', atual.id);
      return json({ changed: true, plan_id: plano.id });
    }

    // Havia uma assinatura nunca paga de outro plano: descarta e começa de novo
    if (atual && atual.status === 'pending') {
      if (atual.asaas_subscription_id) await asaas.cancelarAssinatura(atual.asaas_subscription_id).catch(() => null);
      await db.from('subscriptions').update({ status: 'canceled', canceled_at: new Date().toISOString() }).eq('id', atual.id);
    }

    // Cliente no Asaas
    let customerId = conta.asaas_customer_id;
    if (!customerId) {
      const cli = await asaas.criarCliente({
        name: conta.company_name,
        cpfCnpj: conta.cnpj,
        email: conta.billing_email || user.email!,
        mobilePhone: conta.phone,
        postalCode: conta.address_zip,
        externalReference: conta.id,
      });
      customerId = cli.id;
      await db.from('accounts').update({ asaas_customer_id: customerId }).eq('id', conta.id);
    }

    // Cancelou, mas ainda está dentro do período pago: reativa sem cobrar agora.
    // A primeira fatura da nova assinatura vence no dia em que o período pago acaba.
    const { data: cancelada } = await db.from('subscriptions').select('*')
      .eq('account_id', conta.id).eq('status', 'canceled').gte('access_until', hojeISO())
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (cancelada) {
      const vence = cancelada.access_until as string;
      const { data: nova, error } = await db.from('subscriptions').insert({
        account_id: conta.id, plan_id: plano.id, price_cents: plano.price_cents, status: 'active',
        next_due_date: vence, access_until: vence,
      }).select().single();
      if (error) throw error;
      try {
        const sub = await asaas.criarAssinatura({
          customer: customerId,
          value: reais(plano.price_cents),
          nextDueDate: vence,
          description: descricao,
          externalReference: nova.id,
        });
        await db.from('subscriptions').update({ asaas_subscription_id: sub.id }).eq('id', nova.id);
      } catch (e) {
        // sem assinatura no Asaas a reativação não vale: volta ao estado cancelado
        await db.from('subscriptions').delete().eq('id', nova.id);
        throw e;
      }
      return json({ reactivated: true, next_due_date: vence });
    }

    const { data: nova, error } = await db.from('subscriptions').insert({
      account_id: conta.id, plan_id: plano.id, price_cents: plano.price_cents, status: 'pending',
    }).select().single();
    if (error) throw error;

    const sub = await asaas.criarAssinatura({
      customer: customerId,
      value: reais(plano.price_cents),
      nextDueDate: hojeISO(),
      description: descricao,
      externalReference: nova.id,
    });
    await db.from('subscriptions').update({ asaas_subscription_id: sub.id, next_due_date: sub.nextDueDate }).eq('id', nova.id);

    // Primeira cobrança é gerada na hora pelo Asaas
    const { data: cobrancas } = await asaas.cobrancasDaAssinatura(sub.id);
    const primeira = cobrancas?.[0];
    if (!primeira) throw new ErroHttp(502, 'A fatura ainda está sendo gerada. Veja em "Faturas" em instantes.');
    await db.from('payments').upsert({
      account_id: conta.id,
      subscription_id: nova.id,
      asaas_payment_id: primeira.id,
      value_cents: centavos(primeira.value),
      status: primeira.status,
      billing_type: primeira.billingType,
      due_date: primeira.dueDate,
      invoice_url: primeira.invoiceUrl,
      description: descricao,
    }, { onConflict: 'asaas_payment_id' });

    return json({ invoice_url: primeira.invoiceUrl });
  } catch (e) {
    return responderErro(e);
  }
});

async function faturaPendente(db: ReturnType<typeof admin>, subscriptionId: string): Promise<string> {
  const { data } = await db.from('payments').select('invoice_url')
    .eq('subscription_id', subscriptionId).in('status', ['PENDING', 'OVERDUE'])
    .order('due_date', { ascending: false }).limit(1).maybeSingle();
  if (!data?.invoice_url) throw new ErroHttp(409, 'Sua assinatura está aguardando pagamento. Veja em "Faturas".');
  return data.invoice_url;
}
