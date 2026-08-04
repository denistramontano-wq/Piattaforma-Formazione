'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

// In sviluppo locale ci si collega all'emulatore Firebase Auth invece che al progetto
// reale: nessuna credenziale reale necessaria, dati isolati dalla produzione.
// L'emulatore rifiuta una seconda chiamata a connectAuthEmulator dopo hot-reload,
// quindi lo stato viene tracciato su globalThis.
declare global {
  // eslint-disable-next-line no-var
  var __authEmulatorConnected: boolean | undefined;
}

/**
 * L'SDK client di Firebase va inizializzato solo nel browser: Next.js valuta comunque questo
 * modulo lato server durante il prerendering dei Client Component (sia in dev sia nella build di
 * produzione) — se NEXT_PUBLIC_FIREBASE_API_KEY non è disponibile in quella fase (build Docker
 * senza le variabili passate correttamente), initializeApp/getAuth lanciano un errore che manda
 * in crash l'intera build. Nessun codice dell'app usa realmente `auth` lato server (AuthProvider
 * lo legge solo dentro useEffect, lib/api.ts lo importa solo nel ramo client), quindi è sicuro
 * inizializzarlo solo quando `window` esiste davvero.
 */
function createAuth(): Auth {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const authInstance = getAuth(app);

  if (process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === 'true' && !globalThis.__authEmulatorConnected) {
    connectAuthEmulator(authInstance, process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_URL ?? 'http://localhost:9099', {
      disableWarnings: true,
    });
    globalThis.__authEmulatorConnected = true;
  }

  return authInstance;
}

export const auth: Auth = typeof window !== 'undefined' ? createAuth() : (null as unknown as Auth);
