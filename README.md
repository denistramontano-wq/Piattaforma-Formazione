# Piattaforma di Formazione

Repository del progetto. La progettazione completa (UX, architettura, database, roadmap) è in [`docs/`](docs/00-README.md).

Questo scaffold implementa progressivamente i capitoli del documento di progettazione:

- **01 — Struttura e sezioni**: le 15 sezioni funzionali (Home, Dashboard, Catalogo corsi, Categorie, Manuali, Video, Quiz, Mini giochi, Download, FAQ, Profilo, Progressi, Certificati, Dashboard amministratore) come pagine funzionanti collegate a un'API reale, con dati demo seedati.
- **02 — Gestione contenuti**: editor CMS no-code (corsi/moduli/lezioni, categorie, manuali con versioning, upload file, pubblicazione programmata).
- **03 — Sistema di ricerca**: motore federato full-text (PostgreSQL) su corsi/manuali/video/quiz/giochi/FAQ, incluso il testo estratto dai PDF.
- **06 — Intelligenza Artificiale**: generazione di riassunti/flashcard/quiz/mappe concettuali con revisione admin, e assistente virtuale RAG che risponde solo sui materiali caricati citando le fonti. Funziona anche **senza** chiave API (provider locale deterministico) — vedi sotto.

I capitoli restanti (gamification avanzata, dashboard analitiche approfondite, ecc.) sono pianificati.

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

## Utente demo

Non è ancora collegata l'autenticazione reale (SSO/JWT — vedi `docs/09-architettura-tecnica.md`, capitolo "Fondamenta"). Tutte le rotte personali (`/me/...`) operano sull'utente demo seedato (`maria.rossi@demo.piattaforma-formazione.it`).

## Stack

Vedi [`docs/09-architettura-tecnica.md`](docs/09-architettura-tecnica.md) per la motivazione di ogni scelta tecnologica.
