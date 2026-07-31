import { NavLinks } from './NavLinks';

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white px-3 py-4 dark:border-slate-800 dark:bg-slate-900 md:block">
      <NavLinks />
    </aside>
  );
}
