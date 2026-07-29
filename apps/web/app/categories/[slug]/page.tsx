import Link from 'next/link';
import { api } from '@/lib/api';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { EmptyState } from '@/components/ui/EmptyState';

interface CategoryDetail {
  id: string;
  name: string;
  slug: string;
  children: { id: string; name: string; slug: string }[];
  courses: { id: string; title: string; slug: string; description: string }[];
}

export default async function CategoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await api.get<CategoryDetail>(`/categories/${slug}`);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[{ label: 'Home', href: '/' }, { label: 'Categorie', href: '/categories' }, { label: category.name }]}
      />
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{category.name}</h1>

      {category.children.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {category.children.map((c) => (
            <Link key={c.id} href={`/categories/${c.slug}`} className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {category.courses.length === 0 ? (
        <EmptyState title="Nessun corso in questa categoria" />
      ) : (
        <div className="card divide-y divide-slate-100 dark:divide-slate-800">
          {category.courses.map((course) => (
            <Link key={course.id} href={`/courses/${course.slug}`} className="block p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <p className="font-medium text-slate-800 dark:text-slate-100">{course.title}</p>
              <p className="mt-1 line-clamp-1 text-sm text-slate-500 dark:text-slate-400">{course.description}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
