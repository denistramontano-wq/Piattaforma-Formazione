import Link from 'next/link';
import { api } from '@/lib/api';
import type { CategoryNode } from '@/lib/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';

export default async function CategoriesPage() {
  const categories = await api.get<CategoryNode[]>('/categories');

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Categorie' }]} />
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Categorie</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <div key={category.id} className="card p-4">
            <Link
              href={`/categories/${category.slug}`}
              className="font-semibold text-slate-800 hover:text-accent-600 dark:text-slate-100 dark:hover:text-accent-400"
            >
              {category.name}
            </Link>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{category._count.courses} corsi</p>
            {category.children.length > 0 && (
              <ul className="mt-3 flex flex-col gap-1 border-t border-slate-100 pt-3 dark:border-slate-800">
                {category.children.map((child) => (
                  <li key={child.id}>
                    <Link
                      href={`/categories/${child.slug}`}
                      className="text-sm text-slate-600 hover:text-accent-600 dark:text-slate-300 dark:hover:text-accent-400"
                    >
                      ↳ {child.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
