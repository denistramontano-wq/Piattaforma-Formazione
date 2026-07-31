'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import type { AdminQuestion, Level } from '@/lib/types';

const TYPES = [
  { value: 'MULTIPLE_CHOICE', label: 'Risposta multipla' },
  { value: 'TRUE_FALSE', label: 'Vero/Falso' },
  { value: 'OPEN_TEXT', label: 'Risposta aperta' },
  { value: 'FILL_BLANK', label: 'Completamento frase' },
  { value: 'DRAG_DROP', label: 'Trascinamento elementi' },
  { value: 'ORDERING', label: 'Ordinamento' },
  { value: 'IMAGE_CHOICE', label: 'Selezione immagini' },
];

const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800';

function nextId(prefix: string, existing: string[]): string {
  let i = existing.length + 1;
  while (existing.includes(`${prefix}${i}`)) i++;
  return `${prefix}${i}`;
}

export function QuestionForm({
  quizId,
  existing,
  onSaved,
  onCancel,
}: {
  quizId: string;
  existing?: AdminQuestion;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const [type, setType] = useState(existing?.type ?? 'MULTIPLE_CHOICE');
  const [prompt, setPrompt] = useState(existing?.prompt ?? '');
  const [explanation, setExplanation] = useState(existing?.explanation ?? '');
  const [scoreWeight, setScoreWeight] = useState(String(existing?.scoreWeight ?? 1));
  const [difficulty, setDifficulty] = useState<Level>(existing?.difficulty ?? 'BASE');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isChoice = existing && (existing.type === 'MULTIPLE_CHOICE' || existing.type === 'IMAGE_CHOICE');
  const [options, setOptions] = useState<{ id: string; text: string; correct: boolean }[]>(
    isChoice
      ? existing!.payload.options.map((o: any) => ({
          id: o.id,
          text: o.text ?? o.imageUrl ?? '',
          correct: (existing!.payload.correct ?? []).includes(o.id),
        }))
      : [
          { id: 'a', text: '', correct: false },
          { id: 'b', text: '', correct: false },
        ],
  );

  const [trueFalseCorrect, setTrueFalseCorrect] = useState<boolean>(
    existing?.type === 'TRUE_FALSE' ? existing.payload.correct : true,
  );

  const [fillText, setFillText] = useState(existing?.type === 'FILL_BLANK' ? existing.payload.text : '');
  const [blanks, setBlanks] = useState<{ key: string; value: string }[]>(
    existing?.type === 'FILL_BLANK'
      ? Object.entries(existing.payload.blanks ?? {}).map(([k, v]) => ({ key: k, value: String(v) }))
      : [{ key: '1', value: '' }],
  );

  const [orderingItems, setOrderingItems] = useState<{ id: string; label: string }[]>(
    existing?.type === 'ORDERING'
      ? (existing.payload.correctOrder as string[]).map(
          (id) => existing.payload.items.find((i: any) => i.id === id) ?? { id, label: '' },
        )
      : [
          { id: '1', label: '' },
          { id: '2', label: '' },
        ],
  );

  const [ddItems, setDdItems] = useState<{ id: string; label: string }[]>(
    existing?.type === 'DRAG_DROP' ? existing.payload.items : [{ id: 'i1', label: '' }],
  );
  const [ddTargets, setDdTargets] = useState<{ id: string; label: string }[]>(
    existing?.type === 'DRAG_DROP' ? existing.payload.targets : [{ id: 't1', label: '' }],
  );
  const [ddMap, setDdMap] = useState<Record<string, string>>(
    existing?.type === 'DRAG_DROP' ? existing.payload.correctMap : {},
  );

  const [keywords, setKeywords] = useState(
    existing?.type === 'OPEN_TEXT' ? (existing.payload.keywords ?? []).join(', ') : '',
  );

  function buildPayload(): Record<string, unknown> {
    switch (type) {
      case 'MULTIPLE_CHOICE':
        return { options: options.map((o) => ({ id: o.id, text: o.text })), correct: options.filter((o) => o.correct).map((o) => o.id) };
      case 'IMAGE_CHOICE':
        return { options: options.map((o) => ({ id: o.id, imageUrl: o.text })), correct: options.filter((o) => o.correct).map((o) => o.id) };
      case 'TRUE_FALSE':
        return { correct: trueFalseCorrect };
      case 'FILL_BLANK':
        return { text: fillText, blanks: Object.fromEntries(blanks.map((b) => [b.key, b.value])) };
      case 'ORDERING':
        return { items: orderingItems, correctOrder: orderingItems.map((i) => i.id) };
      case 'DRAG_DROP':
        return { items: ddItems, targets: ddTargets, correctMap: ddMap };
      case 'OPEN_TEXT':
        return { keywords: keywords.split(',').map((k: string) => k.trim()).filter(Boolean) };
      default:
        return {};
    }
  }

  async function handleSave() {
    if (!prompt.trim()) {
      setError('Il testo della domanda è obbligatorio.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const body = {
        type,
        prompt,
        explanation: explanation || null,
        scoreWeight: Number(scoreWeight) || 1,
        difficulty,
        payload: buildPayload(),
      };
      if (existing) {
        await api.put(`/admin/questions/${existing.id}`, body);
      } else {
        await api.post(`/admin/quizzes/${quizId}/questions`, body);
      }
      onSaved();
    } catch {
      setError('Salvataggio non riuscito.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Tipologia</span>
          <select value={type} onChange={(e) => setType(e.target.value)} disabled={!!existing} className={inputClass}>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Difficoltà</span>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Level)} className={inputClass}>
            <option value="BASE">Base</option>
            <option value="INTERMEDIO">Intermedio</option>
            <option value="AVANZATO">Avanzato</option>
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-600 dark:text-slate-300">Testo della domanda</span>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2} className={inputClass} />
      </label>

      {(type === 'MULTIPLE_CHOICE' || type === 'IMAGE_CHOICE') && (
        <div className="flex flex-col gap-2">
          <span className="text-sm text-slate-600 dark:text-slate-300">
            Opzioni {type === 'IMAGE_CHOICE' && '(descrizione immagine)'} — seleziona quelle corrette
          </span>
          {options.map((opt, i) => (
            <div key={opt.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={opt.correct}
                onChange={(e) =>
                  setOptions((prev) => prev.map((o, j) => (j === i ? { ...o, correct: e.target.checked } : o)))
                }
              />
              <input
                value={opt.text}
                onChange={(e) => setOptions((prev) => prev.map((o, j) => (j === i ? { ...o, text: e.target.value } : o)))}
                className={inputClass}
                placeholder={type === 'IMAGE_CHOICE' ? 'Descrizione immagine' : 'Testo opzione'}
              />
              <button type="button" onClick={() => setOptions((prev) => prev.filter((_, j) => j !== i))} className="text-xs text-rose-600">
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setOptions((prev) => [...prev, { id: nextId('opt', prev.map((o) => o.id)), text: '', correct: false }])
            }
            className="btn-secondary w-fit"
          >
            + Aggiungi opzione
          </button>
        </div>
      )}

      {type === 'TRUE_FALSE' && (
        <div className="flex gap-4">
          {[true, false].map((b) => (
            <label key={String(b)} className="flex items-center gap-2 text-sm">
              <input type="radio" checked={trueFalseCorrect === b} onChange={() => setTrueFalseCorrect(b)} />
              {b ? 'Vero' : 'Falso'}
            </label>
          ))}
        </div>
      )}

      {type === 'FILL_BLANK' && (
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600 dark:text-slate-300">
              Testo con segnaposto (usa {'{{1}}'}, {'{{2}}'}, …)
            </span>
            <input value={fillText} onChange={(e) => setFillText(e.target.value)} className={inputClass} />
          </label>
          {blanks.map((b, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-sm text-slate-500">{'{{' + b.key + '}}'} =</span>
              <input
                value={b.value}
                onChange={(e) => setBlanks((prev) => prev.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
                className={inputClass}
                placeholder="risposta corretta"
              />
              <button type="button" onClick={() => setBlanks((prev) => prev.filter((_, j) => j !== i))} className="text-xs text-rose-600">
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setBlanks((prev) => [...prev, { key: String(prev.length + 1), value: '' }])}
            className="btn-secondary w-fit"
          >
            + Aggiungi segnaposto
          </button>
        </div>
      )}

      {type === 'ORDERING' && (
        <div className="flex flex-col gap-2">
          <span className="text-sm text-slate-600 dark:text-slate-300">Elementi, nell&apos;ordine corretto</span>
          {orderingItems.map((item, i) => (
            <div key={item.id} className="flex items-center gap-2">
              <span className="w-5 text-xs text-slate-400">{i + 1}.</span>
              <input
                value={item.label}
                onChange={(e) => setOrderingItems((prev) => prev.map((o, j) => (j === i ? { ...o, label: e.target.value } : o)))}
                className={inputClass}
              />
              <button type="button" onClick={() => setOrderingItems((prev) => prev.filter((_, j) => j !== i))} className="text-xs text-rose-600">
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setOrderingItems((prev) => [...prev, { id: nextId('', prev.map((o) => o.id)), label: '' }])
            }
            className="btn-secondary w-fit"
          >
            + Aggiungi elemento
          </button>
        </div>
      )}

      {type === 'DRAG_DROP' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-300">Elementi da trascinare</span>
            {ddItems.map((item, i) => (
              <div key={item.id} className="flex items-center gap-2">
                <input
                  value={item.label}
                  onChange={(e) => setDdItems((prev) => prev.map((o, j) => (j === i ? { ...o, label: e.target.value } : o)))}
                  className={inputClass}
                />
                <select
                  value={ddMap[item.id] ?? ''}
                  onChange={(e) => setDdMap((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">→ area corretta</option>
                  {ddTargets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label || t.id}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setDdItems((prev) => [...prev, { id: nextId('i', prev.map((o) => o.id)), label: '' }])}
              className="btn-secondary w-fit"
            >
              + Elemento
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-300">Aree di destinazione</span>
            {ddTargets.map((target, i) => (
              <div key={target.id} className="flex items-center gap-2">
                <input
                  value={target.label}
                  onChange={(e) => setDdTargets((prev) => prev.map((o, j) => (j === i ? { ...o, label: e.target.value } : o)))}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setDdTargets((prev) => prev.filter((_, j) => j !== i))}
                  className="text-xs text-rose-600"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setDdTargets((prev) => [...prev, { id: nextId('t', prev.map((o) => o.id)), label: '' }])}
              className="btn-secondary w-fit"
            >
              + Area
            </button>
          </div>
        </div>
      )}

      {type === 'OPEN_TEXT' && (
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Parole chiave attese (separate da virgola)</span>
          <input value={keywords} onChange={(e) => setKeywords(e.target.value)} className={inputClass} />
        </label>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Peso nel punteggio</span>
          <input type="number" min={1} value={scoreWeight} onChange={(e) => setScoreWeight(e.target.value)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Spiegazione (mostrata dopo la risposta)</span>
          <input value={explanation} onChange={(e) => setExplanation(e.target.value)} className={inputClass} />
        </label>
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="flex gap-2">
        <button type="button" onClick={handleSave} disabled={saving} className="btn-primary w-fit">
          {saving ? 'Salvataggio…' : existing ? 'Salva modifiche' : 'Aggiungi domanda'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary w-fit">
            Annulla
          </button>
        )}
      </div>
    </div>
  );
}
