import type { ActivityEvent } from '@/lib/types';
import { XP_ACTION_LABELS } from '@/lib/activity-labels';

const ICONS: Record<ActivityEvent['type'], string> = {
  xp: '⚡',
  badge: '🏅',
  certificate: '📜',
};

function eventLabel(e: ActivityEvent): string {
  if (e.type === 'xp') return XP_ACTION_LABELS[e.action] ?? e.action;
  if (e.type === 'badge') return `Badge ottenuto: ${e.label}`;
  return `Certificato ottenuto: ${e.label}`;
}

export function ActivityTimeline({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return <p className="py-4 text-sm text-slate-400">Nessuna attività ancora registrata.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {events.map((e, i) => (
        <li key={i} className="flex items-start gap-3 text-sm">
          <span className="text-lg" aria-hidden>
            {ICONS[e.type]}
          </span>
          <div className="flex-1">
            <p className="text-slate-700 dark:text-slate-200">{eventLabel(e)}</p>
            <p className="text-xs text-slate-400">
              {new Date(e.createdAt).toLocaleString('it-IT', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Europe/Rome',
              })}
            </p>
          </div>
          {e.type === 'xp' && (
            <span className="font-medium text-emerald-600 dark:text-emerald-400">+{e.points} XP</span>
          )}
        </li>
      ))}
    </ul>
  );
}
