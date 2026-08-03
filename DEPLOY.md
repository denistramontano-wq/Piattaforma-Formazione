# Come mettere online Formazione ADL a costo zero — guida passo passo

Questa versione usa **Supabase** (gratuito, permanente) per il database e per i file caricati
(manuali, certificati), e **Render** (gratuito) solo per far girare il sito e l'API. Risultato:
**0€/mese**, nessun dato che scade o viene cancellato.

Questa guida presume che tu abbia già la cartella del progetto sul Mac con dentro
`apps/api/.env` e `apps/web/.env.local` compilati con i dati Firebase (li abbiamo già
configurati insieme). Non devi installare nulla di nuovo: si fa tutto dai siti di Supabase e Render.

---

## Parte A — Crea il database e lo spazio file su Supabase

### Passo 1 — Crea un account e un progetto

1. Vai su [supabase.com](https://supabase.com) e crea un account gratuito (puoi usare "Continue with GitHub").
2. Clicca **New Project**.
3. Dai un nome, ad esempio `formazione-adl`.
4. Ti chiede una **Database Password**: scegline una e **salvala da qualche parte** (ti servirà subito dopo).
5. Come regione scegli una in Europa (es. "Central EU (Frankfurt)").
6. Clicca **Create new project** e aspetta 1-2 minuti che si prepari.

### Passo 2 — Copia i due indirizzi del database

Supabase offre due modi per collegarsi allo stesso database: uno "diretto" (serve solo a te,
una volta ogni tanto, per preparare le tabelle) e uno tramite "pooler" (quello che userà Render
tutti i giorni per far funzionare il sito). Ti servono entrambi.

1. Nel progetto appena creato, menu a sinistra → icona ingranaggio **Project Settings** → **Database**.
2. Cerca la sezione **Connection string**. Ti farà scegliere tra "Transaction pooler" e "Session
   pooler": **scegli "Session pooler"**.
3. Con tipo **URI** selezionato, copia l'indirizzo mostrato — sarà tipo
   `postgresql://postgres.xxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-xxxxx.pooler.supabase.com:5432/postgres`
4. Sostituisci `[YOUR-PASSWORD]` con la password scelta al Passo 1, e aggiungi `?pgbouncer=true`
   alla fine. Salva questo indirizzo da parte con il nome **"indirizzo pooler"** (ti serve al Passo 7).
5. Ora cerca, nella stessa pagina, l'indirizzo "diretto" (senza scritto "pooler", con
   `db.xxxxxxxxxxxx.supabase.co` invece di `aws-0-xxxxx.pooler.supabase.com`). Copialo e sostituisci
   allo stesso modo `[YOUR-PASSWORD]`. Salvalo da parte con il nome **"indirizzo diretto"** (ti serve
   subito, al Passo 4.5).

### Passo 3 — Copia le chiavi del progetto

1. Sempre in **Project Settings** → **API**.
2. Copia il valore **Project URL** (tipo `https://xxxxxxxxxxxx.supabase.co`).
3. Copia il valore segreto **service_role** (sotto "Project API keys" — clicca l'occhio per rivelarlo). È una chiave potente: non va mai messa nel sito, solo nell'API (vedi Passo 6).

### Passo 4 — Crea lo spazio per i file

1. Menu a sinistra → **Storage**.
2. Clicca **New bucket**.
3. Nome: `uploads` (esattamente così).
4. Attiva l'interruttore **Public bucket** (altrimenti i manuali/certificati non si potrebbero scaricare).
5. Clicca **Create bucket**.

### Passo 4.5 — Prepara le tabelle del database

Render non riesce a preparare da solo le tabelle nel database Supabase (un problema tecnico noto
tra i due servizi), quindi lo facciamo una volta sola dal tuo Mac. Apri il **Terminale**:

```
cd /Users/denis/Desktop/piattaforma-formazione/apps/api
DATABASE_URL="incolla qui l'indirizzo diretto del Passo 2" npx prisma migrate deploy
```

Dovrebbe rispondere con qualcosa tipo *"All migrations have been successfully applied."* — se sì,
sei a posto e puoi continuare. Questo passaggio **va ripetuto** (con lo stesso comando) ogni volta
in futuro in cui la struttura del database cambia — te lo segnalerò quando succede.

---

## Parte B — Pubblica il sito su Render

### Passo 5 — Crea un account Render

Vai su [render.com](https://render.com) e crea un account gratuito (puoi usare "Accedi con GitHub").

### Passo 6 — Collega il progetto

1. Nella dashboard di Render, clicca **New** in alto, poi **Blueprint**.
2. Cerca e seleziona il repository `piattaforma-formazione`, poi clicca **Connect**.
3. Render trova da solo il file `render.yaml` e ti mostra un'anteprima con 2 servizi (l'API e il sito) — **entrambi gratuiti**, non ti chiederà la carta di credito.
4. Clicca **Apply** (o **Deploy Blueprint**).
5. È normale che l'API dia errore al primo tentativo — mancano ancora le chiavi, che aggiungi adesso.

### Passo 7 — Inserisci le chiavi nel motore (API)

1. Apri il servizio **formazione-adl-api** → menu a sinistra **Environment**.
2. Aggiungi queste righe (a sinistra il nome, a destra il valore):

   - `DATABASE_URL` → l'**indirizzo pooler** copiato al Passo 2 (non quello diretto — quello serve solo dal tuo Mac)
   - `SUPABASE_URL` → il valore copiato al Passo 3
   - `SUPABASE_SERVICE_ROLE_KEY` → la chiave segreta copiata al Passo 3
   - `FIREBASE_PROJECT_ID` → `formazione-adl`
   - `FIREBASE_CLIENT_EMAIL` → `firebase-adminsdk-fbsvc@formazione-adl.iam.gserviceaccount.com`
   - `FIREBASE_PRIVATE_KEY` → apri sul Mac il file `apps/api/.env`, copia tutto il valore scritto dopo `FIREBASE_PRIVATE_KEY=` (comprese le virgolette) e incollalo qui
   - `ADMIN_EMAILS` → `denis.tramontano@gmail.com`

3. Clicca **Save Changes**.

### Passo 8 — Inserisci le chiavi Firebase nel sito (Web)

1. Apri il servizio **formazione-adl-web** → **Environment**.
2. Aggiungi:

   - `NEXT_PUBLIC_FIREBASE_API_KEY` → `AIzaSyBAiuwPTZjKpZbU5k7P6WGjK875BwfSXsg`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` → `formazione-adl.firebaseapp.com`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID` → `formazione-adl`

3. Clicca **Save Changes**.

### Passo 9 — Riavvia entrambi i servizi

Per ognuno dei due servizi (`formazione-adl-api` e `formazione-adl-web`):

1. Apri il servizio.
2. In alto a destra, clicca **Manual Deploy** → **Deploy latest commit**.
3. Aspetta che diventi verde con scritto "Live" (qualche minuto).

### Passo 10 — Controlla gli indirizzi assegnati

1. Apri **formazione-adl-api**: copia l'indirizzo in cima alla pagina (tipo `https://formazione-adl-api.onrender.com`).
2. Apri **formazione-adl-web**: copia allo stesso modo il suo indirizzo.
3. **Se sono uguali agli esempi sopra**, salta al Passo 11.
4. **Se sono diversi** (può succedere se quei nomi erano già presi), torna su **Environment** e aggiorna:
   - su `formazione-adl-api`: `CORS_ORIGIN` e `API_PUBLIC_URL` con l'indirizzo vero
   - su `formazione-adl-web`: `NEXT_PUBLIC_API_URL` con l'indirizzo vero dell'API seguito da `/api/v1`
   - poi ripeti il Passo 9 (riavvia entrambi)

### Passo 11 — Un ultimo passaggio importante su Firebase (da non saltare!)

Senza questo passaggio il login sul sito pubblicato **non funzionerà**.

1. Vai sulla Console Firebase del progetto `formazione-adl`.
2. **Authentication** → scheda **Settings** → **Authorized domains** → **Add domain**.
3. Incolla l'indirizzo del tuo sito copiato al Passo 10 (senza `https://` davanti).

### Passo 12 — Prova!

Apri l'indirizzo del tuo sito. Dovresti vedere la pagina di login. Registrati con
`denis.tramontano@gmail.com` per entrare come amministratore.

---

## Da sapere

- **Costo: 0€/mese.** Nessuna carta di credito richiesta in nessuno dei due passaggi.
- **"Si addormentano" se inutilizzati**: sia il sito sia l'API, dopo 15 minuti senza visite, vanno in pausa — la persona successiva che apre il sito aspetta 30-60 secondi in più al primo caricamento. È il prezzo della versione gratuita.
- **Il database Supabase si mette in pausa dopo una settimana di inattività totale** (nessuno usa il sito per 7 giorni) — non perdi nulla, basta riaprirlo un attimo dalla dashboard Supabase per riattivarlo.
- **La piattaforma parte vuota**: i corsi/manuali di esempio che vedi in locale non vengono copiati online.
- **Da qui in poi è automatico**: ogni volta che il codice viene aggiornato su GitHub, Render ripubblica da solo sia il sito che l'API in pochi minuti.
- **Eccezione**: se in futuro la struttura del database cambia (nuove funzionalità che richiedono nuove tabelle/colonne), va ripetuto a mano il comando del Passo 4.5 dal tuo Mac — te lo dirò ogni volta che serve.
