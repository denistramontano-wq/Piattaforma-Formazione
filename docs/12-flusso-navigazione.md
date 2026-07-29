# 12. Flusso di navigazione degli utenti

## 12.1 Journey — Utente nuovo (onboarding e primo corso)

```mermaid
flowchart LR
    A[Registrazione/SSO] --> B[Onboarding\nselezione interessi/ruolo]
    B --> C[Home personalizzata\ncorsi consigliati]
    C --> D[Catalogo corsi]
    D --> E[Scheda corso]
    E --> F[Iscrizione]
    F --> G[Prima lezione]
    G --> H{Contenuto\ncompletato?}
    H -- si --> I[Quiz di lezione]
    I --> J{Superato?}
    J -- si --> K[XP + eventuale badge]
    J -- no --> L[Ripasso materiale suggerito]
    K --> M{Altre lezioni\nnel modulo?}
    M -- si --> G
    M -- no --> N{Altri moduli?}
    N -- si --> G
    N -- no --> O[Corso completato]
    O --> P[Certificato generato]
    P --> Q[Notifica + condivisione]
```

## 12.2 Journey — Utente ricorrente (ricerca e consultazione rapida)

```mermaid
flowchart LR
    A[Login] --> B[Dashboard\n'riprendi da dove eri']
    B --> C{Cosa cerca?}
    C -->|Continua corso| D[Player lezione]
    C -->|Cerca informazione specifica| E[Ricerca globale]
    E --> F[Risultati multi-tipo]
    F --> G[Apre manuale/video/FAQ]
    C -->|Ha un dubbio| H[Assistente IA]
    H --> I[Risposta con fonti citate]
    C -->|Vuole allenarsi| J[Centro mini giochi]
    J --> K[Gioco completato]
    K --> L[XP/Classifica aggiornata]
```

## 12.3 Journey — Amministratore (creazione e pubblicazione contenuto)

```mermaid
flowchart LR
    A[Login admin] --> B[Dashboard admin]
    B --> C[Nuovo corso]
    C --> D[Compila metadati\ncategoria/tag/livello]
    D --> E[Aggiungi moduli e lezioni]
    E --> F[Upload materiali\nPDF/Word/Excel/PPT/video/immagini]
    F --> G[Scan antivirus + elaborazione\nasincrona - transcodifica/estrazione testo]
    G --> H{Vuole generare\ncontenuti con IA?}
    H -- si --> I[Genera quiz/flashcard/riassunto]
    I --> J[Revisione e correzione]
    J --> K[Approvazione]
    H -- no --> K
    K --> L{Pubblica ora\no programma?}
    L -- ora --> M[Pubblicato - visibile utenti]
    L -- programma --> N[In coda pubblicazione]
    N -->|job schedulato| M
    M --> O[Notifica utenti interessati]
```

## 12.4 Journey — Amministratore (monitoraggio e miglioramento continuo)

```mermaid
flowchart LR
    A[Dashboard admin] --> B[Analytics quiz]
    B --> C[Domande più sbagliate]
    C --> D[Apre contenuto correlato]
    D --> E[Aggiorna/chiarisce il materiale]
    A --> F[Utenti inattivi]
    F --> G[Invia promemoria mirato]
    A --> H[Report periodico]
    H --> I[Esporta CSV/PDF\no invio email programmato]
```

## 12.5 Considerazioni di navigazione

- **Deep-linking** garantito ovunque (ogni lezione, documento a pagina X, domanda quiz, badge ha un URL diretto condivisibile).
- **Continuità cross-device**: la posizione di avanzamento (video, lezione, quiz in corso) è salvata server-side, non solo in locale, per riprendere da un altro dispositivo.
- **Breadcrumb** sempre coerente con la sitemap (cap. 11) per permettere di risalire senza perdere il contesto.
- **Percorso guidato vs. esplorazione libera**: i corsi possono essere configurati come sequenziali (blocco lezioni successive) o liberi (navigazione libera tra lezioni), a scelta dell'admin in fase di creazione corso.
