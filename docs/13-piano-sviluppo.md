# 13. Piano di sviluppo — MVP, v1.0, sviluppi futuri

## 13.1 MVP (obiettivo: validare il valore core con il minimo indispensabile)

**Focus:** un utente può formarsi su un corso end-to-end, un admin può creare contenuti senza codice.

- Autenticazione base (email/password + eventuale SSO Google)
- CMS: creazione corsi/moduli/lezioni, upload PDF/Word/immagini/video (senza versioning avanzato)
- Fruizione lezioni (testo, video, PDF), tracking completamento
- Quiz: solo tipologie **multipla, vero/falso, completamento frase**
- Catalogo corsi + categorie + ricerca base (PostgreSQL full-text, senza motore dedicato)
- Area download
- Dashboard utente essenziale (corsi in corso/completati, punteggi)
- Certificato PDF automatico alla fine del corso
- Dashboard admin essenziale (utenti, corsi più seguiti, iscrizioni)
- Tema chiaro/scuro, layout responsive
- FAQ statiche (gestite da CMS)

**Esplicitamente fuori dall'MVP:** mini giochi, gamification (XP/badge/classifiche), assistente IA, generazione automatica contenuti IA, ricerca full-text nei PDF con motore dedicato, report avanzati/esportabili, SSO enterprise/SAML.

## 13.2 Versione 1.0 (prodotto completo per il mercato/adozione aziendale)

- Tutte le **7 tipologie di quiz** (incl. drag&drop, ordinamento, selezione immagini, risposta aperta)
- **Gamification completa**: mini giochi (flashcard, memory, drag&drop, puzzle, quiz a tempo), XP, livelli, badge, classifiche
- **Motore di ricerca dedicato** (OpenSearch/Meilisearch) con indicizzazione full-text dei PDF (incl. OCR)
- **Assistente IA (RAG)** che risponde sui documenti caricati
- **Generazione IA assistita** per admin: riassunti, flashcard, quiz automatici (con revisione umana)
- Versionamento manuali completo + pubblicazione programmata
- Dashboard admin avanzata: domande più sbagliate, utenti inattivi, report esportabili (CSV/PDF)
- SSO aziendale (SAML/OIDC), MFA
- Notifiche in-app e via email
- Verifica pubblica certificati (QR/codice)

## 13.3 Sviluppi futuri (post 1.0)

- Mini giochi avanzati: **Escape Room**, **Trova l'errore**, **Abbinamento immagini**
- Mappe concettuali generate/editabili dall'IA, casi pratici e simulazioni interattive avanzate (branching)
- Multi-tenancy completo (white-label per più organizzazioni/clienti)
- App mobile nativa (o PWA installabile) con supporto offline per contenuti scaricati
- Percorsi formativi personalizzati/adattivi basati su IA (raccomandazione next-best-content)
- Integrazioni HRIS/LMS esterni (xAPI/SCORM import-export, per interoperabilità con altri sistemi di formazione)
- Videoconferenza/formazione live integrata (webinar, sessioni sincrone con attestazione presenza)
- Marketplace di contenuti tra organizzazioni diverse
- Analisi predittiva (rischio abbandono, suggerimento interventi formativi mirati)
- API pubbliche per sviluppatori terzi (integrazioni custom)

## 13.4 Timeline indicativa (alto livello)

| Fase | Durata stimata | Output |
|---|---|---|
| Discovery & design (UX, architettura, DB) | 3-4 settimane | Wireframe, schema DB, decisioni tecniche |
| MVP | 10-12 settimane | Piattaforma funzionante, corso end-to-end |
| Beta interna / feedback | 2-3 settimane | Iterazioni su usabilità |
| v1.0 | 12-14 settimane dopo MVP | Gamification, IA, ricerca avanzata, analytics |
| Sviluppi futuri | roadmap continua trimestrale | Prioritizzati da feedback utenti/mercato |

*(Stime a livello di macro-pianificazione; il dettaglio per modulo è nel capitolo 15 — Stima del lavoro.)*
