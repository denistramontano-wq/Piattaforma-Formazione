# 8. UX/UI Design

## 8.1 Principi guida

- **Chiarezza prima di tutto**: gerarchia visiva netta, un'azione primaria per schermata.
- **Coerenza**: un unico design system riutilizzato ovunque (componenti, spaziature, colori, iconografia).
- **Progressive disclosure**: non sovraccaricare l'utente; dettagli avanzati dietro un click.
- **Feedback immediato**: ogni azione (salvataggio, invio quiz, upload) ha un riscontro visivo chiaro (toast, skeleton loader, stato progress).
- **Accessibilità (WCAG 2.1 AA)**: contrasto colori conforme, navigazione da tastiera, aria-label, focus visibile, sottotitoli video.
- **Mobile-first / responsive**: la piattaforma deve essere pienamente utilizzabile da smartphone/tablet (formazione "on the go").

## 8.2 Layout applicativo

```
┌──────────────────────────────────────────────────────────┐
│  Topbar: logo | barra di ricerca globale | notifiche |    │
│          switch tema chiaro/scuro | avatar/profilo         │
├───────────┬──────────────────────────────────────────────┤
│           │  Breadcrumb: Home > Categoria > Corso > Lezione │
│  Sidebar  ├──────────────────────────────────────────────┤
│  (nav     │                                                │
│  principale,│           Area contenuto principale          │
│  collassabile)│         (card, grafici, player, editor)    │
│           │                                                │
└───────────┴──────────────────────────────────────────────┘
```

- **Sidebar**: Home, Dashboard, Catalogo corsi, Manuali, Video, Quiz, Mini giochi, Download, FAQ, Progressi, Certificati — collassabile a icone su schermi piccoli, evidenzia la voce attiva.
- **Topbar**: sempre fissa, contiene la ricerca globale (shortcut da tastiera `/` o `Ctrl+K`), centro notifiche (campanella con badge contatore), toggle tema.
- **Breadcrumb**: presente in ogni pagina di secondo livello o più profonda, cliccabile per risalire.

## 8.3 Componenti chiave del design system

| Componente | Utilizzo |
|---|---|
| Card corso/contenuto | catalogo, home, ricerca — copertina, titolo, categoria, badge livello, barra progresso |
| Dashboard widget | KPI numerici, grafici a linee/barre/donut (progressi, statistiche admin) |
| Barra di ricerca globale | header, con dropdown risultati live raggruppati per tipo |
| Notifiche | toast per eventi immediati (badge ottenuto, quiz superato) + centro notifiche persistente (campanella) |
| Modalità chiara/scura | tema gestito via CSS variables/design tokens, preferenza salvata per utente, default = preferenza sistema operativo |
| Player lezione/video | layout a due colonne: contenuto + indice modulo laterale, controlli accessibili |
| Form/editor admin | wizard a step per creazione corso, editor a blocchi drag&drop per lezioni |
| Stato vuoto (empty state) | illustrazione + call-to-action quando non ci sono ancora dati (es. "Nessun corso iniziato, esplora il catalogo") |
| Progress bar / stepper | avanzamento corso, avanzamento quiz |

## 8.4 Palette e identità visiva (indicazioni)

- Palette primaria neutra + colore accento brandizzabile (per personalizzazione white-label da parte del cliente/admin, tramite design token configurabile).
- Colori semantici standard: successo (verde), attenzione (giallo/ambra), errore (rosso), informazione (blu) — usati coerentemente in badge, alert, stato quiz.
- Iconografia coerente (set unico, es. Lucide/Phosphor), stile line-icon leggero.
- Tipografia: font sans-serif ad alta leggibilità, scala tipografica con 5-6 livelli (display, h1-h3, body, caption).

## 8.5 Schermate principali (elenco sintetico)

Home · Login/Registrazione/Recupero password · Dashboard utente · Catalogo corsi · Scheda corso · Player lezione · Manuali (elenco + viewer) · Video (elenco + player) · Quiz (player + risultato) · Mini giochi (centro + singoli giochi) · Area Download · FAQ · Profilo utente · Progressi · Certificati (elenco + verifica pubblica) · Assistente IA (chat) · Dashboard amministratore · CMS (editor corsi/lezioni/quiz) · Gestione utenti · Report e analytics.

## 8.6 Navigazione e ricerca

- Ricerca globale sempre accessibile, risultati raggruppati per tipo con anteprima/snippet.
- Filtri persistenti (categoria, livello, tag) mantenuti in query string per condivisione link diretti.
- Notifiche in-app per: nuovo contenuto pubblicato, promemoria scadenze, badge/livello ottenuti, risposta assistente IA pronta, commento/feedback su un contenuto.

## 8.7 Accessibilità e internazionalizzazione

- Supporto screen reader su tutti i componenti interattivi (quiz drag&drop con alternativa da tastiera).
- Testi esternalizzati per i18n (piattaforma predisposta multilingua fin dall'MVP, anche se si parte con una sola lingua).
- Dimensione testo scalabile (rem-based), nessun contenuto critico veicolato solo tramite colore.

## 8.8 Criticità UX

- Bilanciare la ricchezza di gamification (badge, XP, classifiche) con un tono professionale adatto a contesti aziendali/formali — prevedere possibilità per l'admin di **disattivare** elementi ludici troppo "consumer" per certi tenant/organizzazioni.
- Editor CMS deve essere abbastanza semplice per formatori non tecnici, ma potente: richiede test di usabilità dedicati con utenti reali prima del rilascio.
- Coerenza dark/light su contenuti generati dagli utenti (PDF embedded, immagini) che potrebbero non adattarsi bene al tema scuro.
