import { inject } from '@angular/core';
import { CanActivateFn, Routes, Router } from '@angular/router';
import { SessionService } from './core/api';
import { catchError, map, of } from 'rxjs';

const authGuard: CanActivateFn = () => inject(SessionService).token ? true : inject(Router).createUrlTree(['/login']);
const adminGuard: CanActivateFn = () => {
  const session = inject(SessionService); const router = inject(Router);
  return session.profile().pipe(map(user => user.role === 'ADMIN' ? true : router.createUrlTree(['/dashboard'])), catchError(() => of(router.createUrlTree(['/dashboard']))));
};
export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth').then(m => m.AuthPage) },
  { path: 'registrazione', loadComponent: () => import('./features/auth').then(m => m.AuthPage) },
  { path: 'dashboard', canActivate: [authGuard], loadComponent: () => import('./features/dashboard').then(m => m.DashboardPage) },
  { path: 'aste/nuova', canActivate: [authGuard], loadComponent: () => import('./features/create-auction').then(m => m.CreateAuctionPage) },
  { path: 'aste/:id', canActivate: [authGuard], loadComponent: () => import('./features/auction').then(m => m.AuctionPage) },
  { path: 'profilo', canActivate: [authGuard], loadComponent: () => import('./features/profile').then(m => m.ProfilePage) },
  { path: 'admin', canActivate: [authGuard, adminGuard], loadComponent: () => import('./features/admin').then(m => m.AdminPage) },
  { path: 'giocatori', canActivate: [authGuard], loadComponent: () => import('./features/players').then(m => m.PlayersPage) },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' }
];
