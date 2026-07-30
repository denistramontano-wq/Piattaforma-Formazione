import { api } from '@/lib/api';
import type { AdminCourseDetail, CategoryFlat } from '@/lib/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { CourseEditor } from '@/components/admin/CourseEditor';

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [course, categories] = await Promise.all([
    api.get<AdminCourseDetail>(`/admin/courses/${id}`),
    api.get<CategoryFlat[]>('/admin/categories'),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Dashboard amministratore', href: '/admin' },
          { label: 'Corsi', href: '/admin/courses' },
          { label: course.title },
        ]}
      />
      <CourseEditor initialCourse={course} categories={categories} />
    </div>
  );
}
