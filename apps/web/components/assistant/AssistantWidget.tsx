'use client';

import { useState } from 'react';
import { ChatPanel } from './ChatPanel';

export function AssistantWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div className="card fixed bottom-20 right-4 z-30 flex h-[28rem] w-80 flex-col overflow-hidden sm:right-6">
          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">🤖 Assistente virtuale</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Chiudi assistente"
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              ✕
            </button>
          </div>
          <ChatPanel compact />
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Apri assistente virtuale"
        className="fixed bottom-4 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-accent-500 text-xl text-white shadow-lg transition hover:bg-accent-600 sm:right-6"
      >
        {open ? '✕' : '🤖'}
      </button>
    </>
  );
}
