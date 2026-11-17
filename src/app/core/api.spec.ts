import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { api, bearerInterceptor, SessionService } from './api';

describe('Sessione e autenticazione HTTP', () => {
  let session: SessionService; let http: HttpTestingController;
  const token = (exp: number) => `header.${btoa(JSON.stringify({exp})).replace(/=/g,'')}.signature`;
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({providers:[provideRouter([]),provideHttpClient(withInterceptors([bearerInterceptor])),provideHttpClientTesting()]});
    session = TestBed.inject(SessionService); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { http.verify(); sessionStorage.clear(); });
  it('invia il token Bearer al profilo e conserva il ruolo restituito', () => {
    const value=token(Math.floor(Date.now()/1000)+300); sessionStorage.setItem('fantasta_token',value);
    session.profile().subscribe(); const req=http.expectOne(`${api.auth}/api/user/me`);
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${value}`);
    req.flush({id:1,email:'a@example.test',name:'A',surname:'B',role:'ADMIN'});
    expect(session.user()?.role).toBe('ADMIN');
  });
  it('scarta una sessione scaduta', () => {
    sessionStorage.setItem('fantasta_token',token(Math.floor(Date.now()/1000)-1));
    expect(session.token).toBeNull(); expect(sessionStorage.getItem('fantasta_token')).toBeNull();
  });
  it('memorizza il token solo dopo una risposta di login riuscita', () => {
    const value=token(Math.floor(Date.now()/1000)+300); session.login('a@example.test','password').subscribe();
    const req=http.expectOne(`${api.auth}/api/user/login`); expect(req.request.method).toBe('POST');
    expect(session.token).toBeNull(); req.flush({accessToken:value,userId:1,email:'a@example.test',name:'A',surname:'B'});
    expect(session.token).toBe(value);
  });
});
