'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import type { ChatAskResponse, ChatSource } from '@/lib/types';

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  sources?: ChatSource[];
}

export function ChatPanel({ compact = false }: { compact?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = question.trim();
    if (!text || loading) return;

    setQuestion('');
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'USER', content: text }]);
    setLoading(true);

    try {
      const res = await api.post<ChatAskResponse>('/ai/chat', { question: text, conversationId });
      setConversationId(res.conversationId);
      setMessages((prev) => [
        ...prev,
        { id: res.messageId, role: 'ASSISTANT', content: res.answer, sources: res.sources },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, role: 'ASSISTANT', content: 'Si è verificato un errore. Riprova.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className={`flex-1 overflow-y-auto ${compact ? 'space-y-3 p-3' : 'space-y-4 p-4'}`}>
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-slate-400">
            <span className="text-3xl" aria-hidden>
              🤖
            </span>
            <p className="max-w-xs text-sm">
              Chiedimi qualcosa sui materiali della piattaforma: rispondo solo in base a corsi, manuali, video, quiz e FAQ caricati.
            </p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'USER' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                m.role === 'USER'
                  ? 'bg-accent-500 text-white'
                  : 'card text-slate-700 dark:text-slate-200'
              }`}
            >
              <p className="whitespace-pre-line">{m.content}</p>
              {m.sources && m.sources.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 border-t border-slate-200/60 pt-2 dark:border-slate-700/60">
                  {m.sources.map((s, i) => (
                    <Link
                      key={i}
                      href={s.url}
                      className="badge bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      📎 {s.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="card px-3 py-2 text-sm text-slate-400">Sto cercando nei materiali…</div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Scrivi una domanda…"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        <button type="submit" disabled={loading || !question.trim()} className="btn-primary">
          Invia
        </button>
      </form>
    </div>
  );
}
