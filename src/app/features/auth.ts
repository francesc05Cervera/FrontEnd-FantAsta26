import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { switchMap, timeout } from 'rxjs';
import { api, SessionService } from '../core/api';

@Component({ imports: [ReactiveFormsModule, RouterLink], template: `
<section class="auth"><div><p class="eyebrow">IL FANTACALCIO, INSIEME</p><h1>La tua asta.<br><em>La tua squadra.</em><br>La tua stagione.</h1><p>Organizza le aste con i tuoi amici e costruisci la rosa perfetta.</p></div><div class="card"><p class="eyebrow">FANTASTA26</p><h2>{{register ? 'Crea il tuo account' : 'Bentornato'}}</h2><form [formGroup]="form" (ngSubmit)="submit()">@if(register){<label>Nome<input formControlName="name"></label><label>Cognome<input formControlName="surname"></label>}<label>Email<input type="email" formControlName="email" autocomplete="email"></label><label>Password<input type="password" formControlName="password"></label>@if(error()){<p class="error" role="alert">{{error()}}</p>} @if(success()){<p>{{success()}}</p>}<button class="primary" [disabled]="busy()">{{busy() ? 'Attendere…' : register ? 'Registrati' : 'Accedi'}}</button></form><p>{{register ? 'Hai già un account?' : 'Non hai un account?'}} <a [routerLink]="register ? '/login' : '/registrazione'">{{register ? 'Accedi' : 'Registrati'}}</a></p></div></section>` })
export class AuthPage {
 private router=inject(Router); private fb=inject(FormBuilder); private http=inject(HttpClient); private session=inject(SessionService);
 register=this.router.url.startsWith('/registrazione'); busy=signal(false); error=signal(''); success=signal('');
 form=this.fb.nonNullable.group({name:'',surname:'',email:['',[Validators.required,Validators.email]],password:['',Validators.required]});
 submit(){ if(this.form.invalid || (this.register && (!this.form.value.name?.trim() || !this.form.value.surname?.trim()))){this.error.set('Completa correttamente tutti i campi.');return;} this.busy.set(true); this.error.set(''); const v=this.form.getRawValue();
 const request=this.register ? this.http.post(`${api.auth}/api/user/register`,v).pipe(timeout(60000)) : this.session.login(v.email,v.password).pipe(switchMap(()=>this.session.profile()));
 request.subscribe({next:()=>{this.busy.set(false);if(this.register)this.success.set('Registrazione completata. Ora puoi accedere.');else void this.router.navigateByUrl('/dashboard');},error:()=>{this.busy.set(false);this.error.set('Operazione non riuscita. Controlla i dati o riprova tra poco.');}});
 }
}
