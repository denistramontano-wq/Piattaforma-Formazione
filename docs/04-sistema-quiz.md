# 4. Sistema di quiz

## 4.1 Tipologie di domanda supportate

| Tipo | Codice | Descrizione |
|---|---|---|
| Risposta multipla | `multiple_choice` | una o più risposte corrette tra N opzioni |
| Vero/Falso | `true_false` | scelta binaria |
| Risposta aperta | `open_text` | testo libero, valutazione manuale o IA-assistita |
| Completamento frase | `fill_blank` | inserimento parola/e mancante/i in un testo |
| Trascinamento elementi | `drag_drop` | associazione elementi trascinati in aree target |
| Ordinamento corretto | `ordering` | riordino di una sequenza di elementi |
| Selezione immagini | `image_choice` | scelta della/e immagine/i corretta/e tra più opzioni visive |

## 4.2 Struttura dati di una domanda

Ogni domanda, indipendentemente dal tipo, possiede:

- Testo/enunciato (rich text, può includere immagini/audio)
- Tipo domanda (enum sopra)
- Opzioni/elementi (struttura JSON specifica per tipo — vedi §4.4)
- **Risposta corretta** (o insieme di risposte corrette)
- **Spiegazione** (mostrata dopo la risposta, indipendentemente da esito)
- **Punteggio** (peso della domanda nel quiz)
- **Livello di difficoltà** (Base / Intermedio / Avanzato)
- Tag/categoria (per analytics "domande più sbagliate" per argomento)
- Tempo limite opzionale per singola domanda

## 4.3 Struttura di un quiz

- Titolo, descrizione, corso/lezione di appartenenza (o standalone)
- Modalità: **sequenziale** o **ordine casuale**, **banca domande** (estrazione random di N su M)
- Soglia di superamento (%), numero massimo tentativi, tempo totale limite
- Feedback: immediato per domanda vs. solo a fine quiz
- Peso nel completamento del corso (obbligatorio per certificato o facoltativo)

## 4.4 Modello JSON delle opzioni per tipo (esempio semplificato)

```jsonc
// multiple_choice
{ "options": [{"id":"a","text":"..."}, ...], "correct": ["a","c"] }

// fill_blank
{ "text": "Il {{1}} è composto da {{2}} e {{3}}.", "blanks": {"1":"cuore","2":"atri","3":"ventricoli"} }

// drag_drop
{ "items": [{"id":"i1","label":"..."}], "targets": [{"id":"t1","label":"..."}], "correctMap": {"i1":"t1"} }

// ordering
{ "items": [{"id":"1","label":"..."}, ...], "correctOrder": ["3","1","2"] }

// image_choice
{ "options": [{"id":"a","imageUrl":"..."}], "correct": ["b"] }
```

## 4.5 Schermate necessarie

- **Admin — Editor quiz**: builder domande con anteprima live per ogni tipologia, gestione banca domande.
- **Player quiz** (utente): rendering dinamico del componente corretto per tipo di domanda, barra di avanzamento, timer se previsto.
- **Riepilogo risultato**: punteggio, risposte corrette/errate, spiegazioni, opzione "riprova".
- **Storico tentativi** (utente e admin).

## 4.6 Database (entità principali)

`quizzes`, `questions`, `question_options` (o colonna JSONB `payload`), `quiz_attempts`, `quiz_attempt_answers`, `question_stats` (aggregato per analytics).

## 4.7 Flusso utente

```
Lezione/corso → "Svolgi quiz" → domande (una per volta o intera pagina)
  → invio risposte → calcolo punteggio (server-side)
  → esito (superato/non superato) + spiegazioni
  → se superato: XP/badge assegnati, avanzamento corso aggiornato
  → se non superato: possibilità nuovo tentativo (se consentito) o materiale di ripasso suggerito
```

## 4.8 Logica di funzionamento (scoring)

- Lo **scoring avviene sempre lato server** (mai fidarsi del client) per evitare manomissioni.
- Per `open_text`: confronto con parole chiave/pattern configurati dall'admin, con **assistenza IA opzionale** per valutazione semantica (capitolo 6) e revisione manuale per casi ambigui.
- Punteggio finale = somma pesata dei punteggi delle singole domande / punteggio massimo × 100.
- Le risposte di ogni tentativo sono salvate integralmente per audit e per alimentare l'analytics "domande più sbagliate".

## 4.9 API necessarie

| Metodo | Endpoint | Descrizione |
|---|---|---|
| POST | `/admin/quizzes` / `/admin/questions` | creazione quiz/domande |
| GET | `/quizzes/:id` | recupero quiz (senza risposte corrette) |
| POST | `/quizzes/:id/attempts` | avvio tentativo |
| POST | `/attempts/:id/answers` | invio risposta singola domanda (autosave) |
| POST | `/attempts/:id/submit` | chiusura tentativo, calcolo esito |
| GET | `/me/quiz-attempts` | storico personale |
| GET | `/admin/quizzes/:id/analytics` | statistiche domande più sbagliate |

## 4.10 Criticità

- Editor drag&drop/ordinamento richiede componenti frontend accessibili anche da tastiera (a11y).
- Anti-cheating: randomizzazione ordine domande/opzioni, disabilitare copia-incolla se necessario, limite tempo lato server.
- Valutazione IA di risposte aperte introduce costo/latenza → eseguire in modo asincrono con stato "in valutazione".
- Retrocompatibilità dello schema JSON delle opzioni quando si aggiungono nuove tipologie in futuro (versionare il payload).
