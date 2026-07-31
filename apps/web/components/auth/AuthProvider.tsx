'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { api } from '@/lib/api';

interface AuthContextValue {
  user: User | null;
  /** Ruolo applicativo (STUDENT/ADMIN) letto da GET /me — null finché non è ancora stato caricato. */
  role: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Sincronizza il token nel cookie __session, letto dal server (Server Component/middleware) — vedi app/api/session/route.ts. */
async function syncSessionCookie(user: User | null) {
  if (!user) {
    await fetch('/api/session', { method: 'DELETE' });
    return;
  }
  const idToken = await user.getIdToken();
  await fetch('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Incoda le scritture del cookie in ordine, altrimenti due chiamate concorrenti (es. la DELETE
  // dello stato iniziale "nessun utente" allo sfontaggio e la POST di un login rapido subito
  // successivo) potrebbero completarsi fuori ordine sulla rete e la più vecchia cancellerebbe il
  // cookie appena impostato. Chi effettua login/logout aspetta questa stessa coda prima di
  // considerare l'operazione conclusa, così il cookie è garantito aggiornato quando ritorna.
  const syncQueueRef = useRef(Promise.resolve());

  function enqueueSync(nextUser: User | null): Promise<void> {
    const next = syncQueueRef.current.then(() => syncSessionCookie(nextUser));
    syncQueueRef.current = next.catch(() => {});
    return next;
  }

  useEffect(() => {
    // onIdTokenChanged (non solo onAuthStateChanged) così il cookie resta aggiornato
    // anche quando l'SDK Firebase rinnova automaticamente il token (ogni ~55 minuti).
    const unsubscribe = onIdTokenChanged(auth, (nextUser) => {
      enqueueSync(nextUser);
      setUser(nextUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setRole(null);
      return;
    }
    let cancelled = false;
    api
      .get<{ role: string }>('/me')
      .then((data) => {
        if (!cancelled) setRole(data.role);
      })
      .catch(() => {
        if (!cancelled) setRole(null);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
    await enqueueSync(auth.currentUser);
  }

  async function signUp(email: string, password: string, fullName: string) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (fullName.trim()) {
      await updateProfile(credential.user, { displayName: fullName.trim() });
    }
    await enqueueSync(auth.currentUser);
  }

  async function logOut() {
    await signOut(auth);
    await enqueueSync(null);
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, signUp, logOut }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth va usato dentro <AuthProvider>');
  return ctx;
}
