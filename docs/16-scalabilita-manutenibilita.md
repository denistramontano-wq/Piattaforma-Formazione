# 16. Scalabilità e manutenibilità

## 16.1 Architettura del codice

- **Monolite modulare a domini** (NestJS module per Contenuti, Quiz, Gamification, Utenti, IA, Ricerca, Notifiche) con confini espliciti: ogni modulo espone solo interfacce definite, senza accesso diretto alle tabelle di altri domini. Questo rende **naturale l'estrazione futura in microservizi** (es. il modulo IA, il più costoso in risorse/costi, è il primo candidato a diventare servizio indipendente scalabile separatamente).
- **Contratti API versionati** (`/v1/...`) fin dal primo rilascio, per poter evolvere senza rompere client esistenti.
- **Feature flag** per rilasciare funzionalità gradualmente (canary release) e per disattivare moduli non necessari a specifici clienti/tenant (es. disattivare gamification per un tenant più "corporate formale").
- **Test automatici**: unit test sui moduli core (scoring quiz, XP engine, permessi), test di integrazione sulle API, E2E sui flussi critici (iscrizione corso, completamento, generazione certificato). CI blocca merge se la coverage sui moduli critici scende sotto soglia.

## 16.2 Scalabilità orizzontale

- Servizi **stateless** (sessione in Redis, non in memoria locale) → possibilità di scalare orizzontalmente aggiungendo istanze dietro load balancer senza sticky session.
- **Worker asincroni separati** dai processi web per i task pesanti (transcodifica video, OCR, embedding IA, generazione PDF certificati): scalano indipendentemente in base al carico della coda, senza impattare la reattività dell'app principale.
- **Read replica** PostgreSQL per le query analitiche/dashboard, separate dal traffico transazionale.
- **Materialized view / tabelle di riepilogo** ricalcolate da job schedulati per le statistiche pesanti (evitare aggregazioni real-time su milioni di righe a ogni richiesta dashboard).
- **CDN** per tutto il contenuto statico e i video, riducendo il carico sui server applicativi e migliorando la latenza percepita globalmente.
- **Cache applicativa** (Redis) su cataloghi, contenuti pubblicati, risultati di ricerca frequenti, con invalidazione mirata alla pubblicazione/modifica.

## 16.3 Scalabilità del dato e del dominio

- Predisporre fin da subito la colonna `organization_id` (multi-tenant) sulle tabelle principali, anche se il primo rilascio serve un solo tenant: evita una migrazione dati complessa quando si vorrà vendere la piattaforma a più clienti.
- Tassonomie (categorie, tag) gerarchiche e non hardcoded: amministrabili da UI, non da configurazione codice.
- Il **payload JSONB** delle domande quiz e dei blocchi contenuto permette di introdurre nuovi tipi di domanda/blocco senza migrazioni distruttive dello schema, solo aggiungendo un nuovo `type` gestito dal frontend.
- Disaccoppiare i "motori di regole" (XP, badge, permessi) in tabelle configurabili da admin invece che in logica hardcoded, per estendere il sistema senza deploy di codice.

## 16.4 Osservabilità e qualità continua

- Monitoring (Prometheus/Grafana) su latenza API, code job, errori — con alerting su soglie (es. coda transcodifica > N minuti, tasso errore 5xx > soglia).
- Error tracking (Sentry) sia frontend che backend, con contesto utente per riprodurre bug rapidamente.
- Log centralizzati e strutturati (JSON) per audit e troubleshooting, con retention conforme a policy privacy.
- Dependency scanning automatico e aggiornamenti di sicurezza pianificati (non accumulare debito tecnico su librerie).
- Documentazione tecnica viva: API documentata via OpenAPI generato dal codice (non manuale, per evitare disallineamento), ADR (Architecture Decision Record) per le scelte architetturali significative.

## 16.5 Costi e capacity planning

- Il modulo IA è la voce di costo più variabile: prevedere **quota/budget configurabili** (per utente o tenant), cache delle risposte a domande ricorrenti, modello più economico per task semplici (es. generazione flashcard) e modello più capace solo dove serve (assistente conversazionale).
- Storage video è la seconda voce di costo maggiore: politiche di lifecycle (es. spostare contenuti poco acceduti su storage a costo inferiore/"cold storage"), transcodifica solo nei bitrate effettivamente necessari.
- Load testing periodico (k6/Locust) su scenari realistici (picco iscrizioni, quiz simultanei) per dimensionare correttamente l'infrastruttura prima che diventi un problema in produzione.

## 16.6 Manutenibilità organizzativa

- Onboarding rapido di nuovi sviluppatori grazie a moduli ben isolati e documentati (ogni modulo ha un proprio README con responsabilità e contratti).
- Convenzioni di codice e linting automatico (ESLint/Prettier) enforced in CI, per uniformità indipendentemente dal numero di persone nel team nel tempo.
- Roadmap trimestrale rivista sulla base di analytics reali (utilizzo effettivo delle feature, domande IA non risolte, drop-off nei corsi) invece che solo su ipotesi — chiudendo il ciclo prodotto-dato-decisione descritto nei capitoli 7 e 13.
