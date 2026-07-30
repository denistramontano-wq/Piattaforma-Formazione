import type { ConceptMapNode } from '@/lib/types';

export function ConceptMapView({ node, depth = 0 }: { node: ConceptMapNode; depth?: number }) {
  const colors = [
    'border-accent-400 bg-accent-50 text-accent-700 dark:bg-accent-500/10 dark:text-accent-400',
    'border-slate-300 bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    'border-slate-200 bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300',
  ];

  return (
    <div className={depth > 0 ? 'ml-6 mt-2 border-l-2 border-dashed border-slate-200 pl-4 dark:border-slate-800' : ''}>
      <span className={`inline-block rounded-lg border px-3 py-1.5 text-sm font-medium ${colors[Math.min(depth, 2)]}`}>
        {node.label}
      </span>
      {node.children.length > 0 && (
        <div className="flex flex-col gap-1">
          {node.children.map((child) => (
            <ConceptMapView key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
