# Piattaforma di Formazione

Repository del progetto. La progettazione completa (UX, architettura, database, roadmap) è in [`docs/`](docs/00-README.md).

Questo scaffold implementa il **capitolo 01 — Struttura e sezioni della piattaforma**: le 15 sezioni funzionali (Home, Dashboard, Catalogo corsi, Categorie, Manuali, Video, Quiz, Mini giochi, Download, FAQ, Profilo, Progressi, Certificati, Dashboard amministratore) come pagine funzionanti collegate a un'API reale, con dati demo seedati. L'editor CMS no-code (capitolo 02), la ricerca federata (capitolo 03) e l'assistente IA (capitolo 06) sono i prossimi moduli pianificati.

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

## Utente demo

Non è ancora collegata l'autenticazione reale (SSO/JWT — vedi `docs/09-architettura-tecnica.md`, capitolo "Fondamenta"). Tutte le rotte personali (`/me/...`) operano sull'utente demo seedato (`maria.rossi@demo.piattaforma-formazione.it`).

## Stack

Vedi [`docs/09-architettura-tecnica.md`](docs/09-architettura-tecnica.md) per la motivazione di ogni scelta tecnologica.
