# FantAsta26

Frontend SPA Angular standalone per FantAsta. Richiede Node.js compatibile con Angular 21 e npm.

```sh
npm ci
npm start
```

Aprire http://localhost:4200/#/login. La SPA usa URL con hash, ad esempio `/#/login` e `/#/dashboard`: i vecchi collegamenti senza hash possono richiedere un redirect o la navigazione dalla pagina iniziale. La configurazione degli URL backend si trova in `src/environments/environment.ts`: per usare i servizi locali usare come riferimento `environment.local.example.ts` e sostituire gli URL prima della build. Non inserire segreti in questo progetto: la chiave API-Football rimane esclusivamente sul backend.

```sh
npm run build
npm test -- --watch=false
```

## Render Static Site

- Build: `npm ci && npm run build`
- Publish directory: `dist/frontend-fantasta26/browser`
- `public/_redirects` configura il fallback SPA a `index.html`.
- Prima del deploy configurare `AUTH_CORS_ALLOWEDORIGINS` su AuthService e `APP_CORS_ALLOWEDORIGINS` su PlayerService e AuctionService con l'origine esatta HTTPS del frontend (e `http://localhost:4200` per lo sviluppo), separando le origini con virgole. Non usare slash finale.
- Gli URL API sono incorporati nella build; per cambiarli modificare `src/environments/environment.ts` e ricostruire.

## Funzioni e limiti

Login e registrazione usano AuthService; profilo e ruolo provengono da `/api/user/me`. Il token è conservato in `sessionStorage`, inviato soltanto ai tre URL configurati e rimosso al logout o quando risulta scaduto. La sicurezza effettiva delle operazioni rimane sul backend.

Il frontend offre ricerca aste per codice, aste dell'utente, creazione, apertura/chiusura, richieste e approvazioni, squadre e assegnazioni. La pagina asta aggiorna i dati con polling mentre è aperta. La lista pubblica generale delle aste, rilanci, timer e WebSocket non sono disponibili negli endpoint backend verificati. I dati visualizzati provengono dalle API.

**Blocco di integrazione noto:** PlayerService produce ruoli `P`, `D`, `C`, `A`; l'attuale controllo dei limiti per ruolo di AuctionService riconosce `PORTIERE`, `DIFENSORE`, `CENTROCAMPISTA`, `ATTACCANTE`. Le assegnazioni possono essere rifiutate dal backend fino alla correzione coordinata dei contratti. Il frontend non altera il ruolo per aggirare il controllo.

I servizi Render possono richiedere tempo per il riavvio dopo inattività. Le richieste principali usano timeout e mostrano messaggi di errore. La sincronizzazione API-Football può richiedere diversi minuti.
