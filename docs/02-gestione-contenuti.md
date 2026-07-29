# 2. Gestione dei contenuti (CMS interno)

## 2.1 Descrizione

Modulo no-code che permette all'amministratore/formatore di creare e gestire l'intera gerarchia di contenuti senza scrivere codice: **Corso → Modulo → Lezione → Blocchi di contenuto**. Ogni entità di contenuto (corso, manuale, video, quiz, FAQ) condivide un set di metadati comuni.

### Gerarchia dei contenuti

```
Corso
 └─ Modulo (1..n)
     └─ Lezione (1..n)
         └─ Blocco di contenuto (1..n): testo ricco / video / PDF / immagine / quiz / mini gioco / download
```

### Metadati comuni a ogni contenuto

| Campo | Tipo | Note |
|---|---|---|
| Titolo | testo | obbligatorio |
| Descrizione | rich text | |
| Autore | riferimento utente | |
| Data creazione / pubblicazione | data | |
| Categoria | riferimento | tassonomia gerarchica |
| Tag / parole chiave | array | usati per ricerca e AI |
| Livello di difficoltà | enum | Base / Intermedio / Avanzato |
| Tempo stimato di studio | minuti | calcolato o manuale |
| Stato | enum | Bozza / In revisione / Programmato / Pubblicato / Archiviato |

## 2.2 Funzionalità amministrative

- Creazione corsi, moduli, lezioni tramite editor a blocchi (drag & drop, tipo Notion/WordPress Gutenberg).
- Upload multi-formato: **PDF, Word, Excel, PowerPoint, immagini, video** con validazione tipo/dimensione ed **antivirus scan** asincrono prima della pubblicazione.
- Editor rich-text (WYSIWYG) con supporto embed (video, iframe, codice).
- Assegnazione categorie multiple e tag liberi (con autocomplete su tag esistenti).
- **Versionamento manuali**: ogni nuovo upload di uno stesso documento crea una nuova versione, con storico consultabile e possibilità di rollback.
- **Pubblicazione programmata**: data/ora di pubblicazione futura, con job schedulato che rende visibile il contenuto automaticamente.
- Gestione permessi granulare: chi può creare/modificare/pubblicare (RBAC per categoria/corso).
- Duplicazione corso/modulo/lezione come template di partenza.
- Anteprima "come utente" prima della pubblicazione.

## 2.3 Schermate necessarie

1. **Admin → Corsi**: elenco con stato, ricerca, filtri.
2. **Editor corso**: dati generali, copertina, struttura moduli/lezioni (albero riordinabile drag&drop).
3. **Editor lezione**: editor a blocchi + pannello proprietà (metadati) + pannello media library.
4. **Media Library**: repository centralizzato di file caricati, riutilizzabili tra contenuti.
5. **Gestione versioni documento**: diff/storico versioni con changelog testuale.
6. **Calendario pubblicazioni**: vista calendario dei contenuti programmati.
7. **Coda di revisione**: contenuti in stato "in revisione" con workflow approvazione (opzionale, per team grandi).

## 2.4 Database (entità principali)

`courses`, `modules`, `lessons`, `content_blocks`, `categories`, `tags`, `content_tags`, `files`, `documents`, `document_versions`, `media_library`, `publish_schedule`, `content_status_history`.

Schema dettagliato in [10-database-model.md](10-database-model.md).

## 2.5 Flusso amministratore

```
Login admin → Dashboard admin → "Nuovo corso" → Compila metadati
  → Aggiungi moduli → Aggiungi lezioni → Inserisci blocchi contenuto
  → Upload allegati (scan automatico) → Imposta categoria/tag/difficoltà
  → Anteprima → Salva come bozza | Programma pubblicazione | Pubblica subito
```

## 2.6 API necessarie

| Metodo | Endpoint | Descrizione |
|---|---|---|
| POST | `/admin/courses` | crea corso |
| PUT | `/admin/courses/:id` | aggiorna corso |
| POST | `/admin/courses/:id/modules` | aggiunge modulo |
| POST | `/admin/modules/:id/lessons` | aggiunge lezione |
| POST | `/admin/lessons/:id/blocks` | aggiunge blocco contenuto |
| POST | `/admin/files/upload` | upload multipart (presigned URL S3) |
| POST | `/admin/documents/:id/versions` | nuova versione manuale |
| POST | `/admin/content/:id/schedule` | programma pubblicazione |
| PATCH | `/admin/content/:id/status` | cambia stato (bozza/pubblicato/archiviato) |

## 2.7 Logica di funzionamento

- **Upload**: il client richiede un **presigned URL** al backend, carica il file direttamente su object storage (S3/MinIO), poi conferma al backend che registra il record e accoda uno scan antivirus (ClamAV) + eventuale conversione (Office→PDF via LibreOffice headless, estrazione testo per l'indicizzazione).
- **Pubblicazione programmata**: worker (BullMQ/cron) verifica ogni minuto i contenuti con `publish_at <= now()` e stato `scheduled`, li porta a `published` e invia notifiche.
- **Versionamento**: la versione "corrente" è quella marcata `is_current=true`; le versioni precedenti restano accessibili in sola lettura.

## 2.8 Criticità

- Upload di file grandi (video) → richiede upload multipart/resumable.
- Conversione Office→PDF è CPU-intensive → va eseguita su worker separati, non sul processo web.
- Gestione concorrente di editing multi-utente sullo stesso corso (lock ottimistico o CRDT se serve co-editing reale).
- Governance dei tag (evitare proliferazione incontrollata) → suggerimento tag esistenti + merge tag duplicati lato admin.
