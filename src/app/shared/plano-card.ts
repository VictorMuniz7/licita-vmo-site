import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Plano } from '../core/modelos';

@Component({
  selector: 'app-plano-card',
  imports: [RouterLink],
  template: `
    <article class="chanfro chanfro-g relative flex h-full flex-col gap-4 p-6 sm:p-7"
             [class]="plano().highlight ? 'bg-ciano text-abismo' : 'bg-petroleo text-claro'">
      @if (plano().highlight) {
        <span class="absolute right-6 top-6 bg-abismo px-2 py-1 text-[.7rem] font-extrabold uppercase tracking-wider text-ciano">Mais completo</span>
      }
      <div class="flex gap-2 text-[.72rem] font-bold uppercase tracking-wider" [class.text-ciano]="!plano().highlight" [class.text-petroleo]="plano().highlight">
        @if (plano().includes_radar) { <span>Radar</span> }
        @if (plano().includes_radar && plano().includes_licita) { <span>+</span> }
        @if (plano().includes_licita) { <span>Licita-VMO</span> }
      </div>
      <div>
        <h3 class="subtitulo text-2xl">{{ plano().name }}</h3>
        <p class="mt-1 text-sm" [class.text-claro-2]="!plano().highlight" [class.text-petroleo]="plano().highlight">{{ plano().tagline }}</p>
      </div>
      <p class="flex items-baseline gap-1">
        @if (plano().price_cents != null) {
          <span class="num text-[2.9rem]">{{ preco().inteiro }}</span>
          @if (preco().centavos) { <span class="text-lg font-bold">,{{ preco().centavos }}</span> }
          <span class="ml-1 text-sm font-semibold opacity-80">/mês por CNPJ</span>
        } @else {
          <span class="num text-3xl">Em breve</span>
        }
      </p>
      <ul class="grid gap-2.5 text-[.93rem] leading-snug">
        @for (f of plano().features; track f) {
          <li class="relative pl-5"><span class="absolute left-0 top-[.55em] h-[5px] w-[9px]" [class.bg-ciano]="!plano().highlight" [class.bg-abismo]="plano().highlight"></span>{{ f }}</li>
        }
      </ul>
      <div class="mt-auto pt-2">
        @if (atual()) {
          <span class="btn w-full bg-transparent ring-1 ring-inset" [class.ring-abismo]="plano().highlight" [class.ring-ciano]="!plano().highlight">Seu plano atual</span>
        } @else if (plano().price_cents != null) {
          <a [routerLink]="['/contratar', plano().id]" class="btn w-full"
             [class]="plano().highlight ? 'bg-abismo text-ciano hover:bg-petroleo' : 'bg-ciano text-abismo hover:bg-[#5ee0e2]'">
            {{ rotuloBotao() }}
          </a>
        }
        <p class="mt-3 text-center text-xs" [class.text-claro-suave]="!plano().highlight" [class.text-petroleo]="plano().highlight">Sem fidelidade. Pix, boleto ou cartão.</p>
      </div>
    </article>
  `,
})
export class PlanoCard {
  plano = input.required<Plano>();
  atual = input(false);
  rotuloBotao = input('Contratar');

  protected preco = computed(() => {
    const c = this.plano().price_cents ?? 0;
    const inteiro = 'R$ ' + Math.floor(c / 100).toLocaleString('pt-BR');
    const cent = c % 100;
    return { inteiro, centavos: cent ? String(cent).padStart(2, '0') : '' };
  });
}
