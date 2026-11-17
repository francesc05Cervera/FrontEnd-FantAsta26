import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { timeout } from 'rxjs';
import { api } from '../core/api';

@Component({ imports: [ReactiveFormsModule, RouterLink], template: `
<a routerLink="/dashboard">← Torna alla dashboard</a>
<header><p class="eyebrow">UNA NUOVA STAGIONE</p><h1>Crea un'asta</h1><p>Scegli il budget e i limiti della rosa. Potrai condividere il codice con i tuoi amici.</p></header>
<section class="card"><form [formGroup]="form" (ngSubmit)="submit()">
  <label>Nome dell'asta<input formControlName="name" maxlength="100"></label>
  <div class="grid"><label>Budget iniziale<input type="number" min="1" formControlName="initialCredits"></label><label>Totale calciatori per squadra<input type="number" min="1" formControlName="maxPlayersPerTeam"></label></div>
  <div class="grid"><label>Portieri<input type="number" min="1" formControlName="maxGoalkeepers"></label><label>Difensori<input type="number" min="1" formControlName="maxDefenders"></label><label>Centrocampisti<input type="number" min="1" formControlName="maxMidfielders"></label><label>Attaccanti<input type="number" min="1" formControlName="maxForwards"></label></div>
  <p>La somma dei ruoli deve coincidere con il totale dei calciatori.</p>
  @if(error()){<p class="error" role="alert">{{error()}}</p>}
  <button class="primary" [disabled]="busy()">{{busy() ? 'Creazione in corso…' : 'Crea asta'}}</button>
</form></section>` })
export class CreateAuctionPage {
  private fb = inject(FormBuilder); private http = inject(HttpClient); private router = inject(Router);
  busy = signal(false); error = signal('');
  form = this.fb.nonNullable.group({ name: ['', Validators.required], initialCredits: [500, [Validators.required, Validators.min(1)]],
    maxPlayersPerTeam: [25, [Validators.required, Validators.min(1)]], maxGoalkeepers: [3, [Validators.required, Validators.min(1)]],
    maxDefenders: [8, [Validators.required, Validators.min(1)]], maxMidfielders: [8, [Validators.required, Validators.min(1)]], maxForwards: [6, [Validators.required, Validators.min(1)]] });
  submit() {
    const v = this.form.getRawValue();
    if (this.form.invalid || !v.name.trim() || v.maxGoalkeepers + v.maxDefenders + v.maxMidfielders + v.maxForwards !== v.maxPlayersPerTeam) {
      this.error.set('Controlla i campi: il nome è obbligatorio, i valori devono essere positivi e la somma dei ruoli deve coincidere con il totale.'); return;
    }
    this.error.set(''); this.busy.set(true);
    this.http.post<{ id: number }>(`${api.auction}/api/auctions/create`, { ...v, name: v.name.trim() }).pipe(timeout(60000)).subscribe({
      next: result => { this.busy.set(false); void this.router.navigate(['/aste', result.id]); },
      error: () => { this.busy.set(false); this.error.set('Non è stato possibile creare l’asta. Verifica i dati e riprova.'); }
    });
  }
}
