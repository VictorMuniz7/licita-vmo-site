import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { PortalService } from '../core/portal.service';
import { Logo } from './logo';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, Logo],
  template: `
    <header class="escuro sticky top-0 z-40 bg-abismo/92 backdrop-blur border-b border-[rgba(53,208,211,.14)]">
      <div class="wrap flex h-[72px] items-center justify-between gap-6">
        <a routerLink="/" aria-label="Licita-VMO, início"><app-logo tom="escuro" [tamanho]="38" /></a>

        <nav class="hidden lg:flex items-center gap-7 text-[.95rem] font-medium text-claro-2" aria-label="Principal">
          <a routerLink="/" fragment="servicos" class="hover:text-ciano">Serviços</a>
          <a routerLink="/" fragment="como-funciona" class="hover:text-ciano">Como funciona</a>
          <a routerLink="/planos" class="hover:text-ciano">Planos</a>
          <a routerLink="/" fragment="duvidas" class="hover:text-ciano">Dúvidas</a>
        </nav>

        <div class="hidden sm:flex items-center gap-4">
          @if (auth.logado()) {
            <a routerLink="/painel" class="btn btn-ciano btn-sm">Meu painel</a>
            <div class="flex items-center gap-3 border-l border-[rgba(53,208,211,.2)] pl-4">
              <span class="chanfro grid h-9 w-9 shrink-0 place-items-center bg-petroleo-3 text-[.78rem] font-extrabold text-ciano [--c:8px]" aria-hidden="true">{{ iniciais() }}</span>
              <div class="leading-tight">
                <p class="max-w-[14ch] truncate text-sm font-bold text-claro">Olá, {{ primeiroNome() }}</p>
                <button type="button" class="text-xs font-semibold text-claro-suave hover:text-ciano" (click)="sair()">Sair</button>
              </div>
            </div>
          } @else {
            <a routerLink="/entrar" class="px-3 py-2 text-sm font-semibold text-claro hover:text-ciano">Entrar</a>
            <a routerLink="/planos" class="btn btn-ciano btn-sm">Contratar</a>
          }
        </div>

        <button type="button" class="sm:hidden -mr-2 grid h-11 w-11 place-items-center text-claro"
                (click)="aberto.set(!aberto())" [attr.aria-expanded]="aberto()" aria-label="Abrir menu">
          <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2">
            @if (aberto()) { <path d="M6 6l12 12M18 6L6 18"/> } @else { <path d="M4 7h16M4 12h16M4 17h16"/> }
          </svg>
        </button>
      </div>

      @if (aberto()) {
        <nav class="sm:hidden wrap grid gap-1 pb-5 text-claro" aria-label="Menu" (click)="aberto.set(false)">
          @if (auth.logado()) {
            <p class="flex items-center gap-3 border-b border-[rgba(53,208,211,.14)] pb-4 pt-1">
              <span class="chanfro grid h-9 w-9 place-items-center bg-petroleo-3 text-[.78rem] font-extrabold text-ciano [--c:8px]" aria-hidden="true">{{ iniciais() }}</span>
              <b class="text-sm">Olá, {{ primeiroNome() }}</b>
            </p>
          }
          <a routerLink="/" fragment="servicos" class="py-3 border-b border-[rgba(53,208,211,.14)]">Serviços</a>
          <a routerLink="/" fragment="como-funciona" class="py-3 border-b border-[rgba(53,208,211,.14)]">Como funciona</a>
          <a routerLink="/planos" class="py-3 border-b border-[rgba(53,208,211,.14)]">Planos</a>
          <a routerLink="/" fragment="duvidas" class="py-3 border-b border-[rgba(53,208,211,.14)]">Dúvidas</a>
          @if (auth.logado()) {
            <div class="mt-4 grid grid-cols-2 gap-3">
              <button type="button" class="btn btn-fantasma" (click)="sair()">Sair</button>
              <a routerLink="/painel" class="btn btn-ciano">Meu painel</a>
            </div>
          } @else {
            <div class="mt-4 grid grid-cols-2 gap-3">
              <a routerLink="/entrar" class="btn btn-fantasma">Entrar</a>
              <a routerLink="/planos" class="btn btn-ciano">Contratar</a>
            </div>
          }
        </nav>
      }
    </header>
  `,
})
export class SiteHeader {
  protected auth = inject(AuthService);
  private portal = inject(PortalService);
  private router = inject(Router);
  protected aberto = signal(false);

  /** Nome do cadastro; sem nome, usa a parte do e-mail antes do @. */
  private nome = computed(() => {
    const u = this.auth.usuario();
    return (u?.name || u?.email.split('@')[0] || '').trim();
  });
  protected primeiroNome = computed(() => this.nome().split(/\s+/)[0]);
  protected iniciais = computed(() => {
    const partes = this.nome().split(/\s+/).filter(Boolean);
    return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
  });

  async sair() {
    await this.auth.sair();
    this.portal.limpar();
    this.router.navigateByUrl('/');
  }
}
