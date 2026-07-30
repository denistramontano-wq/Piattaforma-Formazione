import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { ChatPanel } from '@/components/assistant/ChatPanel';

export default function AssistantPage() {
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Assistente IA' }]} />
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Assistente virtuale</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Risponde esclusivamente in base ai corsi, manuali, video, quiz e FAQ caricati sulla piattaforma, citando le fonti.
        </p>
      </div>
      <div className="card h-[32rem] overflow-hidden">
        <ChatPanel />
      </div>
    </div>
  );
}
