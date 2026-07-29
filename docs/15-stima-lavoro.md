# 15. Stima del lavoro per modulo

Stima in **giorni/persona (gg/p)**, a livello indicativo per un team full-stack composto da: 1 designer UX/UI, 2-3 sviluppatori full-stack, 1 QA, 1 PM/PO part-time. Le stime includono sviluppo + test, escludono discovery/design iniziale (già conteggiata a parte).

## 15.1 Fondamenta (una tantum)

| Modulo | gg/p |
|---|---|
| Setup infrastruttura (repo, CI/CD, ambienti, IaC base) | 8 |
| Design system UI (componenti base, tema chiaro/scuro, layout) | 12 |
| Autenticazione e gestione utenti/ruoli (RBAC) | 12 |
| **Totale fondamenta** | **32** |

## 15.2 MVP

| Modulo | gg/p |
|---|---|
| CMS: corsi/moduli/lezioni (editor + API) | 18 |
| Upload file multi-formato + storage + scan antivirus | 10 |
| Catalogo corsi, categorie, ricerca base | 8 |
| Player lezione (testo/video/PDF) + tracking progresso | 12 |
| Quiz base (multipla, V/F, completamento frase) + player | 14 |
| Area download | 4 |
| FAQ | 4 |
| Dashboard utente essenziale | 8 |
| Dashboard admin essenziale (statistiche base) | 8 |
| Certificati PDF automatici | 6 |
| QA end-to-end + hardening sicurezza MVP | 10 |
| **Totale MVP** | **102** |

## 15.3 Versione 1.0

| Modulo | gg/p |
|---|---|
| Quiz avanzati (drag&drop, ordinamento, risposta aperta, immagini) | 14 |
| Gamification: mini giochi (flashcard, memory, drag&drop, puzzle, quiz a tempo) | 22 |
| Gamification: XP, livelli, badge, classifiche | 14 |
| Motore di ricerca dedicato + indicizzazione PDF (incl. OCR) | 16 |
| Assistente IA (RAG): pipeline embedding + chat + citazione fonti | 20 |
| Generazione IA per admin (riassunti/flashcard/quiz) + workflow revisione | 16 |
| Versionamento manuali + pubblicazione programmata | 8 |
| Dashboard admin avanzata (analytics, utenti inattivi, report esportabili) | 16 |
| SSO enterprise (SAML/OIDC) + MFA | 10 |
| Notifiche in-app/email | 8 |
| Verifica pubblica certificati | 4 |
| QA end-to-end + performance testing + sicurezza | 14 |
| **Totale v1.0** | **162** |

## 15.4 Sintesi

| Fase | gg/p | Indicativo (team di 4-5 persone) |
|---|---|---|
| Fondamenta | 32 | ~1,5-2 settimane |
| MVP | 102 | ~10-12 settimane |
| Versione 1.0 | 162 | ~14-16 settimane |
| **Totale MVP + 1.0** | **~296 gg/p** | **~6-7 mesi con team parallelo** |

## 15.5 Note sulla stima

- Le stime **non includono** design/discovery iniziale (cap. 13.4), attività di project management continuativo, né i moduli "sviluppi futuri" (cap. 13.3).
- Il modulo IA (RAG + generazione) è il più soggetto a variabilità: dipende dalla qualità dei documenti sorgente e richiede iterazione su prompt/qualità risultati — consigliato un buffer di rischio +20% su quella voce.
- Parallelizzabilità: CMS e Quiz possono procedere in parallelo a Design System/Auth una volta definite le API; Gamification e Ricerca sono relativamente indipendenti tra loro e parallelizzabili nello stesso periodo.
- Stima basata su un team con esperienza pregressa nello stack indicato (cap. 9); team meno esperto sullo stack → aggiungere 15-25%.
