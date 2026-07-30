# Piattaforma di Formazione

Repository del progetto. La progettazione completa (UX, architettura, database, roadmap) è in [`docs/`](docs/00-README.md).

Questo scaffold implementa progressivamente i capitoli del documento di progettazione:

- **01 — Struttura e sezioni**: le 15 sezioni funzionali (Home, Dashboard, Catalogo corsi, Categorie, Manuali, Video, Quiz, Mini giochi, Download, FAQ, Profilo, Progressi, Certificati, Dashboard amministratore) come pagine funzionanti collegate a un'API reale, con dati demo seedati.
- **02 — Gestione contenuti**: editor CMS no-code (corsi/moduli/lezioni, categorie, manuali con versioning, upload file, pubblicazione programmata).
- **03 — Sistema di ricerca**: motore federato full-text (PostgreSQL) su corsi/manuali/video/quiz/giochi/FAQ, incluso il testo estratto dai PDF.
- **05 — Gamification**: 8 tipologie di mini gioco (flashcard, memory, drag&drop, puzzle, quiz a tempo, escape room, trova l'errore, abbinamento immagini), motore XP con livelli, badge assegnati automaticamente, streak giornaliera e classifica (settimanale/mensile/sempre), con pannello admin per configurare punti XP e badge.
- **06 — Intelligenza Artificiale**: generazione di riassunti/flashcard/quiz/mappe concettuali con revisione admin, e assistente virtuale RAG che risponde solo sui materiali caricati citando le fonti. Funziona anche **senza** chiave API (provider locale deterministico) — vedi sotto.
- **07 — Dashboard utente e admin**: dashboard utente con grafici (andamento corsi a ciambella, punteggi quiz nel tempo, tempo di studio settimanale stimato) e timeline attività; dashboard admin con trend nuove iscrizioni, funnel iscritti/completamenti per corso, analisi "domande più sbagliate" reale (basata sulle risposte salvate ad ogni tentativo) ed elenco utenti inattivi, entrambe con esportazione CSV.

I capitoli restanti (**04 — Sistema di quiz**, oltre le funzionalità base già presenti) sono pianificati.

## Struttura del repository

```
apps/
  api/   Backend NestJS + Prisma (PostgreSQL)
  web/   Frontend Next.js + Tailwind CSS
docs/    Documento di progettazione (17 capitoli)
docker-compose.yml   Postgres + Redis per lo sviluppo locale
```

## Avvio in locale

### 1. Database e cache

```bash
docker compose up -d
```

(In alternativa, un'istanza PostgreSQL 16 e Redis locali già in esecuzione vanno bene.)

### 2. Backend

```bash
cd apps/api
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

API disponibile su `http://localhost:3001/api/v1`.

### 3. Frontend

```bash
cd apps/web
cp .env.local.example .env.local
npm install
npm run dev
```

App disponibile su `http://localhost:3000`.

## Modulo IA (senza chiave API)

Il generatore di contenuti (`/admin/ai-generator`) e l'assistente virtuale (`/assistant`) funzionano fin da subito con un provider locale deterministico (nessuna chiamata esterna, nessun costo): riassunti estrattivi, flashcard e quiz per estrazione di parole chiave, mappe concettuali per co-occorrenza, risposte composte dagli estratti più pertinenti dei materiali. Per usare Anthropic Claude al posto del provider locale, imposta `ANTHROPIC_API_KEY` in `apps/api/.env` (vedi `.env.example`): il passaggio è automatico, senza altre modifiche.

## Modulo Gamification — semplificazioni rispetto a docs/05

Per restare nello scope realizzabile in questa fase, il modulo gamification si discosta in alcuni punti dal disegno "ideale" del capitolo 5, con scelte pragmatiche documentate:

- **Motore XP/badge sincrono**, non un bus di eventi (BullMQ/Redis Streams): l'assegnazione avviene direttamente nelle chiamate API che completano un'azione (lezione, quiz, mini gioco). A questa scala funzionalmente equivalente, senza la complessità di consumer indipendenti.
- **Classifica calcolata con aggregazioni SQL** (Prisma `groupBy`), non Redis Sorted Set: corretto e sufficientemente veloce per i volumi di questa fase; da rivedere se il numero di utenti crescerà molto (vedi `docs/16-scalabilita-manutenibilita.md`).
- **Streak giornaliera approssimata**: non esiste ancora un sistema di login reale, quindi la streak si aggiorna alla prima chiamata autenticata della giornata (es. apertura del profilo), non a un vero evento di accesso.
- **Regole badge codificate**, non un motore di regole data-driven: ogni badge seedato ha un `code` collegato a un controllo scritto nel codice (`badge-engine.service.ts`). L'admin può modificare nome/descrizione o creare un nuovo badge scegliendo tra le regole disponibili, ma non definire criteri arbitrari da interfaccia.

## Modulo Dashboard — semplificazioni rispetto a docs/07

- **Tempo di studio stimato, non tracciato**: non esiste un meccanismo di rilevazione del tempo reale sulla pagina (richiederebbe un endpoint di heartbeat lato client). Il grafico settimanale somma i minuti stimati (`estimatedMinutes`) delle lezioni completate in ciascuna settimana, non il tempo effettivo trascorso.
- **"A rischio abbandono"** è un'euristica (iscrizione in corso senza attività da più di 14 giorni), non uno stato salvato esplicitamente.
- **Analytics calcolate on-demand** (query dirette), non tabelle di riepilogo ricalcolate da job schedulati come descritto nel capitolo: a questi volumi di dati sufficientemente rapido, da rivedere in scala (vedi `docs/16-scalabilita-manutenibilita.md`).
- **Export solo CSV**, generato lato client dai dati già caricati: niente Excel/PDF né builder di report con invio email programmato.
- Le **"domande più sbagliate"** sono ora reali (tabella `QuizAttemptAnswer` popolata ad ogni tentativo), ma solo sui tentativi svolti da quando questa tabella esiste — i tentativi precedenti non hanno il dettaglio per domanda.

## Utente demo

Non è ancora collegata l'autenticazione reale (SSO/JWT — vedi `docs/09-architettura-tecnica.md`, capitolo "Fondamenta"). Tutte le rotte personali (`/me/...`) operano sull'utente demo seedato (`maria.rossi@demo.piattaforma-formazione.it`).

## Stack

Vedi [`docs/09-architettura-tecnica.md`](docs/09-architettura-tecnica.md) per la motivazione di ogni scelta tecnologica.
