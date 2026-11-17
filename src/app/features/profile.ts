import {Component,inject,signal} from '@angular/core';
import {SessionService} from '../core/api';
@Component({template:`<header><p class="eyebrow">IL TUO ACCOUNT</p><h1>Profilo</h1></header><section class="card">@if(user()){<h2>{{user()?.name}} {{user()?.surname}}</h2><p>{{user()?.email}}</p><p>Ruolo: {{user()?.role}}</p>}@else if(error()){<p class="error">Impossibile caricare il profilo.</p><button (click)="load()">Riprova</button>}@else{<p>Caricamento…</p>}</section>`})
export class ProfilePage{private session=inject(SessionService);user=this.session.user;error=signal(false);constructor(){this.load()}load(){this.error.set(false);this.session.profile().subscribe({error:()=>this.error.set(true)});}}
