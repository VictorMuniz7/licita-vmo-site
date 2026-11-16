import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { config } from '../../core/config';
import { MolduraAuth } from './moldura';

@Component({
  selector: 'app-recuperar-senha',
  imports: [FormsModule, RouterLink, MolduraAuth],
  template: `
    <app-moldura-auth frase="Acontece com todo mundo.">
      <h1 class="titulo text-[2rem]">Recuperar senha</h1>
      @if (enviado()) {
        <p class="aviso aviso-ok mt-6">Se <b>{{ email }}</b> tiver cadastro, você vai receber um link para criar uma senha nova.</p>
      } @else {
        <p class="mt-2 text-tinta-2">Mandamos um link para o seu e-mail.</p>
        <form class="mt-8 grid gap-5" (ngSubmit)="enviar()" #f="ngForm">
          <label class="campo"><span>E-mail</span>
            <input class="input" type="email" name="email" [(ngModel)]="email" required email autocomplete="email" autofocus>
          </label>
          @if (erro()) { <p class="aviso aviso-erro" role="alert">{{ erro() }}</p> }
          <button class="btn btn-escuro w-full py-3.5" [disabled]="enviando() || f.invalid">Enviar link</button>
        </form>
      }
      <p class="mt-8 text-sm"><a routerLink="/entrar" class="font-bold text-pentagono hover:underline">Voltar para entrar</a></p>
    </app-moldura-auth>
  `,
})
export class RecuperarSenha {
  private auth = inject(AuthService);
  protected email = '';
  protected enviado = signal(false);
  protected enviando = signal(false);
  protected erro = signal('');

  async enviar() {
    this.erro.set(''); this.enviando.set(true);
    try { await this.auth.enviarRecuperacao(this.email.trim()); this.enviado.set(true); }
    catch (e) { this.erro.set((e as Error).message); }
    finally { this.enviando.set(false); }
  }
}

/** Destino dos links de convite (usuários criados pelo titular) e de recuperação de senha. */
@Component({
  selector: 'app-definir-senha',
  imports: [FormsModule, RouterLink, MolduraAuth],
  template: `
    <app-moldura-auth frase="Defina sua senha e comece.">
      <h1 class="titulo text-[2rem]">Definir senha</h1>
      @if (!auth.pronto()) {
        <p class="mt-4 text-tinta-2">Validando o link…</p>
      } @else if (!auth.logado()) {
        <p class="aviso aviso-erro mt-6">Este link expirou ou já foi usado. Peça um novo ao titular da conta ou <a routerLink="/recuperar-senha" class="font-bold underline">recupere a senha</a>.</p>
      } @else if (pronto()) {
        <p class="aviso aviso-ok mt-6">Senha salva. Use seu e-mail <b>{{ auth.usuario()?.email }}</b> e essa senha para entrar no Licita-VMO.</p>
        <div class="mt-6 grid gap-3">
          <a [href]="licitaUrl" class="btn btn-escuro py-3.5">Abrir o Licita-VMO</a>
          <a routerLink="/painel" class="btn btn-claro py-3.5">Ir para o painel</a>
        </div>
      } @else {
        <p class="mt-2 text-tinta-2">Conta: <b>{{ auth.usuario()?.email }}</b></p>
        <form class="mt-8 grid gap-5" (ngSubmit)="salvar()" #f="ngForm">
          <label class="campo"><span>Nova senha</span>
            <input class="input" type="password" name="senha" [(ngModel)]="senha" required minlength="8" autocomplete="new-password" autofocus>
            <small class="ajuda">Mínimo de 8 caracteres.</small>
          </label>
          <label class="campo"><span>Repita a senha</span>
            <input class="input" type="password" name="senha2" [(ngModel)]="senha2" required autocomplete="new-password">
          </label>
          @if (erro()) { <p class="aviso aviso-erro" role="alert">{{ erro() }}</p> }
          <button class="btn btn-escuro w-full py-3.5" [disabled]="enviando() || f.invalid">Salvar senha</button>
        </form>
      }
    </app-moldura-auth>
  `,
})
export class DefinirSenha {
  protected auth = inject(AuthService);
  protected router = inject(Router);
  protected licitaUrl = config.licitaVmoUrl;
  protected senha = '';
  protected senha2 = '';
  protected pronto = signal(false);
  protected enviando = signal(false);
  protected erro = signal('');

  async salvar() {
    if (this.senha !== this.senha2) { this.erro.set('As senhas não são iguais.'); return; }
    this.erro.set(''); this.enviando.set(true);
    try { await this.auth.definirSenha(this.senha); this.pronto.set(true); }
    catch (e) { this.erro.set((e as Error).message); }
    finally { this.enviando.set(false); }
  }
}
