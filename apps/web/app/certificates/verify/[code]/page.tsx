import { api } from '@/lib/api';
import { Breadcrumb } from '@/components/layout/Breadcrumb';

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
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Verifica certificato' }]} />
      <div className="card p-8 text-center">
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
              Il codice "{code}" non corrisponde a nessun certificato emesso.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
