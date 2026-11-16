import { Component, inject } from '@angular/core';
import { data, reais } from '../../core/formato';
import { PortalService } from '../../core/portal.service';

const STATUS: Record<string, { t: string; c: string }> = {
  PENDING: { t: 'Aberta', c: 'selo-neutro' },
  AWAITING_RISK_ANALYSIS: { t: 'Em análise', c: 'selo-neutro' },
  RECEIVED: { t: 'Paga', c: 'selo-ok' },
  CONFIRMED: { t: 'Paga', c: 'selo-ok' },
  RECEIVED_IN_CASH: { t: 'Paga', c: 'selo-ok' },
  OVERDUE: { t: 'Vencida', c: 'selo-atencao' },
  REFUNDED: { t: 'Estornada', c: 'selo-neutro' },
  REFUND_REQUESTED: { t: 'Estorno pedido', c: 'selo-neutro' },
  CHARGEBACK_REQUESTED: { t: 'Contestada', c: 'selo-erro' },
  DELETED: { t: 'Cancelada', c: 'selo-neutro' },
};

const FORMA: Record<string, string> = { PIX: 'Pix', BOLETO: 'Boleto', CREDIT_CARD: 'Cartão', UNDEFINED: 'A escolher' };

@Component({
  selector: 'app-faturas',
  template: `
    <header class="mb-8">
      <p class="rotulo text-pentagono">Financeiro</p>
      <h1 class="titulo mt-2 text-[clamp(1.8rem,3vw,2.5rem)]">Faturas</h1>
      <p class="mt-2 text-tinta-2">As faturas também chegam no e-mail <b>{{ portal.conta()?.billing_email }}</b>.</p>
    </header>

    @if (!portal.cobrancas().length) {
      <div class="cartao text-tinta-2">Nenhuma fatura ainda.</div>
    } @else {
      <div class="cartao overflow-x-auto p-0!">
        <table class="w-full min-w-[620px] text-[.93rem]">
          <thead>
            <tr class="border-b border-linha text-left text-xs text-tinta-suave">
              <th class="px-5 py-3 font-semibold">Vencimento</th>
              <th class="px-5 py-3 font-semibold">Descrição</th>
              <th class="px-5 py-3 font-semibold">Forma</th>
              <th class="px-5 py-3 text-right font-semibold">Valor</th>
              <th class="px-5 py-3 font-semibold">Situação</th>
              <th class="px-5 py-3"><span class="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            @for (c of portal.cobrancas(); track c.id) {
              <tr class="border-b border-linha last:border-0">
                <td class="px-5 py-3.5 tabular-nums">{{ dt(c.due_date) }}</td>
                <td class="px-5 py-3.5">{{ c.description || 'Mensalidade' }}</td>
                <td class="px-5 py-3.5">{{ forma(c.billing_type) }}</td>
                <td class="px-5 py-3.5 text-right font-bold tabular-nums">{{ reais(c.value_cents, false) }}</td>
                <td class="px-5 py-3.5">
                  <span class="selo" [class]="status(c.status).c">{{ status(c.status).t }}</span>
                  @if (c.paid_at) { <span class="ml-2 text-xs text-tinta-suave">em {{ dt(c.paid_at) }}</span> }
                </td>
                <td class="px-5 py-3.5 text-right">
                  @if (c.invoice_url && c.status !== 'DELETED') {
                    <a [href]="c.invoice_url" target="_blank" rel="noopener" class="whitespace-nowrap font-semibold text-pentagono hover:underline">
                      {{ c.status === 'PENDING' || c.status === 'OVERDUE' ? 'Pagar ↗' : 'Comprovante ↗' }}
                    </a>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
    <p class="mt-6 text-xs text-tinta-suave">Cobranças processadas pelo Asaas. O comprovante fica disponível na própria fatura depois do pagamento.</p>
  `,
})
export class Faturas {
  protected portal = inject(PortalService);
  protected dt = data;
  protected reais = reais;
  protected status = (s: string) => STATUS[s] ?? { t: s, c: 'selo-neutro' };
  protected forma = (f: string | null) => FORMA[f ?? ''] ?? '—';
}
