import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { loginRedirectGuard } from './guards/login-redirect.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login').then((m) => m.Login),
    canActivate: [loginRedirectGuard],
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
    canActivate: [authGuard],
  },
  {
    path: 'inventory',
    loadComponent: () =>
      import('./pages/inventory/inventory').then((m) => m.Inventory),
    canActivate: [authGuard],
  },
  {
    path: 'reorders',
    loadComponent: () =>
      import('./pages/reorders/reorders').then((m) => m.Reorders),
    canActivate: [authGuard],
  },
  {
    path: 'management',
    loadComponent: () =>
      import('./pages/management/management').then((m) => m.Management),
    canActivate: [authGuard],
  },
  {
    path: 'purchase',
    loadComponent: () =>
      import('./pages/purchase/purchase').then((m) => m.Purchase),
    canActivate: [authGuard],
  },
];
