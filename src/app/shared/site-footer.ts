import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { config } from '../core/config';
import { Logo } from './logo';

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink, Logo],
  template: `
    <footer class="escuro bg-abismo text-claro-2">
      <div class="wrap grid gap-10 py-14" [class]="vendasAbertas ? 'md:grid-cols-[1.4fr_1fr_1fr_1fr]' : 'md:grid-cols-[1.4fr_1fr_1fr]'">
        <div class="grid gap-4 content-start">
          <app-logo tom="escuro" />
          <p class="max-w-[38ch] text-sm leading-relaxed">Radar de licitações com IA e sistema de gestão de processos para empresas que vendem para o governo.</p>
        </div>
        <div>
          <p class="rotulo text-ciano mb-3">Serviços</p>
          <ul class="grid gap-2 text-sm">
            <li><a routerLink="/" fragment="radar" class="hover:text-ciano">Radar de licitações</a></li>
            <li><a routerLink="/" fragment="licita" class="hover:text-ciano">Licita-VMO</a></li>
            <li><a routerLink="/planos" class="hover:text-ciano">Planos e preços</a></li>
          </ul>
        </div>
        @if (vendasAbertas) {
          <div>
            <p class="rotulo text-ciano mb-3">Conta</p>
            <ul class="grid gap-2 text-sm">
              <li><a routerLink="/entrar" class="hover:text-ciano">Entrar</a></li>
              <li><a routerLink="/cadastro" class="hover:text-ciano">Criar conta</a></li>
              <li><a [href]="licitaUrl" class="hover:text-ciano">Acessar o Licita-VMO</a></li>
            </ul>
          </div>
        }
        <div>
          <p class="rotulo text-ciano mb-3">Contato</p>
          <ul class="grid gap-2 text-sm">
            <li><a [href]="'https://wa.me/' + whats" target="_blank" rel="noopener" class="hover:text-ciano">WhatsApp (44) 9822-7263</a></li>
            <li><a [href]="'https://wa.me/' + whats2" target="_blank" rel="noopener" class="hover:text-ciano">WhatsApp (18) 98170-9943</a></li>
            <li><a [href]="'mailto:' + email" class="hover:text-ciano">{{ email }}</a></li>
            <li>Maringá, PR</li>
          </ul>
        </div>
      </div>
      <div class="wrap border-t border-[rgba(53,208,211,.14)] py-6 text-xs text-claro-suave">
        <span>© {{ ano }} VMO Sistemas. Todos os direitos reservados.</span>
      </div>
    </footer>
  `,
})
export class SiteFooter {
  protected ano = new Date().getFullYear();
  protected licitaUrl = config.licitaVmoUrl;
  protected whats = config.whatsappComercial;
  protected whats2 = config.whatsappComercial2;
  protected email = config.emailContato;
  /** pré-lançamento: sem links de conta */
  protected vendasAbertas = config.vendasAbertas;
}
