'use client';

import Image from 'next/image';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

const ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'Indirizzo email non valido.',
  'auth/user-not-found': 'Nessun account con questa email.',
  'auth/wrong-password': 'Password errata.',
  'auth/invalid-credential': 'Email o password errata.',
  'auth/email-already-in-use': 'Esiste già un account con questa email.',
  'auth/weak-password': 'La password deve avere almeno 6 caratteri.',
  'auth/too-many-requests': 'Troppi tentativi, riprova tra qualche minuto.',
};

function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code;
  return (code && ERROR_MESSAGES[code]) || 'Si è verificato un errore. Riprova.';
}

function LoginForm() {
  const { signIn, signUp } = useAuth();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/';

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password, fullName);
      }
      // signIn/signUp aspettano già la scrittura del cookie di sessione prima di
      // risolversi: a questo punto la navigazione hard può contare sul cookie presente.
      window.location.href = next;
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="card w-full max-w-sm p-8">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Image src="/logo-atm-mark.png" alt="ATM" width={100} height={26} priority />
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Formazione ADL</h1>
        </div>

        <div className="mb-5 flex rounded-lg bg-slate-100 p-1 text-sm dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 rounded-md py-1.5 font-medium transition ${
              mode === 'login' ? 'bg-white shadow-sm dark:bg-slate-700' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Accedi
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 rounded-md py-1.5 font-medium transition ${
              mode === 'register' ? 'bg-white shadow-sm dark:bg-slate-700' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Registrati
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === 'register' && (
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-600 dark:text-slate-300">Nome completo</span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="rounded-lg border border-slate-300 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800"
              />
            </label>
          )}
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600 dark:text-slate-300">Email aziendale</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-lg border border-slate-300 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600 dark:text-slate-300">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="rounded-lg border border-slate-300 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800"
            />
          </label>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary mt-2 w-full justify-center">
            {submitting ? 'Attendere…' : mode === 'login' ? 'Accedi' : 'Crea account'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
