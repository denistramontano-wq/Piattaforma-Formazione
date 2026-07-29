# 6. Intelligenza Artificiale

## 6.1 Descrizione generale

Il modulo IA ha due macro-funzioni:

1. **Content Intelligence** — automazione della produzione didattica a partire dai materiali caricati (PDF, Word, video con trascrizione).
2. **Assistente virtuale documentale (RAG)** — chatbot che risponde alle domande degli utenti **esclusivamente sulla base dei contenuti caricati sulla piattaforma**, evitando allucinazioni e contenuti fuori perimetro.

Entrambe si appoggiano alla stessa pipeline di ingestion documentale già descritta nel capitolo 3 (estrazione testo/OCR).

## 6.2 Funzionalità di Content Intelligence

| Funzione | Input | Output |
|---|---|---|
| Lettura automatica PDF | documento caricato | testo strutturato, sezioni riconosciute |
| Estrazione argomenti principali | testo estratto | elenco topic con relazioni gerarchiche |
| Generazione riassunti | documento/lezione | riassunto breve/esteso configurabile |
| Mappe concettuali | testo/topic estratti | grafo nodi/relazioni (esportabile, editabile) |
| Generazione flashcard | testo/topic | set di flashcard fronte/retro |
| Generazione quiz automatica | testo/topic | domande multiple choice / V-F / fill-blank pronte per revisione |
| Proposta domande a risposta multipla | argomento specifico | N varianti con distrattori plausibili |
| Creazione casi pratici | argomento/competenza | scenario narrativo con task da risolvere |
| Creazione simulazioni | processo/procedura | flusso step-by-step interattivo (branching semplice) |

**Principio cardine: l'IA propone, l'admin approva.** Ogni output generato dall'IA viene salvato con stato `ai_generated_pending_review` e non è mai pubblicato automaticamente: un formatore/admin deve rivedere, correggere ed approvare prima che diventi visibile agli utenti.

## 6.3 Assistente virtuale (RAG documentale)

- Architettura **RAG (Retrieval-Augmented Generation)**: le domande dell'utente vengono trasformate in embedding, si recuperano i chunk di documenti più pertinenti dall'indice vettoriale (`pgvector` su PostgreSQL, o motore vettoriale dedicato), e questi chunk vengono passati come **contesto obbligato** al modello linguistico (Claude), con istruzione di sistema di **rispondere solo sulla base del contesto fornito** e dichiarare esplicitamente quando l'informazione non è presente nei materiali.
- Ogni risposta riporta le **fonti** (documento/lezione/paragrafo) da cui è stata derivata, con link diretto al contenuto originale.
- Ambito di ricerca configurabile: globale, per corso corrente, o per singolo documento.
- Cronologia conversazioni salvata per l'utente (continuità multi-turno) e per analytics admin (domande frequenti non coperte dai materiali → segnale per creare nuovi contenuti/FAQ).

## 6.4 Schermate necessarie

- **Assistente virtuale** (widget chat persistente, disponibile in tutte le sezioni, con contesto "sto guardando X").
- **Admin — Generatore IA**: selezione documento/lezione sorgente → scelta funzione (riassunto/quiz/flashcard/mappa/…) → generazione → editor di revisione side-by-side (testo sorgente / output IA) → approvazione o rigenerazione con istruzioni aggiuntive.
- **Mappa concettuale**: visualizzatore grafo interattivo (zoom, drag nodi), esportabile come immagine.
- **Admin — Monitor IA**: log costi/utilizzo token, domande dell'assistente non risolte (gap di contenuto).

## 6.5 Database (entità principali)

`document_chunks` (testo + embedding vettoriale + riferimento pagina), `ai_generations` (tipo, input, output, stato revisione, autore approvazione), `concept_maps`, `chat_conversations`, `chat_messages` (con riferimento alle fonti citate), `ai_usage_logs` (token, costo, latenza).

## 6.6 Flusso utente — assistente virtuale

```
Utente apre chat assistente → digita domanda
  → backend genera embedding query → ricerca vettoriale top-K chunk pertinenti (con filtro permessi/ambito)
  → prompt a Claude con contesto = chunk recuperati + istruzioni "rispondi solo da questo contesto"
  → risposta in streaming + elenco fonti cliccabili
  → se nessun chunk rilevante trovato: risposta "informazione non presente nei materiali disponibili"
     + eventuale suggerimento di contattare un formatore o apertura ticket
```

## 6.7 Flusso amministratore — generazione automatica

```
Admin seleziona documento → "Genera con IA" → sceglie funzione (es. Quiz)
  → job asincrono (coda dedicata, per non bloccare l'UI) → risultato in bozza
  → admin rivede/modifica/scarta → "Approva e pubblica" → contenuto diventa parte del corso
```

## 6.8 API necessarie

| Metodo | Endpoint | Descrizione |
|---|---|---|
| POST | `/ai/chat` | invio messaggio assistente (streaming SSE) |
| GET | `/ai/chat/:conversationId` | storico conversazione |
| POST | `/admin/ai/generate` | richiesta generazione (tipo, sourceId, opzioni) |
| GET | `/admin/ai/generations/:id` | stato/risultato generazione |
| POST | `/admin/ai/generations/:id/approve` | approvazione e pubblicazione |
| GET | `/admin/ai/usage` | metriche di utilizzo/costo |

## 6.9 Criticità

- **Allucinazioni**: mitigate da RAG stretto (context-only) + citazione fonti obbligatoria + test di regressione periodici su un set di domande di controllo.
- **Costi variabili** (token IA) → serve budget/quota per utente o per tenant, caching delle risposte a domande ricorrenti, monitoraggio continuo.
- **Latenza** nella generazione di contenuti lunghi (mappe, simulazioni) → elaborazione sempre asincrona con notifica di completamento, mai sincrona bloccante.
- **Qualità del testo estratto** da PDF scansionati/mal formattati impatta direttamente la qualità di riassunti/quiz generati → validazione automatica di leggibilità prima di proporre la generazione.
- **Privacy/dati sensibili**: se i documenti contengono dati riservati, va valutato l'uso di provider IA con garanzie contrattuali adeguate (no training sui dati) e, se richiesto, opzioni di deployment privato/regionale.
- **Aggiornamento indice**: quando un documento viene aggiornato (nuova versione), i chunk/embedding obsoleti vanno invalidati e rigenerati.
