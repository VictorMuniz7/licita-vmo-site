import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { data } from '../../core/formato';
import { AcaoUsuario, Membro } from '../../core/modelos';
import { PortalService } from '../../core/portal.service';

const LIMITE = 4;

@Component({
  selector: 'app-usuarios',
  imports: [FormsModule, RouterLink],
  template: `
    <header class="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="rotulo text-pentagono">Licita-VMO</p>
        <h1 class="titulo mt-2 text-[clamp(1.8rem,3vw,2.5rem)]">Usuários</h1>
        <p class="mt-2 max-w-[60ch] text-tinta-2">Quem pode entrar no Licita-VMO com e-mail e senha próprios. São até {{ limite }} acessos por conta, contando com você.</p>
      </div>
      <div class="text-right">
        <p class="num text-4xl">{{ portal.membros().length }}<span class="text-xl text-tinta-suave">/{{ limite }}</span></p>
        <p class="text-xs text-tinta-suave">acessos usados</p>
      </div>
    </header>

    @if (!portal.temLicita()) {
      <div class="aviso aviso-atencao mb-6 flex flex-wrap items-center justify-between gap-3">
        <span>Seu plano atual não inclui o Licita-VMO. Os usuários abaixo não conseguem entrar no sistema.</span>
        <a routerLink="/painel/assinatura" class="btn btn-escuro btn-sm">Mudar de plano</a>
      </div>
    }
    @if (msg()) { <p class="aviso aviso-ok mb-6" role="status">{{ msg() }}</p> }
    @if (erro()) { <p class="aviso aviso-erro mb-6" role="alert">{{ erro() }}</p> }

    <!-- Lista -->
    <div class="cartao p-0! overflow-hidden">
      <ul class="divide-y divide-linha">
        @for (m of portal.membros(); track m.id) {
          <li class="flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4 sm:flex-nowrap">
            <span class="grid h-10 w-10 shrink-0 place-items-center text-sm font-extrabold"
                  [class]="m.active ? 'bg-petroleo text-ciano' : 'bg-nevoa-2 text-tinta-suave'" aria-hidden="true">{{ iniciais(m.name) }}</span>
            <div class="min-w-0 flex-1">
              <p class="flex flex-wrap items-center gap-2 font-bold">
                {{ m.name }}
                @if (m.role === 'owner') { <span class="selo selo-neutro">Titular</span> }
                @if (!m.active) { <span class="selo selo-atencao">Desativado</span> }
              </p>
              <p class="truncate text-sm text-tinta-suave">{{ m.email }} · desde {{ dt(m.created_at) }}</p>
            </div>
            @if (m.role !== 'owner') {
              <div class="flex flex-wrap gap-2">
                @if (confirmando() === m.id) {
                  <span class="self-center text-sm font-semibold text-erro">Remover {{ m.name.split(' ')[0] }}?</span>
                  <button type="button" class="btn btn-perigo btn-sm" (click)="agir('remover', m)" [disabled]="ocupado() === m.id">Sim, remover</button>
                  <button type="button" class="btn btn-claro btn-sm" (click)="confirmando.set(null)">Não</button>
                } @else {
                  <button type="button" class="btn btn-claro btn-sm" (click)="agir('reenviar-acesso', m)" [disabled]="ocupado() === m.id" title="Envia um link para a pessoa criar ou trocar a senha">Reenviar acesso</button>
                  <button type="button" class="btn btn-claro btn-sm" (click)="agir(m.active ? 'desativar' : 'ativar', m)" [disabled]="ocupado() === m.id">{{ m.active ? 'Desativar' : 'Reativar' }}</button>
                  <button type="button" class="btn btn-claro btn-sm text-erro!" (click)="confirmando.set(m.id)">Remover</button>
                }
              </div>
            }
          </li>
        }
      </ul>
    </div>

    <!-- Novo usuário -->
    <section class="mt-8">
      <h2 class="subtitulo text-xl">Adicionar usuário</h2>
      @if (cheio()) {
        <p class="mt-3 text-sm text-tinta-2">Sua conta já usa os {{ limite }} acessos. Remova um usuário para liberar uma vaga.</p>
      } @else if (!portal.temLicita()) {
        <p class="mt-3 text-sm text-tinta-2">Disponível nos planos com Licita-VMO.</p>
      } @else {
        <form class="cartao mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end" (ngSubmit)="criar()" #f="ngForm">
          <label class="campo"><span>Nome</span>
            <input class="input" name="nome" [(ngModel)]="nome" required minlength="2" placeholder="Nome e sobrenome">
          </label>
          <label class="campo"><span>E-mail</span>
            <input class="input" type="email" name="email" [(ngModel)]="email" required email placeholder="pessoa@empresa.com.br">
          </label>
          <button class="btn btn-escuro py-2.5" [disabled]="criando() || f.invalid">{{ criando() ? 'Enviando…' : 'Enviar convite' }}</button>
          <p class="ajuda sm:col-span-3">A pessoa recebe um e-mail para criar a senha. Restam {{ limite - portal.membros().length }} vaga(s).</p>
        </form>
      }
    </section>
  `,
})
export class Usuarios {
  protected portal = inject(PortalService);
  protected limite = LIMITE;
  protected dt = data;
  protected nome = '';
  protected email = '';
  protected criando = signal(false);
  protected ocupado = signal<string | null>(null);
  protected confirmando = signal<string | null>(null);
  protected erro = signal('');
  protected msg = signal('');
  protected cheio = computed(() => this.portal.membros().length >= LIMITE);

  protected iniciais(n: string) {
    return n.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
  }

  async criar() {
    this.erro.set(''); this.msg.set(''); this.criando.set(true);
    try {
      await this.portal.criarUsuario(this.nome.trim(), this.email.trim().toLowerCase());
      this.msg.set(`Convite enviado para ${this.email.trim()}.`);
      this.nome = ''; this.email = '';
    } catch (e) { this.erro.set((e as Error).message); }
    finally { this.criando.set(false); }
  }

  async agir(acao: AcaoUsuario, m: Membro) {
    this.erro.set(''); this.msg.set(''); this.ocupado.set(m.id);
    try {
      await this.portal.acaoUsuario(acao, m);
      this.msg.set({
        'reenviar-acesso': `Link de acesso reenviado para ${m.email}.`,
        'desativar': `${m.name} não consegue mais entrar no Licita-VMO.`,
        'ativar': `${m.name} voltou a ter acesso.`,
        'remover': `${m.name} foi removido. A vaga está livre.`,
      }[acao]);
      this.confirmando.set(null);
    } catch (e) { this.erro.set((e as Error).message); }
    finally { this.ocupado.set(null); }
  }
}
