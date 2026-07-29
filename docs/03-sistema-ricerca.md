# 3. Sistema di ricerca

## 3.1 Descrizione

Motore di ricerca unificato (federated search) che interroga contemporaneamente **corsi, manuali (incluso il testo estratto dai PDF), video, quiz, mini giochi e FAQ**, restituendo risultati raggruppati per tipo con ranking di rilevanza.

## 3.2 Schermate necessarie

- **Barra di ricerca globale** in header, sempre visibile, con autocomplete/suggerimenti live (debounce 250ms).
- **Pagina risultati**: tab per tipo di contenuto (Tutti / Corsi / Manuali / Video / Quiz / Giochi / FAQ), filtri (categoria, livello, data), evidenziazione (highlight) dei termini trovati, snippet di contesto per i PDF.
- **Ricerca vuota / nessun risultato**: suggerimenti di correzione ("forse cercavi...") e link a FAQ correlate generate dall'IA.

## 3.3 Database / infrastruttura

Non è la sola PostgreSQL ad occuparsi della ricerca: si affianca un **motore di ricerca dedicato** (OpenSearch/Elasticsearch, oppure Meilisearch per soluzioni più leggere) che mantiene un **indice denormalizzato** aggiornato via event-driven sync (CDC o outbox pattern) da:

- `courses`, `lessons` (titolo, descrizione, tag)
- `documents` + testo estratto da PDF/Word (`document_extracted_text`)
- `videos` (titolo, descrizione, trascrizione se disponibile)
- `quizzes` (titolo, descrizione)
- `mini_games` (titolo, descrizione)
- `faqs` (domanda, risposta)

## 3.4 Flusso utente

```
Utente digita query nella barra globale
  → richiesta debounced a /search/suggest (autocomplete)
  → invio ricerca → /search?q=...
  → risultati raggruppati per tipo, ordinati per rilevanza (con boost su titolo > tag > corpo)
  → click risultato → deep link al contenuto specifico (es. pagina PDF con paragrafo evidenziato)
```

## 3.5 Logica di funzionamento — ricerca full-text nei PDF

1. All'upload di un PDF, un worker asincrono esegue **estrazione testo** (pdf-parse / Apache Tika). Se il PDF è scansionato (immagine), si applica **OCR** (Tesseract) come fallback.
2. Il testo estratto viene salvato in `document_extracted_text` (per audit) e inviato all'indice di ricerca, suddiviso in chunk con riferimento a pagina/posizione.
3. In fase di query, il motore restituisce anche il **numero di pagina** e uno snippet, permettendo il deep-link diretto (`/documents/:id?page=12&highlight=...`).
4. Gli stessi chunk testuali sono riutilizzati dal modulo IA per il RAG (capitolo 6), evitando doppia estrazione.

## 3.6 API necessarie

| Metodo | Endpoint | Descrizione |
|---|---|---|
| GET | `/search?q=&type=&category=&page=` | ricerca federata |
| GET | `/search/suggest?q=` | autocomplete |
| POST | `/admin/search/reindex` | reindicizzazione manuale (bulk) |

## 3.7 Criticità

- **Sincronizzazione indice**: rischio di disallineamento tra DB relazionale e indice di ricerca → mitigato con outbox pattern + job di riconciliazione periodica.
- **OCR** su documenti scansionati è lento e CPU-intensive → coda dedicata con priorità bassa, notifica admin a completamento.
- **Permessi**: la ricerca deve rispettare la visibilità/permessi del contenuto (contenuti riservati non devono comparire a utenti non autorizzati) → filtro post-query o document-level security nativo del motore.
- **Rilevanza multilingua**: se la piattaforma è multilingua, servono analyzer/stemmer dedicati per lingua.
