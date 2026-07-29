# 1. Struttura della piattaforma

Le 15 sezioni funzionali richieste, con descrizione, schermate necessarie, entità di database coinvolte e flusso utente essenziale. I dettagli implementativi di CMS, ricerca, quiz, gamification e IA sono approfonditi nei capitoli dedicati.

## 1.1 Home

**Descrizione:** landing page post-login (o pre-login per utenti anonimi con contenuti promozionali). Mostra corsi in evidenza, continua a guardare/studiare, annunci, scadenze.

- **Schermate:** Home pubblica (marketing, se prevista), Home autenticata (personalizzata).
- **Database:** `courses` (featured), `enrollments` (in-progress), `announcements`.
- **Flusso utente:** login → home → widget "riprendi da dove eri" → click → lezione.
- **API:** `GET /home/highlights`, `GET /home/continue-learning`, `GET /announcements`.
- **Criticità:** personalizzazione richiede query aggregate performanti (cache Redis consigliata).

## 1.2 Dashboard utente

Vedi capitolo [07 — Dashboard Utente e Amministratore](07-dashboard-utente-e-admin.md).

## 1.3 Catalogo corsi

**Descrizione:** elenco filtrabile di tutti i corsi pubblicati, con filtri per categoria, livello, durata, tag, stato iscrizione.

- **Schermate:** Catalogo (griglia/lista card), Filtri laterali, Scheda corso (dettaglio pre-iscrizione).
- **Database:** `courses`, `categories`, `tags`, `course_tags`, `enrollments`.
- **Flusso utente:** catalogo → filtro/ricerca → scheda corso → "Iscriviti" → dashboard corso.
- **API:** `GET /courses?category=&level=&tag=&q=`, `GET /courses/:id`, `POST /courses/:id/enroll`.
- **Criticità:** paginazione e faceted search performanti su grandi cataloghi (>1000 corsi).

## 1.4 Categorie

**Descrizione:** tassonomia gerarchica (categoria → sottocategoria) usata per organizzare corsi, manuali, video, quiz.

- **Schermate:** Pagina categoria (con sotto-elenco contenuti), Admin: gestione albero categorie (drag&drop).
- **Database:** `categories` (self-referencing `parent_id`).
- **Flusso utente:** home/catalogo → categoria → sottocategoria → contenuti.
- **API:** `GET /categories/tree`, `POST/PUT/DELETE /admin/categories`.
- **Criticità:** evitare cicli nell'albero; query ricorsive (CTE in PostgreSQL).

## 1.5 Lezioni

**Descrizione:** unità atomica di apprendimento all'interno di un modulo di corso; può contenere testo, video, allegati, quiz finale.

- **Schermate:** Player lezione (contenuto + sidebar indice modulo + pulsante "completa"), Note personali.
- **Database:** `lessons`, `lesson_progress`, `modules`, `lesson_attachments`.
- **Flusso utente:** corso → modulo → lezione → completamento → sblocco lezione successiva (se sequenziale).
- **API:** `GET /lessons/:id`, `POST /lessons/:id/complete`, `POST /lessons/:id/notes`.
- **Criticità:** gestione progressione (lineare vs libera), tracking tempo di permanenza accurato.

## 1.6 Manuali

**Descrizione:** repository documentale versionato (PDF/Word) consultabile online o scaricabile.

- **Schermate:** Elenco manuali, Viewer documento (PDF inline), Storico versioni.
- **Database:** `documents`, `document_versions`.
- **Flusso utente:** area manuali → filtro categoria → apertura viewer → download opzionale.
- **API:** `GET /documents`, `GET /documents/:id/versions`, `GET /documents/:id/download`.
- **Criticità:** conversione/anteprima Office → PDF; indicizzazione testo per ricerca (vedi cap. 3).

## 1.7 Video

**Descrizione:** libreria video didattici in streaming adattivo, con capitoli, sottotitoli, velocità variabile.

- **Schermate:** Elenco video, Player video (HLS, sottotitoli, note a timestamp).
- **Database:** `videos`, `video_watch_progress`, `video_captions`.
- **Flusso utente:** libreria → video → player → tracking % visione → completamento automatico a soglia (es. 90%).
- **API:** `GET /videos`, `GET /videos/:id/manifest`, `POST /videos/:id/progress`.
- **Criticità:** transcoding multi-bitrate, costo storage/banda, protezione contenuti (signed URL).

## 1.8 Quiz

Vedi capitolo [04 — Sistema di quiz](04-sistema-quiz.md).

## 1.9 Mini giochi

Vedi capitolo [05 — Gamification](05-gamification.md).

## 1.10 Area Download

**Descrizione:** repository centralizzato di tutti gli allegati scaricabili (PDF, Word, Excel, PowerPoint, immagini) indipendente dal corso di appartenenza.

- **Schermate:** Elenco download con filtro tipo file/categoria, anteprima.
- **Database:** `files` (tabella polimorfica collegata a `lessons`, `courses`, `documents`).
- **Flusso utente:** area download → filtro formato → download singolo o multiplo (zip).
- **API:** `GET /downloads`, `GET /downloads/:id`.
- **Criticità:** controllo permessi (alcuni file riservati a corsi a pagamento/interni), virus scan on-upload.

## 1.11 FAQ

**Descrizione:** knowledge base di domande frequenti, categorizzata, con ricerca e voto di utilità.

- **Schermate:** Elenco FAQ (accordion), Admin: editor FAQ.
- **Database:** `faqs`, `faq_categories`, `faq_feedback`.
- **Flusso utente:** ricerca/naviga FAQ → espandi risposta → vota utile/non utile.
- **API:** `GET /faqs`, `POST /faqs/:id/feedback`.
- **Criticità:** collegamento con assistente IA (fallback automatico a FAQ pertinenti).

## 1.12 Profilo utente

**Descrizione:** dati anagrafici, preferenze (lingua, notifiche, tema chiaro/scuro), sicurezza account.

- **Schermate:** Profilo (view/edit), Sicurezza (password, MFA, sessioni attive), Preferenze notifiche.
- **Database:** `users`, `user_preferences`, `user_sessions`.
- **Flusso utente:** menu profilo → modifica dati → salva → conferma.
- **API:** `GET/PUT /me`, `PUT /me/password`, `GET /me/sessions`.
- **Criticità:** GDPR (export/cancellazione dati), validazione cambio email.

## 1.13 Progressi

**Descrizione:** vista analitica personale su corsi, quiz, tempo di studio, andamento nel tempo.

- **Schermate:** Progressi (grafici a barre/linee), Dettaglio per corso.
- **Database:** `enrollments`, `lesson_progress`, `quiz_attempts`, `study_sessions`.
- **Flusso utente:** dashboard → "Progressi" → filtro periodo/corso → drill-down.
- **API:** `GET /me/progress`, `GET /me/progress/:courseId`.
- **Criticità:** aggregazioni storiche performanti (tabelle di riepilogo/materialized view).

## 1.14 Certificati

**Descrizione:** generazione automatica di certificato PDF al completamento corso (100% lezioni + soglia quiz superata).

- **Schermate:** Elenco certificati, Anteprima/Download PDF, Verifica pubblica certificato (QR/codice).
- **Database:** `certificates` (template, codice univoco, data emissione, hash verifica).
- **Flusso utente:** completamento corso → generazione automatica → notifica → download/condivisione LinkedIn.
- **API:** `GET /me/certificates`, `GET /certificates/:code/verify` (pubblica).
- **Criticità:** template grafico personalizzabile da admin, anti-contraffazione (firma/hash verificabile).

## 1.15 Dashboard amministratore

Vedi capitolo [07 — Dashboard Utente e Amministratore](07-dashboard-utente-e-admin.md).
