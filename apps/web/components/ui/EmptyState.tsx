export function EmptyState({ icon = '🗂️', title, description }: { icon?: string; title: string; description?: string }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-16 text-center">
      <span className="text-4xl" aria-hidden>
        {icon}
      </span>
      <p className="text-base font-medium text-slate-700 dark:text-slate-200">{title}</p>
      {description && <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>}
    </div>
  );
}
