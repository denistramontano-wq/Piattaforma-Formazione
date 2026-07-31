'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { NavLinks } from './NavLinks';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);

  // Chiude il menu ad ogni cambio pagina (es. dopo un click su un link) e con Esc.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={open ? 'Chiudi menu' : 'Apri menu'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="shrink-0 rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
      >
        {open ? '✕' : '☰'}
      </button>

      {/* Portato su document.body: l'header ha backdrop-blur, che crea un containing
          block per gli elementi position:fixed al suo interno e romperebbe questo overlay. */}
      {mounted &&
        open &&
        createPortal(
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden />
            <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto border-r border-slate-200 bg-white px-3 py-4 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <NavLinks onNavigate={() => setOpen(false)} />
            </aside>
          </div>,
          document.body,
        )}
    </>
  );
}
