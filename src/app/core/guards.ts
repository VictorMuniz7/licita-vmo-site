import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { PortalService } from './portal.service';

/** Exige login; leva de volta para a página pedida depois de entrar. */
export const exigeLogin: CanActivateFn = async (_r, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.aguardar();
  if (auth.logado()) return true;
  return router.createUrlTree(['/entrar'], { queryParams: { voltar: state.url } });
};

/** Quem já está logado não vê entrar/cadastro. */
export const soVisitante: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.aguardar();
  return auth.logado() ? router.createUrlTree(['/painel']) : true;
};

/** Páginas de gestão (empresa, usuários, faturas...) são só do titular. */
export const soTitular: CanActivateFn = async () => {
  const portal = inject(PortalService);
  const router = inject(Router);
  await portal.carregar();
  return portal.ehTitular() ? true : router.createUrlTree(['/painel']);
};
