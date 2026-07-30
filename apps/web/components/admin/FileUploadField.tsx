'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export function FileUploadField({
  label,
  accept,
  value,
  onChange,
}: {
  label: string;
  accept?: string;
  value?: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const result = await api.upload(file);
      onChange(result.url);
    } catch {
      setError('Caricamento fallito. Riprova.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div className="flex flex-col gap-1 text-sm">
      <span className="text-slate-600 dark:text-slate-300">{label}</span>
      <div className="flex items-center gap-3">
        <label className="btn-secondary cursor-pointer">
          {uploading ? 'Caricamento…' : 'Scegli file'}
          <input type="file" accept={accept} className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
        {value && (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="max-w-xs truncate text-xs text-accent-600 hover:underline dark:text-accent-400"
          >
            {value.split('/').pop()}
          </a>
        )}
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
