import { api } from '@/lib/api';
import type { Faq } from '@/lib/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { EmptyState } from '@/components/ui/EmptyState';

export default async function FaqPage() {
  const faqs = await api.get<Faq[]>('/faq');

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'FAQ' }]} />
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Domande frequenti</h1>

      {faqs.length === 0 ? (
        <EmptyState title="Nessuna FAQ disponibile" />
      ) : (
        <div className="flex flex-col gap-2">
          {faqs.map((faq) => (
            <details key={faq.id} className="card group p-4">
              <summary className="cursor-pointer list-none font-medium text-slate-800 marker:content-none dark:text-slate-100">
                <span className="mr-2 inline-block transition group-open:rotate-90">▶</span>
                {faq.question}
              </summary>
              <p className="mt-2 pl-6 text-sm text-slate-600 dark:text-slate-300">{faq.answer}</p>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
