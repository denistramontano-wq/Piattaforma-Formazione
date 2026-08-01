import Image from 'next/image';
import { api } from '@/lib/api';

interface VerifyResult {
  valid: boolean;
  courseTitle: string;
  userName: string;
  issuedAt: string;
}

export default async function VerifyCertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  let result: VerifyResult | null = null;
  try {
    result = await api.get<VerifyResult>(`/certificates/${code}/verify`);
  } catch {
    result = null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="card w-full max-w-md p-8 text-center">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Image src="/logo-atm-mark.png" alt="ATM" width={100} height={26} priority />
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Formazione ADL</h1>
        </div>

        {result ? (
          <>
            <p className="text-3xl">✅</p>
            <p className="mt-2 text-lg font-semibold text-slate-800 dark:text-slate-100">Certificato valido</p>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              <strong>{result.userName}</strong> ha completato il corso <strong>{result.courseTitle}</strong>
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Rilasciato il {new Date(result.issuedAt).toLocaleDateString('it-IT')}
            </p>
          </>
        ) : (
          <>
            <p className="text-3xl">⚠️</p>
            <p className="mt-2 text-lg font-semibold text-slate-800 dark:text-slate-100">Certificato non valido</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Il codice &ldquo;{code}&rdquo; non corrisponde a nessun certificato emesso.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
