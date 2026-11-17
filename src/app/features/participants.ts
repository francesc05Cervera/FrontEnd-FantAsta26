import { Component, DestroyRef, input, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, exhaustMap, of, timeout, timer } from 'rxjs';
import { api } from '../core/api';

interface Participant { id: number; userId: number; approved: boolean; }
@Component({ selector: 'app-participants', template: `
<section class="card"><p class="eyebrow">GESTIONE ASTA</p><h2>Partecipanti</h2>
@if(error()){<p class="error" role="alert">{{error()}}</p>}
@if(message()){<p role="status">{{message()}}</p>}
@if(loading()){<p>Caricamento partecipanti…</p>}@else {
  @for(p of participants(); track p.id){<div class="participant"><strong>Utente #{{p.userId}}</strong><span>{{p.approved ? 'Approvato' : 'In attesa'}}</span>
    @if(!p.approved){<button (click)="approve(p)" [disabled]="busy()">Approva</button><button (click)="reject(p)" [disabled]="busy()">Rifiuta</button>}
  </div>}@empty{<p>Nessuna richiesta di partecipazione.</p>}
}</section>` })
export class ParticipantsComponent implements OnInit {
  auctionId = input.required<number>(); private http=inject(HttpClient); private destroy=inject(DestroyRef);
  participants=signal<Participant[]>([]); loading=signal(true); busy=signal(false); error=signal(''); message=signal('');
  ngOnInit(){timer(0,10000).pipe(exhaustMap(()=>this.http.get<Participant[]>(`${api.auction}/api/participants/${this.auctionId()}/participants`).pipe(timeout(60000),catchError(()=>{this.error.set('Impossibile caricare i partecipanti.');this.loading.set(false);return of(null)}))),takeUntilDestroyed(this.destroy)).subscribe(data=>{if(data){this.participants.set(data);this.error.set('')}this.loading.set(false)});}
  approve(p:Participant){this.update(this.http.patch(`${api.auction}/api/participants/${this.auctionId()}/${p.userId}/approve`,null,{responseType:'text'}),'Partecipante approvato.');}
  reject(p:Participant){if(!window.confirm('Vuoi rifiutare la richiesta di questo partecipante?'))return;this.update(this.http.delete(`${api.auction}/api/participants/${this.auctionId()}/${p.userId}`,{responseType:'text'}),'Richiesta rifiutata.');}
  private update(request:import('rxjs').Observable<string>,message:string){this.busy.set(true);this.error.set('');this.message.set('');request.pipe(timeout(60000),takeUntilDestroyed(this.destroy)).subscribe({next:()=>{this.busy.set(false);this.message.set(message);this.http.get<Participant[]>(`${api.auction}/api/participants/${this.auctionId()}/participants`).pipe(takeUntilDestroyed(this.destroy)).subscribe({next:items=>this.participants.set(items),error:()=>this.error.set('Operazione completata, ma non è stato possibile aggiornare la lista.')})},error:()=>{this.busy.set(false);this.error.set('Operazione non riuscita. Riprova.')}});}
}
