# Pubblicare Formazione ADL online (Render)

Questa guida presume che tu abbia già configurato Firebase come descritto in precedenza
(progetto reale, Authentication con Email/Password attivo, chiave web e credenziali del
service account). Non serve Docker installato sul tuo computer: Render costruisce le
immagini lui stesso a partire dai `Dockerfile` nel repository.

## 1. Crea il Blueprint su Render

1. Vai su [render.com](https://render.com), crea un account (puoi accedere con GitHub) se non ce l'hai già.
2. Dashboard → **New** → **Blueprint**.
3. Collega il repository GitHub `denistramontano-wq/piattaforma-formazione` e scegli il branch da pubblicare.
4. Render legge `render.yaml` dalla root del repo e ti mostra un'anteprima con 3 risorse:
   - `formazione-adl-db` (database Postgres)
   - `formazione-adl-api` (backend)
   - `formazione-adl-web` (sito)
5. Conferma con **Apply**. Il primo deploy parte subito ma **fallirà** per l'API — è normale,
   mancano ancora le variabili Firebase (punto 2).

## 2. Imposta le variabili d'ambiente

**Servizio `formazione-adl-api`** → scheda **Environment** → aggiungi:

| Chiave | Valore |
|---|---|
| `FIREBASE_PROJECT_ID` | `formazione-adl` |
| `FIREBASE_CLIENT_EMAIL` | quella del tuo file service account (es. `firebase-adminsdk-...@formazione-adl.iam.gserviceaccount.com`) |
| `FIREBASE_PRIVATE_KEY` | la chiave privata del service account, incluse le `\n` |
| `ADMIN_EMAILS` | la tua email (o più email separate da virgola) |
| `ANTHROPIC_API_KEY` | opzionale — senza, l'IA usa un motore locale gratuito |

**Servizio `formazione-adl-web`** → scheda **Environment** → aggiungi:

| Chiave | Valore |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | dalla configurazione web di Firebase |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `formazione-adl.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `formazione-adl` |

Dopo aver salvato, avvia manualmente un **Manual Deploy → Deploy latest commit** su entrambi
i servizi (le variabili `NEXT_PUBLIC_*` vengono incorporate nel sito solo durante la build, un
semplice riavvio non basta).

## 3. Controlla gli URL assegnati

`render.yaml` presume che Render assegni `https://formazione-adl-api.onrender.com` e
`https://formazione-adl-web.onrender.com` (in base ai nomi dei servizi). Se quei nomi erano
già occupati, Render ne avrà scelti altri — controlla gli URL reali in cima a ciascuna pagina
servizio. Se sono diversi da quelli previsti, aggiorna a mano in **Environment**:

- su `formazione-adl-api`: `CORS_ORIGIN` e `API_PUBLIC_URL` con l'URL reale del sito/api
- su `formazione-adl-web`: `NEXT_PUBLIC_API_URL` con `<url reale dell'api>/api/v1`

e rifai il deploy di entrambi.

## 4. Autorizza il dominio su Firebase

Passaggio facile da dimenticare ma **obbligatorio**: Firebase Authentication accetta login
solo dai domini nella sua lista autorizzata.

Console Firebase → **Authentication** → **Settings** → **Authorized domains** → **Add domain**
→ inserisci il dominio reale di `formazione-adl-web` (es. `formazione-adl-web.onrender.com`).
Senza questo passaggio il login sul sito pubblicato darà errore.

## 5. Verifica finale

Apri l'URL di `formazione-adl-web`: dovresti vedere la pagina di login. Registrati con
l'email che hai messo in `ADMIN_EMAILS` per entrare come amministratore.

## Note

- **I dati demo non vengono caricati automaticamente in produzione** (lo script di seed è
  pensato solo per lo sviluppo locale) — il sito parte vuoto, pronto per i contenuti reali.
- **Redis non serve**: non è usato da nessuna parte del codice, il file `render.yaml`
  non lo include.
- **Deploy automatico**: da qui in avanti, ogni `git push` sul branch collegato aggiorna
  automaticamente sia il sito che l'API.
- **Costi**: il disco persistente per i file caricati richiede un piano Render a pagamento per
  `formazione-adl-api` (il piano gratuito non supporta dischi persistenti). Controlla i piani
  disponibili nella dashboard Render prima di confermare il Blueprint.
