'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface Item {
  id: string;
  label: string;
}
interface Zone {
  id: string;
  label: string;
}

export function DragDropGame({
  gameId,
  items,
  zones,
  correctMap,
}: {
  gameId: string;
  items: Item[];
  zones: Zone[];
  correctMap: Record<string, string>;
}) {
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [dragItemId, setDragItemId] = useState<string | null>(null);
  const startedAt = useState(() => Date.now())[0];

  const remaining = items.filter((i) => !placed[i.id]);

  function dropOnZone(zoneId: string, itemId: string) {
    if (!itemId || placed[itemId]) return;
    const next = { ...placed, [itemId]: zoneId };
    setPlaced(next);
    if (Object.keys(next).length === items.length) {
      const correctCount = items.filter((i) => next[i.id] === correctMap[i.id]).length;
      const finalScore = Math.round((correctCount / items.length) * 100);
      setScore(finalScore);
      setFinished(true);
      api.post(`/games/${gameId}/sessions`, {
        score: finalScore,
        durationSeconds: Math.round((Date.now() - startedAt) / 1000),
      });
    }
  }

  function handleZoneClick(zoneId: string) {
    if (!dragItemId) return;
    dropOnZone(zoneId, dragItemId);
    setDragItemId(null);
  }

  if (finished) {
    return (
      <div className="card p-8 text-center">
        <p className="text-3xl">🧩</p>
        <p className="mt-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
          Punteggio: {score}%
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Trascina (o tocca l&apos;elemento e poi l&apos;area) ogni elemento nell&apos;area corretta.
      </p>
      <div className="flex flex-wrap gap-2">
        {remaining.map((item) => (
          <button
            key={item.id}
            type="button"
            draggable
            onDragStart={() => setDragItemId(item.id)}
            onClick={() => setDragItemId((cur) => (cur === item.id ? null : item.id))}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
              dragItemId === item.id
                ? 'border-accent-500 bg-accent-50 text-accent-700 dark:bg-accent-500/10 dark:text-accent-400'
                : 'border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {zones.map((zone) => {
          const placedItems = items.filter((i) => placed[i.id] === zone.id);
          return (
            <div
              key={zone.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                dropOnZone(zone.id, dragItemId ?? '');
                setDragItemId(null);
              }}
              onClick={() => handleZoneClick(zone.id)}
              className="card flex min-h-24 flex-col gap-1 border-dashed p-3"
            >
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{zone.label}</p>
              {placedItems.map((i) => (
                <span key={i.id} className="rounded bg-emerald-50 px-2 py-1 text-xs text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  {i.label}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
