import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { MODO_DEMO, config } from '../../core/config';
import { PortalService } from '../../core/portal.service';
import { Logo } from '../../shared/logo';

@Component({
  selector: 'app-painel-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Logo],
  template: `
    <div class="min-h-svh bg-nevoa lg:grid lg:grid-cols-[264px_1fr]">
      <!-- Barra lateral -->
      <aside class="escuro bg-abismo text-claro lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col">
        <div class="flex h-[68px] items-center justify-between px-5 lg:h-auto lg:py-7">
          <a routerLink="/" aria-label="Site"><app-logo tom="escuro" [tamanho]="34" /></a>
          <button type="button" class="grid h-11 w-11 place-items-center lg:hidden" (click)="menu.set(!menu())" [attr.aria-expanded]="menu()" aria-label="Menu do painel">
            <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2">
              @if (menu()) { <path d="M6 6l12 12M18 6L6 18"/> } @else { <path d="M4 7h16M4 12h16M4 17h16"/> }
            </svg>
          </button>
        </div>

        <nav class="px-3 pb-4 lg:block lg:flex-1" [class.hidden]="!menu()" aria-label="Painel" (click)="menu.set(false)">
          @if (portal.conta()) {
            <p class="mb-4 hidden truncate px-3 text-xs font-semibold uppercase tracking-wider text-claro-suave lg:block" [title]="portal.conta()!.company_name">{{ portal.conta()!.trade_name || portal.conta()!.company_name }}</p>
          }
          <ul class="grid gap-1">
            @for (item of itens(); track item.rota) {
              <li>
                <a [routerLink]="item.rota" routerLinkActive="bg-petroleo-2 text-ciano!" [routerLinkActiveOptions]="{ exact: item.rota === '/painel' }"
                   class="flex items-center gap-3 px-3 py-2.5 text-[.95rem] font-semibold text-claro-2 hover:bg-petroleo-2 hover:text-claro">
                  <svg viewBox="0 0 24 24" class="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><path [attr.d]="item.icone"/></svg>
                  {{ item.nome }}
                </a>
              </li>
            }
          </ul>
          @if (portal.temLicita()) {
            <a [href]="licitaUrl" class="btn btn-ciano btn-sm mt-6 w-full">Abrir o Licita-VMO ↗</a>
          }
        </nav>

        <div class="hidden border-t border-[rgba(53,208,211,.14)] px-5 py-4 lg:block">
          <p class="truncate text-sm font-semibold">{{ auth.usuario()?.name || auth.usuario()?.email }}</p>
          <p class="truncate text-xs text-claro-suave">{{ portal.ehTitular() ? 'Titular da conta' : 'Usuário' }} · {{ auth.usuario()?.email }}</p>
          <button type="button" class="mt-3 text-sm font-semibold text-claro-2 hover:text-ciano" (click)="sair()">Sair</button>
        </div>
      </aside>

      <!-- Conteúdo -->
      <main class="min-w-0">
        @if (demo) {
          <div class="bg-ambar-fundo px-4 py-2 text-center text-xs font-semibold text-ambar-texto">Modo demonstração · dados de exemplo salvos só neste navegador</div>
        }
        <div class="mx-auto w-full max-w-[1080px] px-4 py-8 sm:px-8 lg:py-12">
          @if (!portal.carregado()) {
            <p class="text-tinta-suave">Carregando…</p>
          } @else {
            <router-outlet />
          }
        </div>
        <div class="px-4 pb-8 text-center lg:hidden">
          <button type="button" class="text-sm font-semibold text-tinta-suave" (click)="sair()">Sair da conta ({{ auth.usuario()?.email }})</button>
        </div>
      </main>
    </div>
  `,
})
export class PainelLayout implements OnInit {
  protected auth = inject(AuthService);
  protected portal = inject(PortalService);
  private router = inject(Router);
  protected menu = signal(false);
  protected demo = MODO_DEMO;
  protected licitaUrl = config.licitaVmoUrl;

  private readonly todos = [
    { rota: '/painel', nome: 'Visão geral', titular: false, icone: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z' },
    { rota: '/painel/usuarios', nome: 'Usuários', titular: true, icone: 'M9 11a4 4 0 100-8 4 4 0 000 8zM2 21v-1a6 6 0 0112 0v1M16 3.5a4 4 0 010 7M22 21v-1a6 6 0 00-4-5.6' },
    { rota: '/painel/radar', nome: 'Perfil do radar', titular: true, icone: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 16.5a4.5 4.5 0 100-9 4.5 4.5 0 000 9zM12 12l6-6' },
    { rota: '/painel/faturas', nome: 'Faturas', titular: true, icone: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3' },
    { rota: '/painel/assinatura', nome: 'Assinatura', titular: true, icone: 'M3 6h18v12H3zM3 10h18M7 15h4' },
    { rota: '/painel/empresa', nome: 'Dados da empresa', titular: true, icone: 'M4 21V5l8-2v18M12 21h8V9l-8-2M8 8v.01M8 12v.01M8 16v.01M16 12v.01M16 16v.01' },
  ];
  protected itens = computed(() => this.todos.filter(i => !i.titular || (this.portal.ehTitular() && this.portal.conta())));

  async ngOnInit() {
    await this.portal.carregar();
  }

  async sair() {
    await this.auth.sair();
    this.portal.limpar();
    this.router.navigateByUrl('/');
  }
}
