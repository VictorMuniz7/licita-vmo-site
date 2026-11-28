import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { config } from '../../core/config';
import { PortalService } from '../../core/portal.service';
import { Logo } from '../../shared/logo';

/** Mostrada no lugar do cadastro/pagamento enquanto config.vendasAbertas = false. */
@Component({
  selector: 'app-em-breve',
  imports: [RouterLink, Logo],
  template: `
    <main class="escuro grade-fundo relative grid min-h-dvh place-items-center overflow-hidden bg-abismo px-4 py-16 text-claro">
      <svg class="pointer-events-none absolute -bottom-40 -right-32 h-[560px] w-[560px] opacity-[.08]" viewBox="0 0 600 600" aria-hidden="true"><polygon points="300,20 580,224 473,553 127,553 20,224" fill="none" stroke="#35D0D3" stroke-width="8"/></svg>

      <div class="relative w-full max-w-[560px]">
        <a routerLink="/" aria-label="Licita-VMO, página principal"><app-logo /></a>

        <div class="chanfro chanfro-g mt-10 bg-petroleo p-7 sm:p-10" role="status">
          <p class="inline-flex items-center gap-2 bg-[rgba(53,208,211,.1)] px-3 py-1.5 text-[.8rem] font-bold text-ciano ring-1 ring-inset ring-[rgba(53,208,211,.25)]">
            <span class="relative flex h-2 w-2"><span class="absolute inline-flex h-full w-full animate-ping bg-ciano opacity-60"></span><span class="relative inline-flex h-2 w-2 bg-ciano"></span></span>
            Lançamento em breve
          </p>
          <h1 class="titulo mt-5 text-[clamp(1.9rem,4vw,2.6rem)]">Estamos quase prontos para abrir as contratações.</h1>
          <p class="mt-4 text-lg leading-relaxed text-claro-2">
            @if (plano(); as p) { O plano <b class="text-claro">{{ p.name }}</b> ainda não está à venda. }
            @else { Os planos ainda não estão à venda. }
            Assim que o lançamento acontecer, você contrata por aqui mesmo, com Pix, boleto ou cartão.
          </p>

          <div class="mt-8 flex flex-wrap gap-3">
            <a routerLink="/" class="btn btn-ciano px-6 py-3.5">
              <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>
              Voltar para a página principal
            </a>
            <a [href]="whats()" target="_blank" rel="noopener" class="btn btn-fantasma px-6 py-3.5" aria-label="Quero ser avisado do lançamento pelo WhatsApp (abre em nova aba)">Quero ser avisado</a>
          </div>
        </div>
      </div>
    </main>
  `,
})
export class EmBreve {
  private portal = inject(PortalService);
  /** ?plano=radar|licita|combo (vem do botão de contratar) */
  plano_ = input<string | undefined>(undefined, { alias: 'plano' });

  protected plano = computed(() => this.portal.planos().find(p => p.id === this.plano_()));
  protected whats = computed(() => {
    const nome = this.plano()?.name;
    const txt = 'Olá! Quero ser avisado quando o Licita-VMO for lançado' + (nome ? ` (plano ${nome}).` : '.');
    return 'https://wa.me/' + config.whatsappComercial + '?text=' + encodeURIComponent(txt);
  });

  constructor() { this.portal.carregarPlanos(); }
}
