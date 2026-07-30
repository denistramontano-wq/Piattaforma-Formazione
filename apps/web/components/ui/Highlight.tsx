const START = '§§';
const STOP = '¤¤';

/**
 * Rende in sicurezza uno snippet con i marcatori testuali prodotti da
 * ts_headline lato server (mai HTML): il testo attorno ai marcatori resta
 * puro testo React, solo i tratti tra §§ e ¤¤ diventano <mark>.
 */
export function Highlight({ text }: { text: string | null }) {
  if (!text) return null;
  const parts = text.split(START);

  return (
    <>
      {parts.map((part, i) => {
        if (i === 0) return <span key={i}>{part}</span>;
        const [marked, ...rest] = part.split(STOP);
        return (
          <span key={i}>
            <mark className="rounded bg-amber-200 px-0.5 text-slate-900 dark:bg-amber-400/40 dark:text-slate-50">
              {marked}
            </mark>
            {rest.join(STOP)}
          </span>
        );
      })}
    </>
  );
}
