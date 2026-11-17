import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, tap, throwError, timeout } from 'rxjs';
import { environment } from '../../environments/environment';

export const api = environment;
export interface User { id: number; email: string; name: string; surname: string; role: 'USER' | 'ADMIN'; }
export interface Player { id: number; name: string; surname: string; role: string; team: string | null; }
export interface LoginResponse { accessToken: string; userId: number; email: string; name: string; surname: string; }

@Injectable({ providedIn: 'root' })
export class SessionService {
  private http = inject(HttpClient);
  user = signal<User | null>(null);
  get token(): string | null {
    const token = sessionStorage.getItem('fantasta_token');
    if (!token) return null;
    try {
      const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(part));
      if (typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()) { this.logout(); return null; }
      return token;
    } catch { this.logout(); return null; }
  }
  login(email: string, password: string) {
    return this.http.post<LoginResponse>(`${api.auth}/api/user/login`, { email, password }).pipe(
      timeout(60000), tap(result => sessionStorage.setItem('fantasta_token', result.accessToken)));
  }
  profile() { return this.http.get<User>(`${api.auth}/api/user/me`).pipe(timeout(60000), tap(user => this.user.set(user))); }
  logout() { sessionStorage.removeItem('fantasta_token'); this.user.set(null); }
}

export const bearerInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SessionService);
  const router = inject(Router);
  const allowed = Object.values(api).some(base => request.url.startsWith(base + '/'));
  const token = session.token;
  const outgoing = allowed && token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;
  return next(outgoing).pipe(catchError((error: HttpErrorResponse) => {
    if (allowed && error.status === 401 && !request.url.endsWith('/api/user/login')) {
      session.logout(); void router.navigateByUrl('/login');
    }
    return throwError(() => error);
  }));
};
