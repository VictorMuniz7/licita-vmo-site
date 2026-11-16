import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MODO_DEMO } from '../../core/config';
import { Logo } from '../../shared/logo';

/** Layout das telas de entrar/cadastro: marca à esquerda, formulário à direita. */
@Component({
  selector: 'app-moldura-auth',
  imports: [RouterLink, Logo],
  template: `
    <div class="grid min-h-svh lg:grid-cols-[.95fr_1.05fr]">
      <aside class="escuro relative hidden overflow-hidden bg-abismo p-12 text-claro lg:flex lg:flex-col lg:justify-between">
        <a routerLink="/" aria-label="Início"><app-logo tom="escuro" /></a>
        <div class="relative max-w-[30rem]">
          <p class="display text-[clamp(2.2rem,3.4vw,3.4rem)]">{{ frase() }}</p>
          <ul class="mt-8 grid gap-3 text-claro-2">
            <li class="marcador">Resumo do edital em texto e áudio no WhatsApp</li>
            <li class="marcador">Processos, certidões e proposta no Licita-VMO</li>
            <li class="marcador">Sem fidelidade: cancele pelo painel</li>
          </ul>
        </div>
        <p class="text-xs text-claro-suave">VMO Sistemas · Maringá, PR</p>
        <svg class="pointer-events-none absolute -bottom-32 -right-32 h-[460px] w-[460px] opacity-[.08]" viewBox="0 0 600 600" aria-hidden="true">
          <polygon points="300,20 580,224 473,553 127,553 20,224" fill="none" stroke="#35D0D3" stroke-width="10"/>
        </svg>
      </aside>

      <main class="flex flex-col bg-nevoa px-4 py-8 sm:px-10">
        <a routerLink="/" class="lg:hidden" aria-label="Início"><app-logo tom="claro" [tamanho]="34" /></a>
        <div class="mx-auto my-auto w-full max-w-[440px] py-10">
          @if (demo) {
            <p class="aviso aviso-atencao mb-6">Modo demonstração: qualquer e-mail e senha funcionam. Nenhum dado sai do seu navegador.</p>
          }
          <ng-content />
        </div>
      </main>
    </div>
  `,
})
export class MolduraAuth {
  frase = input('Todas as licitações certas, sem abrir um edital.');
  protected demo = MODO_DEMO;
}
