export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
    >
      <div className="h-full rounded-full bg-accent-500 transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}
