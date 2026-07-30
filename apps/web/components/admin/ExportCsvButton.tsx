'use client';

import { downloadCsv } from '@/lib/csv';

export function ExportCsvButton({ filename, rows }: { filename: string; rows: Record<string, unknown>[] }) {
  return (
    <button
      type="button"
      onClick={() => downloadCsv(filename, rows)}
      disabled={rows.length === 0}
      className="btn-secondary disabled:opacity-50"
    >
      ⬇️ Esporta CSV
    </button>
  );
}
