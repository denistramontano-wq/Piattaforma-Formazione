'use client';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center dark:bg-slate-950">
      <p className="text-4xl">⚠️</p>
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Si è verificato un errore</h1>
      <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
        Qualcosa non ha funzionato come previsto. Riprova; se il problema persiste, contatta l&apos;amministratore.
      </p>
      <button type="button" onClick={() => reset()} className="btn-primary">
        Riprova
      </button>
    </div>
  );
}
