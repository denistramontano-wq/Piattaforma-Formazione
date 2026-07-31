'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);

// In sviluppo locale ci si collega all'emulatore Firebase Auth invece che al progetto
// reale: nessuna credenziale reale necessaria, dati isolati dalla produzione.
// L'emulatore rifiuta una seconda chiamata a connectAuthEmulator dopo hot-reload,
// quindi lo stato viene tracciato su globalThis.
declare global {
  // eslint-disable-next-line no-var
  var __authEmulatorConnected: boolean | undefined;
}

if (process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === 'true' && !globalThis.__authEmulatorConnected) {
  connectAuthEmulator(auth, process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_URL ?? 'http://localhost:9099', {
    disableWarnings: true,
  });
  globalThis.__authEmulatorConnected = true;
}
