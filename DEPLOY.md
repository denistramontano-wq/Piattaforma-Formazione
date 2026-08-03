# Come mettere online Formazione ADL — guida passo passo

Questa guida presume che tu abbia già la cartella del progetto sul Mac con dentro
`apps/api/.env` e `apps/web/.env.local` compilati con i dati Firebase (li abbiamo già
configurati insieme). Non devi installare nulla di nuovo: si fa tutto dal sito di Render.

---

## Passo 1 — Crea un account Render

Vai su [render.com](https://render.com) e crea un account gratuito (puoi usare "Accedi con GitHub" per fare prima).

## Passo 2 — Collega il progetto

1. Nella dashboard di Render, clicca il pulsante **New** in alto, poi scegli **Blueprint**.
2. Ti verrà chiesto di collegare un repository GitHub: cerca e seleziona `piattaforma-formazione`.
3. Render trova da solo il file `render.yaml` che ho preparato nel progetto e ti mostra un'anteprima con 3 elementi che sta per creare:
   - un database (dove vengono salvati i dati)
   - il "motore" della piattaforma (l'API)
   - il sito vero e proprio
4. Clicca **Apply** (o **Deploy Blueprint**) per confermare.
5. A questo punto Render comincia a costruire tutto. **È normale che l'API dia errore al primo tentativo** — mancano ancora le chiavi Firebase, che aggiungi al passo successivo.

## Passo 3 — Inserisci le chiavi Firebase nel motore (API)

1. Nella dashboard Render, apri il servizio chiamato **formazione-adl-api**.
2. Nel menu a sinistra clicca **Environment**.
3. Clicca **Add Environment Variable** e aggiungi, una alla volta, queste 4 righe (a sinistra il nome, a destra il valore):

   - `FIREBASE_PROJECT_ID` → `formazione-adl`
   - `FIREBASE_CLIENT_EMAIL` → `firebase-adminsdk-fbsvc@formazione-adl.iam.gserviceaccount.com`
   - `FIREBASE_PRIVATE_KEY` → apri sul Mac il file `apps/api/.env`, copia tutto il valore scritto dopo `FIREBASE_PRIVATE_KEY=` (comprese le virgolette) e incollalo qui
   - `ADMIN_EMAILS` → `denis.tramontano@gmail.com`

4. Clicca **Save Changes**.

## Passo 4 — Inserisci le chiavi Firebase nel sito (Web)

1. Torna alla dashboard e apri il servizio **formazione-adl-web**.
2. Menu a sinistra → **Environment**.
3. Aggiungi queste 3 righe:

   - `NEXT_PUBLIC_FIREBASE_API_KEY` → `AIzaSyBAiuwPTZjKpZbU5k7P6WGjK875BwfSXsg`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` → `formazione-adl.firebaseapp.com`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID` → `formazione-adl`

4. Clicca **Save Changes**.

## Passo 5 — Riavvia entrambi i servizi

Per ognuno dei due servizi (`formazione-adl-api` e `formazione-adl-web`):

1. Apri il servizio.
2. In alto a destra, clicca **Manual Deploy** → **Deploy latest commit**.
3. Aspetta che il pallino diventi verde e scritto "Live" (qualche minuto).

## Passo 6 — Controlla gli indirizzi internet assegnati

1. Apri il servizio **formazione-adl-api**: in cima alla pagina c'è scritto un indirizzo tipo `https://formazione-adl-api.onrender.com`. Copialo.
2. Apri il servizio **formazione-adl-web**: copia allo stesso modo il suo indirizzo, tipo `https://formazione-adl-web.onrender.com`.
3. **Se sono uguali a questi esempi**, non devi fare altro, salta al Passo 7.
4. **Se invece Render ha assegnato indirizzi diversi** (può succedere se quei nomi erano già usati da qualcun altro), torna su **Environment** e aggiorna:
   - su `formazione-adl-api`: le variabili `CORS_ORIGIN` e `API_PUBLIC_URL` con l'indirizzo vero
   - su `formazione-adl-web`: la variabile `NEXT_PUBLIC_API_URL` con l'indirizzo vero dell'API seguito da `/api/v1` (es. `https://xxxxx.onrender.com/api/v1`)
   - poi ripeti il Passo 5 (riavvia entrambi)

## Passo 7 — Un ultimo passaggio importante su Firebase (da non saltare!)

Senza questo passaggio il login sul sito pubblicato **non funzionerà**.

1. Vai sulla Console Firebase del progetto `formazione-adl`.
2. Menu a sinistra → **Authentication** → in alto scheda **Settings** → **Authorized domains**.
3. Clicca **Add domain** e incolla l'indirizzo del tuo sito (quello copiato al Passo 6, senza `https://` davanti — solo tipo `formazione-adl-web.onrender.com`).

## Passo 8 — Prova!

Apri nel browser l'indirizzo del tuo sito (`formazione-adl-web...`). Dovresti vedere la pagina di login. Registrati con `denis.tramontano@gmail.com` per entrare come amministratore.

---

## Da sapere

- **La piattaforma parte vuota**: i corsi/manuali di esempio che vedi in locale non vengono copiati online — è pensata per partire pulita e caricarci i contenuti veri.
- **Da qui in poi è automatico**: ogni volta che io (o tu) modifichiamo il codice e lo pubblichiamo su GitHub, Render aggiorna da solo il sito online in pochi minuti, senza bisogno di rifare questi passaggi.
- **Costi**: il file `render.yaml` chiede a Render un piano a pagamento sia per il database sia per i due servizi (necessario per salvare in modo permanente i file caricati — il piano gratuito li cancellerebbe ad ogni riavvio). Render ti mostra i prezzi esatti al Passo 2, prima di confermare: puoi comunque cambiare piano in qualunque momento dalla dashboard, anche dopo aver creato tutto.
