'use client';

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function QuizTrendChart({ data }: { data: { date: string; scorePct: number; quizTitle: string }[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-slate-400">
        Nessun quiz svolto ancora.
      </div>
    );
  }

  const points = data.map((d, i) => ({
    index: i + 1,
    scorePct: d.scorePct,
    quizTitle: d.quizTitle,
    date: new Date(d.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', timeZone: 'Europe/Rome' }),
  }));

  return (
    <ResponsiveContainer width="100%" height={224}>
      <LineChart data={points} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
          formatter={(value) => [`${value}%`, 'Punteggio']}
          labelFormatter={(_, payload) => payload?.[0]?.payload?.quizTitle ?? ''}
        />
        <Line type="monotone" dataKey="scorePct" stroke="#3366ff" strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
