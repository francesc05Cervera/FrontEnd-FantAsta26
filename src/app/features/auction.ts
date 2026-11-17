import { Component, DestroyRef, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, exhaustMap, forkJoin, Observable, of, timeout, timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { api, SessionService } from '../core/api';
import { ParticipantsComponent } from './participants';
import { AssignmentFormComponent } from './assignment-form';

interface Auction { id: number; name: string; auctionCode: string; status: string; creatorUserId: number; initialCredits: number; }
interface Team { id: number; name: string; ownerUserId: number; budget: number; }
interface Assignment { id: number; teamId: number; playerId: number; role: string; cost: number; }
type Section<T> = { data: T | null; error: string | null };

@Component({ imports: [FormsModule, RouterLink, ParticipantsComponent, AssignmentFormComponent], template: `
  <a routerLink="/dashboard">← Torna alla dashboard</a>
  @if (auction(); as a) {
    <header><p class="eyebrow">ASTA · {{a.auctionCode}}</p><h1>{{a.name}}</h1><p>Stato: {{a.status}} · Budget iniziale: {{a.initialCredits}}</p></header>
    @if (error()) { <p class="error" role="alert">{{error()}}</p> }
    @if (message()) { <p role="status">{{message()}}</p> }
    @if (session.user()?.id === a.creatorUserId) {
      <section class="card"><h2>Gestione stato</h2><p>Le richieste di partecipazione sono consentite quando l'asta è aperta.</p>
      @if(a.status === 'CREATED'){<button (click)="changeStatus('OPEN')" [disabled]="busy()">Apri asta</button>}
      @if(a.status === 'OPEN'){<button (click)="changeStatus('CLOSED')" [disabled]="busy()">Chiudi asta</button>}</section>
      <app-participants [auctionId]="a.id" />
      @if(a.status === 'OPEN'){<app-assignment-form [auctionId]="a.id" [teams]="teams()" (changed)="load()" />}
    } @else {
      <section class="card"><h2>Partecipazione</h2><p>Se non sei ancora partecipante, invia una richiesta all'organizzatore.</p><button (click)="join()" [disabled]="busy() || a.status !== 'OPEN'">Richiedi partecipazione</button></section>
    }
    <div class="grid">
      <section class="card"><h2>Squadre</h2>
        @if (teamsError()) { <p>{{teamsError()}}</p> } @else {
          @for (t of teams(); track t.id) { <div class="row"><strong>{{t.name}}</strong><span>Utente #{{t.ownerUserId}}</span><span>@if(!assignmentsError()){Budget residuo: {{remaining(t)}}}@else{Budget non disponibile}</span></div> }
          @empty { <p>Nessuna squadra disponibile.</p> }
          <label>Nome squadra<input [(ngModel)]="teamName"></label><button (click)="createTeam()" [disabled]="busy() || !teamName.trim()">Crea squadra</button>
        }
      </section>
      <section class="card"><h2>Assegnazioni</h2>
        @if (assignmentsError()) { <p>{{assignmentsError()}}</p> } @else {
          @for (x of assignments(); track x.id) { <div class="row"><strong>Calciatore #{{x.playerId}}</strong><span>{{x.role}}</span><span>{{x.cost}} crediti</span></div> }
          @empty { <p>Nessun calciatore assegnato.</p> }
        }
      </section>
    </div>
  } @else if (error()) { <p class="error" role="alert">{{error()}}</p><button (click)="load()">Riprova</button> }
  @else { <p>Caricamento asta…</p> }
` })
export class AuctionPage {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private destroy = inject(DestroyRef);
  session = inject(SessionService);
  readonly id = Number(this.route.snapshot.paramMap.get('id'));
  auction = signal<Auction | null>(null);
  teams = signal<Team[]>([]);
  assignments = signal<Assignment[]>([]);
  teamsError = signal<string | null>(null);
  assignmentsError = signal<string | null>(null);
  error = signal(''); message = signal(''); busy = signal(false); teamName = '';

  constructor() {
    this.session.profile().subscribe({ error: () => {} });
    timer(0, 3000).pipe(exhaustMap(() => this.fetch()), takeUntilDestroyed(this.destroy)).subscribe(result => this.apply(result));
  }
  private section<T>(request: Observable<T>): Observable<Section<T>> {
    return request.pipe(timeout(60000),
      // Keep authorization failures separate from connection/server failures.
      // A failed optional section must not hide the auction itself.
      // An empty array remains a successful, empty response.
      importMapSection<T>(),
      catchError((error: unknown) => of({ data: null, error: error instanceof HttpErrorResponse && (error.status === 403 || error.status === 401)
        ? 'Disponibile per organizzatore e partecipanti approvati.' : 'Impossibile caricare questa sezione. Riprova tra poco.' })));
  }
  private fetch() {
    return forkJoin({
      auction: this.section(this.http.get<Auction>(`${api.auction}/api/auctions/${this.id}`)),
      teams: this.section(this.http.get<Team[]>(`${api.auction}/api/teams/${this.id}`)),
      assignments: this.section(this.http.get<Assignment[]>(`${api.auction}/api/assignments/${this.id}`))
    });
  }
  private apply(result: { auction: Section<Auction>; teams: Section<Team[]>; assignments: Section<Assignment[]> }) {
    if (result.auction.data) { this.auction.set(result.auction.data); this.error.set(''); }
    else this.error.set('Impossibile caricare i dettagli dell’asta. Verifica la connessione e riprova.');
    this.teams.set(result.teams.data ?? []); this.teamsError.set(result.teams.error);
    this.assignments.set(result.assignments.data ?? []); this.assignmentsError.set(result.assignments.error);
  }
  load() { this.fetch().pipe(takeUntilDestroyed(this.destroy)).subscribe(result => this.apply(result)); }
  remaining(team: Team) { return team.budget - this.assignments().filter(item => item.teamId === team.id).reduce((sum, item) => sum + item.cost, 0); }
  join() { this.action(this.http.post(`${api.auction}/api/participants/${this.id}/join`, null, { responseType: 'text' }), 'Richiesta inviata.'); }
  changeStatus(status: 'OPEN' | 'CLOSED') {
    if (status === 'CLOSED' && !window.confirm('Vuoi chiudere questa asta?')) return;
    this.action(this.http.patch(`${api.auction}/api/auctions/${this.id}/status`, { status }), status === 'OPEN' ? 'Asta aperta.' : 'Asta chiusa.');
  }
  createTeam() { this.action(this.http.post(`${api.auction}/api/teams/${this.id}`, this.teamName, { headers: { 'Content-Type': 'text/plain' } }), 'Squadra creata.'); }
  private action(request: Observable<unknown>, success: string) {
    this.busy.set(true); this.error.set('');
    request.pipe(timeout(60000), takeUntilDestroyed(this.destroy)).subscribe({ next: () => { this.busy.set(false); this.message.set(success); this.load(); },
      error: () => { this.busy.set(false); this.error.set('Operazione non riuscita. Verifica i permessi e riprova.'); } });
  }
}

import { map } from 'rxjs';
function importMapSection<T>() { return map((data: T): Section<T> => ({ data, error: null })); }
