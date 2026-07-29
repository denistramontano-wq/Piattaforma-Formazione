# 5. Gamification

## 5.1 Mini giochi educativi

| Gioco | Meccanica | Note implementative |
|---|---|---|
| **Flashcard** | Carte fronte/retro, spaced repetition (algoritmo tipo SM-2) | generabili automaticamente dall'IA (cap. 6) |
| **Memory** | Abbinamento coppie carte | coppie generate da termine/definizione o domanda/immagine |
| **Drag & Drop** | Trascinamento elementi in aree corrette | stesso motore del quiz `drag_drop` |
| **Puzzle** | Ricomposizione immagine/testo a pezzi | difficoltà = numero pezzi |
| **Quiz a tempo** | Quiz standard con timer stringente e punteggio bonus velocità | riusa motore quiz (cap. 4) |
| **Escape Room** | Sequenza di enigmi/quiz collegati da narrazione, sblocco progressivo | composizione di più mini-attività esistenti + storyboard admin |
| **Trova l'errore** | Testo/immagine con errori da individuare, click sulle aree errate | coordinate cliccabili definite in editor admin |
| **Abbinamento immagini** | Associazione immagine ↔ concetto/testo | variante di `drag_drop`/memory |

Ogni mini gioco condivide con i quiz: punteggio, livello di difficoltà, tempo stimato, spiegazioni a fine partita, e viene trattato come un **content type** aggiuntivo nel CMS.

## 5.2 Sistema a punti — Badge, Livelli, XP

- **XP (esperienza)**: assegnati per ogni azione significativa (completare lezione, superare quiz, giocare mini gioco, streak giornaliera di accesso). Regole configurabili da admin in una tabella `xp_rules` (azione → punti).
- **Livelli utente**: soglie di XP cumulativo che sbloccano un livello (es. Novizio → Apprendista → Esperto → Maestro), con eventuale sblocco di funzionalità/contenuti bonus.
- **Badge**: riconoscimenti per traguardi specifici (es. "Primo corso completato", "7 giorni di fila", "100% su un quiz difficile", "Top 3 in classifica mensile"). Ogni badge ha icona, descrizione, criterio di assegnazione (regola o trigger evento).
- **Classifiche (leaderboard)**: globali, per corso, per team/reparto, con finestre temporali (settimanale/mensile/all-time). Calcolate su vista aggregata aggiornata in tempo (quasi) reale via Redis Sorted Set.

## 5.3 Schermate necessarie

- **Profilo gamification**: livello attuale, barra XP, badge ottenuti/da ottenere, storico attività.
- **Classifica**: tabella con filtro periodo/ambito, evidenziazione posizione utente corrente.
- **Centro mini giochi**: catalogo giochi filtrabile per categoria/corso/difficoltà.
- **Schermata di gioco** dedicata per tipologia (componente React specifico per ciascun gioco).
- **Admin — Regole gamification**: configurazione punti XP per azione, creazione/editing badge e relative regole.

## 5.4 Database (entità principali)

`mini_games`, `game_sessions`, `xp_events`, `xp_rules`, `user_levels`, `badges`, `user_badges`, `leaderboard_snapshots`.

## 5.5 Flusso utente

```
Utente completa azione (lezione/quiz/gioco)
  → evento emesso (event bus interno) → XP engine calcola punti → aggiorna user_levels
  → Badge engine valuta regole → se soddisfatte, assegna badge + notifica (toast/celebrazione)
  → Leaderboard aggiornata (Redis ZINCRBY) → visibile in tempo pseudo-reale
```

## 5.6 Logica di funzionamento

- Architettura **event-driven**: ogni azione tracciabile pubblica un evento (`lesson.completed`, `quiz.passed`, `game.finished`, `login.streak`) su un bus interno (BullMQ/Redis Streams).
- Un **XP engine** e un **Badge engine** sono consumer indipendenti degli stessi eventi: disaccoppiati dal flusso applicativo principale, non rallentano le richieste utente, e sono facilmente estendibili con nuove regole senza toccare il codice core (regole data-driven in tabella).
- Le classifiche usano Redis Sorted Set per letture O(log N) rapide anche con molti utenti.

## 5.7 API necessarie

| Metodo | Endpoint | Descrizione |
|---|---|---|
| GET | `/games` | catalogo mini giochi |
| GET | `/games/:id` | dettaglio/config gioco |
| POST | `/games/:id/sessions` | avvio sessione di gioco |
| POST | `/game-sessions/:id/complete` | invio risultato |
| GET | `/me/gamification` | XP, livello, badge personali |
| GET | `/leaderboard?scope=course:123&period=monthly` | classifica |
| POST/PUT | `/admin/badges`, `/admin/xp-rules` | configurazione regole |

## 5.8 Criticità

- Bilanciamento economico dei punti (evitare grinding fine a sé stesso) → revisione periodica delle regole basata su analytics.
- Le classifiche pubbliche possono demotivare utenti indietro → offrire anche classifiche "vs. te stesso" o per piccoli gruppi/team.
- Anti-cheat sui mini giochi lato client (es. invio risultati falsificati) → validazione server-side dei limiti plausibili (tempo minimo, punteggio massimo).
- Accessibilità dei giochi drag&drop/puzzle per utenti con disabilità motorie → prevedere alternative da tastiera.
