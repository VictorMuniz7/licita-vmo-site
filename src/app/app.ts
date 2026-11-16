import { Component, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { PortalService } from './core/portal.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class App {
  private auth = inject(AuthService);
  private portal = inject(PortalService);
  private router = inject(Router);
  private ultimoUsuario: string | null | undefined = undefined;

  constructor() {
    // Troca de usuário (login, logout, sessão expirada) limpa os dados em memória
    effect(() => {
      const id = this.auth.usuario()?.id ?? null;
      if (this.ultimoUsuario !== undefined && id !== this.ultimoUsuario) {
        this.portal.limpar();
        if (!id && this.router.url.startsWith('/painel')) this.router.navigateByUrl('/entrar');
      }
      this.ultimoUsuario = id;
    });
    // Convite ou recuperação de senha aberto em qualquer página leva para "definir senha"
    effect(() => {
      if (this.auth.definindoSenha() && !this.router.url.startsWith('/definir-senha')) this.router.navigateByUrl('/definir-senha');
    });
  }
}
