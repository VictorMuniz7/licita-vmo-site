import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { data, hojeISO, reais } from '../../core/formato';
import { PortalService } from '../../core/portal.service';

@Component({
  selector: 'app-assinatura',
  imports: [RouterLink],
  template: `
    <header class="mb-8">
      <p class="rotulo text-pentagono">Financeiro</p>
      <h1 class="titulo mt-2 text-[clamp(1.8rem,3vw,2.5rem)]">Assinatura</h1>
    </header>

    @if (msg()) { <p class="aviso aviso-ok mb-6" role="status">{{ msg() }}</p> }
    @if (erro()) { <p class="aviso aviso-erro mb-6" role="alert">{{ erro() }}</p> }

    <!-- Plano atual -->
    <section class="chanfro chanfro-g bg-petroleo p-6 text-claro sm:p-8">
      @if (portal.assinatura(); as s) {
        <div class="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p class="rotulo text-ciano">Plano atual</p>
            <h2 class="subtitulo mt-2 text-3xl">{{ portal.planoAtual()?.name }}</h2>
            <p class="mt-2 text-claro-2">{{ reais(s.price_cents, false) }} por mês · contratado em {{ dt(s.created_at) }}</p>
          </div>
          <span class="selo" [class]="selo().c">{{ selo().t }}</span>
        </div>
        <dl class="mt-6 grid gap-4 border-t border-[rgba(53,208,211,.2)] pt-5 text-sm sm:grid-cols-3">
          <div><dt class="text-claro-suave">Radar de licitações</dt><dd class="mt-1 font-bold">{{ portal.planoAtual()?.includes_radar ? 'Incluso' : 'Não incluso' }}</dd></div>
          <div><dt class="text-claro-suave">Licita-VMO</dt><dd class="mt-1 font-bold">{{ portal.planoAtual()?.includes_licita ? 'Incluso, até 4 usuários' : 'Não incluso' }}</dd></div>
          <div>
            @if (s.status === 'canceled') {
              <dt class="text-claro-suave">Acesso até</dt><dd class="mt-1 font-bold">{{ dt(s.access_until) }}</dd>
            } @else {
              <dt class="text-claro-suave">Próxima cobrança</dt><dd class="mt-1 font-bold">{{ dt(s.next_due_date) }}</dd>
            }
          </div>
        </dl>
        @if (s.status === 'canceled' && s.access_until && s.access_until >= hoje()) {
          <div class="mt-5 flex flex-wrap items-center gap-4 border-t border-[rgba(53,208,211,.2)] pt-5">
            <p class="text-sm text-claro-2">Mudou de ideia? Reative e nada é cobrado agora: a próxima fatura vence em {{ dt(s.access_until) }}.</p>
            <a [routerLink]="['/contratar', s.plan_id]" class="btn btn-ciano btn-sm">Reativar assinatura</a>
          </div>
        }
      } @else {
        <p class="text-claro-2">Nenhum plano contratado.</p>
        <a routerLink="/planos" class="btn btn-ciano mt-5">Ver planos</a>
      }
    </section>

    <!-- Trocar -->
    @if (vivo()) {
      <section class="mt-10">
        <h2 class="subtitulo text-xl">Trocar de plano</h2>
        <p class="mt-1 text-sm text-tinta-2">O novo valor vale a partir da próxima fatura.</p>
        <div class="mt-4 grid gap-4 md:grid-cols-3">
          @for (p of outros(); track p.id) {
            <div class="cartao grid content-start gap-3">
              <div class="flex items-baseline justify-between gap-3">
                <h3 class="subtitulo text-lg">{{ p.name }}</h3>
                <span class="font-bold">{{ reais(p.price_cents) }}<small class="font-normal text-tinta-suave">/mês</small></span>
              </div>
              <p class="text-sm text-tinta-2">{{ p.tagline }}</p>
              <a [routerLink]="['/contratar', p.id]" class="btn btn-claro btn-sm justify-self-start">Mudar para {{ p.name }}</a>
            </div>
          }
        </div>
      </section>

      <!-- Cancelar -->
      <section class="mt-12 border-t border-linha pt-8">
        <h2 class="subtitulo text-xl">Cancelar assinatura</h2>
        @if (!confirmar()) {
          <p class="mt-2 max-w-[62ch] text-sm text-tinta-2">Sem multa e sem fidelidade. Nenhuma cobrança nova é gerada e o acesso continua até o fim do período já pago.</p>
          <button type="button" class="btn btn-perigo btn-sm mt-4" (click)="confirmar.set(true)">Cancelar assinatura</button>
        } @else {
          <div class="mt-4 max-w-[640px] border-l-4 border-erro bg-white p-5">
            <p class="font-bold">Tem certeza?</p>
            <ul class="mt-3 grid gap-1.5 text-sm text-tinta-2">
              @if (portal.assinatura()?.status === 'pending') {
                <li class="marcador">A contratação pendente é descartada e a fatura em aberto é cancelada.</li>
              } @else {
                <li class="marcador">Seus serviços continuam até {{ dt(portal.assinatura()?.next_due_date) }}.</li>
                <li class="marcador">Depois disso, os alertas param e os {{ portal.membros().length }} usuário(s) perdem o acesso ao Licita-VMO.</li>
                <li class="marcador">Os dados ficam guardados se você voltar.</li>
              }
            </ul>
            <div class="mt-5 flex flex-wrap gap-3">
              <button type="button" class="btn btn-perigo btn-sm" (click)="cancelar()" [disabled]="enviando()">{{ enviando() ? 'Cancelando…' : 'Sim, cancelar' }}</button>
              <button type="button" class="btn btn-claro btn-sm" (click)="confirmar.set(false)">Manter assinatura</button>
            </div>
          </div>
        }
      </section>
    }
  `,
})
export class Assinatura {
  protected portal = inject(PortalService);
  protected dt = data;
  protected reais = reais;
  protected hoje = hojeISO;
  protected confirmar = signal(false);
  protected enviando = signal(false);
  protected erro = signal('');
  protected msg = signal('');

  protected vivo = computed(() => {
    const s = this.portal.assinatura()?.status;
    return s === 'active' || s === 'overdue' || s === 'pending';
  });
  protected outros = computed(() => this.portal.planos().filter(p => p.id !== this.portal.assinatura()?.plan_id && p.price_cents != null));
  protected selo = computed(() => ({
    active: { t: 'Ativa', c: 'selo-ok' },
    pending: { t: 'Aguardando pagamento', c: 'selo-atencao' },
    overdue: { t: 'Fatura vencida', c: 'selo-atencao' },
    canceled: { t: 'Cancelada', c: 'selo-neutro' },
  }[this.portal.assinatura()?.status ?? 'canceled']));

  async cancelar() {
    this.erro.set(''); this.enviando.set(true);
    try {
      const ate = await this.portal.cancelar();
      this.msg.set(ate ? `Assinatura cancelada. Seu acesso continua até ${data(ate)}.` : 'Contratação cancelada.');
      this.confirmar.set(false);
    } catch (e) { this.erro.set((e as Error).message); }
    finally { this.enviando.set(false); }
  }
}
