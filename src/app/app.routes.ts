import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { AuthService } from './core/auth.service';
import { exigeLogin, soTitular, soVisitante } from './core/guards';

/** Visitante que clica em "Contratar" vai criar conta já com o plano escolhido. */
const loginParaContratar: CanActivateFn = async (r) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.aguardar();
  return auth.logado() ? true : router.createUrlTree(['/cadastro'], { queryParams: { plano: r.paramMap.get('plano') } });
};

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/public/home').then(m => m.Home), title: 'Licita-VMO · Radar de licitações e gestão de processos' },
  { path: 'planos', loadComponent: () => import('./pages/public/planos').then(m => m.Planos), title: 'Planos · Licita-VMO' },
  { path: 'entrar', canActivate: [soVisitante], loadComponent: () => import('./pages/auth/entrar').then(m => m.Entrar), title: 'Entrar · Licita-VMO' },
  { path: 'cadastro', canActivate: [soVisitante], loadComponent: () => import('./pages/auth/cadastro').then(m => m.Cadastro), title: 'Criar conta · Licita-VMO' },
  { path: 'recuperar-senha', loadComponent: () => import('./pages/auth/senha').then(m => m.RecuperarSenha), title: 'Recuperar senha · Licita-VMO' },
  { path: 'definir-senha', loadComponent: () => import('./pages/auth/senha').then(m => m.DefinirSenha), title: 'Definir senha · Licita-VMO' },
  { path: 'contratar/:plano', canActivate: [loginParaContratar], loadComponent: () => import('./pages/public/contratar').then(m => m.Contratar), title: 'Contratar · Licita-VMO' },
  {
    path: 'painel',
    canActivate: [exigeLogin],
    loadComponent: () => import('./pages/painel/painel-layout').then(m => m.PainelLayout),
    children: [
      { path: '', loadComponent: () => import('./pages/painel/visao-geral').then(m => m.VisaoGeral), title: 'Painel · Licita-VMO' },
      { path: 'usuarios', canActivate: [soTitular], loadComponent: () => import('./pages/painel/usuarios').then(m => m.Usuarios), title: 'Usuários · Licita-VMO' },
      { path: 'radar', canActivate: [soTitular], loadComponent: () => import('./pages/painel/radar').then(m => m.Radar), title: 'Perfil do radar · Licita-VMO' },
      { path: 'faturas', canActivate: [soTitular], loadComponent: () => import('./pages/painel/faturas').then(m => m.Faturas), title: 'Faturas · Licita-VMO' },
      { path: 'assinatura', canActivate: [soTitular], loadComponent: () => import('./pages/painel/assinatura').then(m => m.Assinatura), title: 'Assinatura · Licita-VMO' },
      { path: 'empresa', canActivate: [soTitular], loadComponent: () => import('./pages/painel/empresa').then(m => m.Empresa), title: 'Dados da empresa · Licita-VMO' },
    ],
  },
  { path: '**', redirectTo: '' },
];
