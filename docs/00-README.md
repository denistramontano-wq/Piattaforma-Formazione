# Piattaforma Web di Formazione — Progetto Completo

> Documento di progettazione redatto come se fosse il lavoro congiunto di un team multidisciplinare:
> **UX/UI Designer senior · Software Architect · Full Stack Developer · Esperto di e-learning · Esperto di gamification · Esperto di Intelligenza Artificiale · Product Manager**

## Obiettivo della piattaforma

Realizzare una piattaforma web professionale, moderna, intuitiva e facilmente espandibile per la formazione aziendale/istituzionale, che permetta agli utenti di:

- seguire corsi formativi strutturati in moduli e lezioni
- consultare manuali e documentazione versionata
- guardare video didattici
- scaricare materiali (PDF, Word, Excel, PowerPoint, immagini)
- svolgere test di apprendimento con tipologie di domanda variegate
- giocare a mini giochi educativi (gamification)
- monitorare i propri progressi (tempo, punteggi, badge, XP)
- ottenere certificati di completamento

L'amministratore deve poter creare e gestire **tutti** i contenuti tramite un CMS interno, **senza scrivere codice**.

## Indice del progetto

| # | Documento | Contenuto |
|---|---|---|
| 01 | [Struttura e sezioni della piattaforma](01-struttura-sezioni.md) | Le 15 sezioni funzionali: descrizione, schermate, flusso utente |
| 02 | [Gestione dei contenuti (CMS)](02-gestione-contenuti.md) | Corsi, moduli, lezioni, upload multi-formato, versioning, scheduling |
| 03 | [Sistema di ricerca](03-sistema-ricerca.md) | Ricerca full-text unificata, indicizzazione PDF |
| 04 | [Sistema di quiz](04-sistema-quiz.md) | 7 tipologie di domanda, motore di scoring |
| 05 | [Gamification](05-gamification.md) | Mini giochi, badge, livelli, XP, classifiche |
| 06 | [Intelligenza Artificiale](06-intelligenza-artificiale.md) | Generazione automatica contenuti, assistente RAG |
| 07 | [Dashboard Utente e Amministratore](07-dashboard-utente-e-admin.md) | Metriche, progressi, report |
| 08 | [UX/UI Design](08-ux-ui-design.md) | Design system, wireframe concettuali, accessibilità |
| 09 | [Architettura tecnica](09-architettura-tecnica.md) | Stack, diagramma architetturale, sicurezza, backup |
| 10 | [Modello del database](10-database-model.md) | Schema ER completo |
| 11 | [Sitemap](11-sitemap.md) | Mappa completa del sito |
| 12 | [Flusso di navigazione](12-flusso-navigazione.md) | User journey utente e amministratore |
| 13 | [Piano di sviluppo](13-piano-sviluppo.md) | MVP → v1.0 → sviluppi futuri |
| 14 | [User story](14-user-stories.md) | Backlog per utenti e amministratori |
| 15 | [Stima del lavoro](15-stima-lavoro.md) | Effort per modulo (person-day) |
| 16 | [Scalabilità e manutenibilità](16-scalabilita-manutenibilita.md) | Linee guida di crescita |

## Ruoli del sistema

| Ruolo | Descrizione |
|---|---|
| **Utente / Studente** | Fruisce dei contenuti, svolge quiz e giochi, accumula progressi e certificati |
| **Formatore / Content Editor** | Crea e gestisce corsi, lezioni, quiz, materiali (permessi limitati al proprio ambito) |
| **Amministratore** | Gestione completa piattaforma: contenuti, utenti, categorie, statistiche, configurazioni |
| **Super Admin** | Come Amministratore + gestione ruoli, sicurezza, integrazioni, billing |

## Stack tecnologico (sintesi)

| Livello | Scelta |
|---|---|
| Frontend | Next.js (React) + TypeScript + Tailwind CSS |
| Backend | NestJS (Node.js/TypeScript) — API REST + moduli |
| Database | PostgreSQL + pgvector |
| Cache / code / real-time | Redis + BullMQ |
| Ricerca | OpenSearch (o Meilisearch) |
| Storage file | S3-compatibile (AWS S3 / MinIO) |
| Video | HLS transcoding (AWS MediaConvert o self-hosted ffmpeg) + CDN |
| Autenticazione | JWT + refresh token, OAuth2 (Google/Microsoft), MFA opzionale |
| IA | Anthropic Claude API (RAG, generazione contenuti, assistente documentale) |
| Infrastruttura | Docker + Kubernetes (o AWS ECS Fargate), CI/CD GitHub Actions |

Dettagli e motivazioni in [09-architettura-tecnica.md](09-architettura-tecnica.md).
