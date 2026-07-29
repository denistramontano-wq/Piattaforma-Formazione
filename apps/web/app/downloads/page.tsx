import { api } from '@/lib/api';
import type { DownloadFile } from '@/lib/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { EmptyState } from '@/components/ui/EmptyState';

const TYPE_ICON: Record<string, string> = {
  PDF: '📕',
  WORD: '📘',
  EXCEL: '📗',
  POWERPOINT: '📙',
  IMAGE: '🖼️',
  VIDEO: '🎬',
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DownloadsPage() {
  const files = await api.get<DownloadFile[]>('/downloads');

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Area Download' }]} />
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Area Download</h1>

      {files.length === 0 ? (
        <EmptyState title="Nessun file disponibile" />
      ) : (
        <div className="card divide-y divide-slate-100 dark:divide-slate-800">
          {files.map((file) => (
            <a
              key={file.id}
              href={file.url}
              className="flex items-center justify-between gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl" aria-hidden>
                  {TYPE_ICON[file.fileType]}
                </span>
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-100">{file.title}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{file.description}</p>
                </div>
              </div>
              <span className="shrink-0 text-xs text-slate-400">{formatSize(file.sizeBytes)}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
