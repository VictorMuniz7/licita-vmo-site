import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { PortalService } from '../../core/portal.service';
import { MolduraAuth } from './moldura';

@Component({
  selector: 'app-entrar',
  imports: [FormsModule, RouterLink, MolduraAuth],
  template: `
    <app-moldura-auth frase="Bom te ver de novo.">
      <h1 class="titulo text-[2rem]">Entrar</h1>
      <p class="mt-2 text-tinta-2">Acesse o painel da sua conta.</p>

      <form class="mt-8 grid gap-5" (ngSubmit)="enviar()" #f="ngForm">
        <label class="campo">
          <span>E-mail</span>
          <input class="input" type="email" name="email" [(ngModel)]="email" required autocomplete="email" autofocus>
        </label>
        <label class="campo">
          <span class="flex justify-between">Senha <a routerLink="/recuperar-senha" class="font-semibold text-pentagono hover:underline">Esqueci a senha</a></span>
          <input class="input" type="password" name="senha" [(ngModel)]="senha" required autocomplete="current-password">
        </label>
        @if (erro()) { <p class="aviso aviso-erro" role="alert">{{ erro() }}</p> }
        <button class="btn btn-escuro w-full py-3.5" [disabled]="enviando() || f.invalid">{{ enviando() ? 'Entrando…' : 'Entrar' }}</button>
      </form>

      <p class="mt-8 text-sm text-tinta-2">Ainda não tem conta?
        <a [routerLink]="'/cadastro'" [queryParams]="voltarQuery()" class="font-bold text-pentagono hover:underline">Criar conta</a>
      </p>
      <p class="mt-6 border-t border-linha pt-6 text-xs text-tinta-suave">Usuários cadastrados pelo titular entram aqui para ver o acesso, mas usam o sistema no próprio Licita-VMO.</p>
    </app-moldura-auth>
  `,
})
export class Entrar {
  private auth = inject(AuthService);
  private portal = inject(PortalService);
  private router = inject(Router);
  private rota = inject(ActivatedRoute);

  protected email = '';
  protected senha = '';
  protected erro = signal('');
  protected enviando = signal(false);

  protected voltarQuery() {
    const v = this.rota.snapshot.queryParamMap.get('voltar');
    const m = v?.match(/^\/contratar\/(\w+)/);
    return m ? { plano: m[1] } : {};
  }

  async enviar() {
    this.erro.set(''); this.enviando.set(true);
    try {
      await this.auth.entrar(this.email.trim(), this.senha);
      this.portal.limpar();
      const voltar = this.rota.snapshot.queryParamMap.get('voltar');
      await this.router.navigateByUrl(voltar?.startsWith('/') ? voltar : '/painel');
    } catch (e) {
      this.erro.set((e as Error).message);
    } finally {
      this.enviando.set(false);
    }
  }
}
