import { App, cert, initializeApp } from 'firebase-admin/app';

let app: App | undefined;

/**
 * Inizializza l'SDK Firebase Admin una sola volta per processo.
 * - In sviluppo/CI con FIREBASE_AUTH_EMULATOR_HOST impostata, l'SDK si collega
 *   automaticamente all'emulatore locale: basta un projectId, nessuna credenziale reale.
 * - In produzione servono le credenziali del service account (variabili FIREBASE_*).
 */
export function getFirebaseAdminApp(): App {
  if (app) return app;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error(
      'FIREBASE_PROJECT_ID non impostata: vedi apps/api/.env.example per la configurazione Firebase Auth.',
    );
  }

  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    app = initializeApp({ projectId });
    return app;
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim().replace(/^"|"$/g, '');
  // Tollerante a virgolette esterne incollate per errore (valide solo dentro un file .env, non
  // nel valore grezzo di una piattaforma come Render) — senza, il parser PEM fallisce con un
  // messaggio poco chiaro ("Failed to parse private key").
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim().replace(/^"|"$/g, '').replace(/\\n/g, '\n');
  if (!clientEmail || !privateKey) {
    throw new Error(
      'Credenziali Firebase mancanti: imposta FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY (o FIREBASE_AUTH_EMULATOR_HOST in sviluppo).',
    );
  }

  app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return app;
}
