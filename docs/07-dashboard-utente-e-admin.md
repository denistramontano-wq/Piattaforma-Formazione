# 7. Dashboard Utente e Dashboard Amministratore

## 7.1 Dashboard Utente

### Descrizione
Vista personale di sintesi su formazione, performance e riconoscimenti.

### Contenuti
- Corsi completati / corsi in corso (con % avanzamento)
- Percentuale di avanzamento complessiva (obiettivo formativo annuale, se impostato)
- Punteggi medi ai quiz
- Tempo di studio (giornaliero/settimanale/totale, grafico a linee)
- Badge ottenuti e livello/XP corrente
- Certificati conseguiti
- Risultati dei quiz (ultimi tentativi, andamento nel tempo)
- Storico attività (timeline eventi: lezione completata, quiz superato, badge ottenuto…)

### Schermate
- Dashboard principale (widget/card riorganizzabili)
- Dettaglio "I miei corsi" (in corso / completati / da iniziare)
- Dettaglio "Le mie statistiche" (grafici estesi, filtro periodo)

### Database
`enrollments`, `lesson_progress`, `quiz_attempts`, `study_sessions`, `user_badges`, `user_levels`, `certificates`, `activity_log`.

### Flusso utente
```
Login → Dashboard → card "riprendi corso" → lezione
                  → card "prossimo obiettivo" → quiz/gioco suggerito
                  → sezione "Progressi" → drill-down per corso
```

### API
`GET /me/dashboard` (aggregato), `GET /me/activity-log`, `GET /me/study-time?period=`.

### Criticità
Aggregazioni multiple in un'unica chiamata (evitare N+1 query) → endpoint dedicato con query ottimizzate/materialized view, cache breve (1-5 min) per utente.

---

## 7.2 Dashboard Amministratore

### Descrizione
Cruscotto direzionale per monitorare l'adozione della piattaforma, l'efficacia della formazione e individuare criticità (contenuti poco chiari, utenti a rischio abbandono).

### Contenuti
- Numero utenti totali/attivi (DAU/MAU), nuove iscrizioni nel periodo
- Corsi più seguiti / più completati / con abbandono più alto (funnel)
- Statistiche generali: iscrizioni, completamenti, tempo medio per corso
- Tempo medio di studio (per utente, per corso, per team/reparto)
- Risultati dei test aggregati (media punteggi, tasso di superamento)
- **Domande più sbagliate** (ranking per tasso di errore, con drill-down alla domanda e al contenuto correlato — segnale diretto per migliorare il materiale)
- Utenti inattivi (nessun accesso da N giorni), con possibilità di invio promemoria mirato
- Report esportabili (CSV/Excel/PDF) per singolo corso, team, periodo

### Schermate
- Dashboard overview (KPI card + grafici)
- Vista "Corsi" (tabella con metriche per corso, ordinabile)
- Vista "Utenti" (elenco, filtri stato/attività, dettaglio singolo utente con storico completo)
- Vista "Quiz Analytics" (domande più sbagliate, tempo medio per domanda)
- Vista "Report" (builder report + esportazione + programmazione invio periodico via email)

### Database
Tabelle transazionali (`enrollments`, `lesson_progress`, `quiz_attempts`, `study_sessions`) + **tabelle di riepilogo/materialized view** (`daily_usage_stats`, `course_funnel_stats`, `question_stats`) ricalcolate da job schedulati per non gravare sul DB transazionale.

### Flusso amministratore
```
Login admin → Dashboard admin → KPI overview
  → click su corso → dettaglio funnel + domande più sbagliate
  → click su utenti inattivi → azione: invia reminder / assegna corso
  → Report → seleziona metriche/periodo → genera → esporta o programma invio ricorrente
```

### API
| Metodo | Endpoint | Descrizione |
|---|---|---|
| GET | `/admin/stats/overview` | KPI generali |
| GET | `/admin/stats/courses` | metriche per corso |
| GET | `/admin/stats/questions/most-missed` | domande più sbagliate |
| GET | `/admin/users/inactive?days=30` | utenti inattivi |
| POST | `/admin/reports` | genera report custom |
| GET | `/admin/reports/:id/export?format=csv` | esportazione |

### Criticità
- Query analitiche pesanti sul DB transazionale vanno **isolate** (read replica o data warehouse leggero) per non impattare le performance dell'app.
- Definire chiaramente la cadenza di aggiornamento delle statistiche (near real-time vs. batch notturno) e comunicarla in UI ("aggiornato alle 03:00").
- GDPR: i report che espongono dati individuali (tempo di studio, punteggi) devono rispettare policy di privacy/consenso interne all'organizzazione.
