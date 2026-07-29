import { api } from '@/lib/api';
import type { Certificate } from '@/lib/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { EmptyState } from '@/components/ui/EmptyState';

export default async function CertificatesPage() {
  const certificates = await api.get<Certificate[]>('/me/certificates');

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Certificati' }]} />
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">I miei certificati</h1>

      {certificates.length === 0 ? (
        <EmptyState icon="🏅" title="Nessun certificato ancora" description="Completa un corso per ottenere il tuo primo certificato." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert) => (
            <div key={cert.id} className="card flex flex-col gap-2 p-4">
              <span className="text-2xl" aria-hidden>
                🏅
              </span>
              <p className="font-medium text-slate-800 dark:text-slate-100">{cert.course.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Rilasciato il {new Date(cert.issuedAt).toLocaleDateString('it-IT')}
              </p>
              <p className="text-xs text-slate-400">Codice verifica: {cert.verifyCode}</p>
              {cert.pdfUrl && (
                <a href={cert.pdfUrl} className="btn-secondary mt-2 w-fit">
                  Scarica PDF
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
