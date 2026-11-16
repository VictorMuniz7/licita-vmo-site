import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { reais } from '../../core/formato';
import { PortalService } from '../../core/portal.service';
import { MolduraAuth } from './moldura';

@Component({
  selector: 'app-cadastro',
  imports: [FormsModule, RouterLink, MolduraAuth],
  template: `
    <app-moldura-auth frase="Sua empresa no radar das licitações certas.">
      @if (confirmar()) {
        <div class="cartao text-center">
          <span class="mx-auto grid h-14 w-14 place-items-center bg-ok-fundo text-ok" aria-hidden="true">
            <svg viewBox="0 0 24 24" class="h-7 w-7" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16v12H4z"/><path d="M4 7l8 6 8-6"/></svg>
          </span>
          <h1 class="subtitulo mt-5 text-2xl">Confirme seu e-mail</h1>
          <p class="mt-3 text-tinta-2">Enviamos um link para <b>{{ email }}</b>. Abra e você volta direto para {{ plano() ? 'a contratação' : 'o painel' }}.</p>
          <p class="mt-5 text-xs text-tinta-suave">Não chegou? Veja a caixa de spam ou promoções.</p>
        </div>
      } @else {
        <h1 class="titulo text-[2rem]">Criar conta</h1>
        @if (plano(); as p) {
          <p class="mt-3 inline-flex items-center gap-2 bg-white px-3 py-2 text-sm ring-1 ring-linha">
            Plano escolhido: <b>{{ p.name }}</b> · {{ preco(p.price_cents) }}/mês
          </p>
        } @else {
          <p class="mt-2 text-tinta-2">Você escolhe o plano no próximo passo.</p>
        }

        <form class="mt-8 grid gap-5" (ngSubmit)="enviar()" #f="ngForm">
          <label class="campo">
            <span>Seu nome</span>
            <input class="input" name="nome" [(ngModel)]="nome" required minlength="2" autocomplete="name">
          </label>
          <label class="campo">
            <span>E-mail</span>
            <input class="input" type="email" name="email" [(ngModel)]="email" required email autocomplete="email">
            <small class="ajuda">Este será o login do titular da conta.</small>
          </label>
          <label class="campo">
            <span>Senha</span>
            <input class="input" type="password" name="senha" [(ngModel)]="senha" required minlength="8" autocomplete="new-password">
            <small class="ajuda">Mínimo de 8 caracteres.</small>
          </label>
          <label class="flex items-start gap-3 text-sm text-tinta-2">
            <input type="checkbox" name="aceite" [(ngModel)]="aceite" required class="mt-0.5 h-4 w-4 accent-pentagono">
            <span>Li e aceito os termos de uso e a política de privacidade.</span>
          </label>
          @if (erro()) { <p class="aviso aviso-erro" role="alert">{{ erro() }}</p> }
          <button class="btn btn-escuro w-full py-3.5" [disabled]="enviando() || f.invalid">{{ enviando() ? 'Criando…' : 'Criar conta e continuar' }}</button>
        </form>
        <p class="mt-8 text-sm text-tinta-2">Já tem conta? <a routerLink="/entrar" [queryParams]="planoId ? { voltar: '/contratar/' + planoId } : {}" class="font-bold text-pentagono hover:underline">Entrar</a></p>
      }
    </app-moldura-auth>
  `,
})
export class Cadastro {
  private auth = inject(AuthService);
  private portal = inject(PortalService);
  private router = inject(Router);

  protected planoId = inject(ActivatedRoute).snapshot.queryParamMap.get('plano');
  protected plano = computed(() => this.portal.planos().find(p => p.id === this.planoId) ?? null);
  protected preco = reais;

  protected nome = '';
  protected email = '';
  protected senha = '';
  protected aceite = false;
  protected erro = signal('');
  protected enviando = signal(false);
  protected confirmar = signal(false);

  constructor() { this.portal.carregarPlanos(); }

  async enviar() {
    this.erro.set(''); this.enviando.set(true);
    const destino = this.planoId ? `/contratar/${this.planoId}` : '/planos';
    try {
      const r = await this.auth.cadastrar(this.nome.trim(), this.email.trim(), this.senha, destino);
      if (r.precisaConfirmar) { this.confirmar.set(true); return; }
      this.portal.limpar();
      await this.router.navigateByUrl(destino);
    } catch (e) {
      this.erro.set((e as Error).message);
    } finally {
      this.enviando.set(false);
    }
  }
}
