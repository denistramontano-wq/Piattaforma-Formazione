'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { AdminCourseDetail, AdminLesson, AdminModule, CategoryFlat, ContentStatus, Level } from '@/lib/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FileUploadField } from './FileUploadField';

const LEVEL_OPTIONS: Level[] = ['BASE', 'INTERMEDIO', 'AVANZATO'];
const STATUS_OPTIONS: ContentStatus[] = ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'];

export function CourseEditor({
  initialCourse,
  categories,
}: {
  initialCourse: AdminCourseDetail;
  categories: CategoryFlat[];
}) {
  const router = useRouter();
  const [course, setCourse] = useState(initialCourse);
  const [savingMeta, setSavingMeta] = useState(false);

  async function refetch() {
    const fresh = await api.get<AdminCourseDetail>(`/admin/courses/${course.id}`);
    setCourse(fresh);
  }

  async function saveMeta(form: {
    title: string;
    description: string;
    level: Level;
    estimatedMinutes: number;
    coverUrl?: string;
    categoryIds: string[];
    tags: string[];
  }) {
    setSavingMeta(true);
    try {
      await api.put(`/admin/courses/${course.id}`, form);
      await refetch();
    } finally {
      setSavingMeta(false);
    }
  }

  async function applyStatus(status: ContentStatus, publishAt?: string) {
    await api.patch(`/admin/courses/${course.id}/status`, { status, publishAt });
    await refetch();
  }

  async function deleteCourse() {
    if (!confirm(`Eliminare definitivamente il corso "${course.title}"?`)) return;
    await api.delete(`/admin/courses/${course.id}`);
    router.push('/admin/courses');
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{course.title}</h1>
          <StatusBadge status={course.status} />
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/courses/${course.slug}`} target="_blank" className="btn-secondary">
            Anteprima
          </Link>
          <button type="button" onClick={deleteCourse} className="btn-secondary text-rose-600 dark:text-rose-400">
            Elimina corso
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <MetaForm course={course} categories={categories} saving={savingMeta} onSave={saveMeta} />
        <StatusPanel course={course} onApply={applyStatus} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-100">Moduli e lezioni</h2>
        <div className="flex flex-col gap-4">
          {course.modules.map((m, i) => (
            <ModuleEditor
              key={m.id}
              module={m}
              isFirst={i === 0}
              isLast={i === course.modules.length - 1}
              onChanged={refetch}
            />
          ))}
        </div>
        <NewModuleForm courseId={course.id} onCreated={refetch} />
      </section>
    </div>
  );
}

function MetaForm({
  course,
  categories,
  saving,
  onSave,
}: {
  course: AdminCourseDetail;
  categories: CategoryFlat[];
  saving: boolean;
  onSave: (form: {
    title: string;
    description: string;
    level: Level;
    estimatedMinutes: number;
    coverUrl?: string;
    categoryIds: string[];
    tags: string[];
  }) => void;
}) {
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description);
  const [level, setLevel] = useState<Level>(course.level);
  const [estimatedMinutes, setEstimatedMinutes] = useState(course.estimatedMinutes);
  const [coverUrl, setCoverUrl] = useState(course.coverUrl ?? '');
  const [categoryIds, setCategoryIds] = useState<string[]>(course.categories.map((c) => c.id));
  const [tags, setTags] = useState(course.tags.map((t) => t.name).join(', '));

  function toggleCategory(id: string) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  return (
    <form
      className="card flex flex-col gap-4 p-5 lg:col-span-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          title,
          description,
          level,
          estimatedMinutes,
          coverUrl,
          categoryIds,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        });
      }}
    >
      <h2 className="font-semibold text-slate-800 dark:text-slate-100">Metadati del corso</h2>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-600 dark:text-slate-300">Titolo</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800"
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-600 dark:text-slate-300">Descrizione</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="rounded-lg border border-slate-300 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Livello</span>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as Level)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800"
          >
            {LEVEL_OPTIONS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Tempo stimato (minuti)</span>
          <input
            type="number"
            min={0}
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
            className="rounded-lg border border-slate-300 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800"
          />
        </label>
      </div>

      <FileUploadField label="Copertina" accept="image/*" value={coverUrl} onChange={setCoverUrl} />

      <div className="text-sm">
        <p className="mb-1 text-slate-600 dark:text-slate-300">Categorie</p>
        <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-slate-800">
          {categories.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <input type="checkbox" checked={categoryIds.includes(c.id)} onChange={() => toggleCategory(c.id)} />
              <span style={{ paddingLeft: c.depth * 12 }}>{c.name}</span>
            </label>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-600 dark:text-slate-300">Tag (separati da virgola)</span>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="obbligatorio, onboarding"
          className="rounded-lg border border-slate-300 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800"
        />
      </label>

      <button type="submit" disabled={saving} className="btn-primary w-fit">
        {saving ? 'Salvataggio…' : 'Salva metadati'}
      </button>
    </form>
  );
}

function StatusPanel({
  course,
  onApply,
}: {
  course: AdminCourseDetail;
  onApply: (status: ContentStatus, publishAt?: string) => void;
}) {
  const [status, setStatus] = useState<ContentStatus>(course.status);
  const [publishAt, setPublishAt] = useState(course.publishAt ? course.publishAt.slice(0, 16) : '');

  return (
    <div className="card h-fit p-5">
      <h2 className="mb-3 font-semibold text-slate-800 dark:text-slate-100">Pubblicazione</h2>
      <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
        Stato attuale: <StatusBadge status={course.status} />
      </p>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-600 dark:text-slate-300">Nuovo stato</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ContentStatus)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      {status === 'SCHEDULED' && (
        <label className="mt-3 flex flex-col gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Data e ora di pubblicazione</span>
          <input
            type="datetime-local"
            value={publishAt}
            onChange={(e) => setPublishAt(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800"
            required
          />
        </label>
      )}

      <button
        type="button"
        onClick={() => onApply(status, status === 'SCHEDULED' ? new Date(publishAt).toISOString() : undefined)}
        className="btn-primary mt-4 w-full"
      >
        Applica stato
      </button>
      <p className="mt-3 text-xs text-slate-400">
        I corsi "Programmato" vengono promossi automaticamente a "Pubblicato" al raggiungimento della data
        (job schedulato ogni minuto — docs/02-gestione-contenuti.md §2.7).
      </p>
    </div>
  );
}

function NewModuleForm({ courseId, onCreated }: { courseId: string; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="mt-4 flex items-center gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        setSaving(true);
        try {
          await api.post(`/admin/courses/${courseId}/modules`, { title });
          setTitle('');
          await onCreated();
        } finally {
          setSaving(false);
        }
      }}
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titolo nuovo modulo"
        className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
      />
      <button type="submit" disabled={saving} className="btn-secondary">
        + Aggiungi modulo
      </button>
    </form>
  );
}

function ModuleEditor({
  module,
  isFirst,
  isLast,
  onChanged,
}: {
  module: AdminModule;
  isFirst: boolean;
  isLast: boolean;
  onChanged: () => Promise<void>;
}) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(module.title);
  const [addingLesson, setAddingLesson] = useState(false);

  async function rename() {
    await api.patch(`/admin/modules/${module.id}`, { title });
    setEditingTitle(false);
    await onChanged();
  }

  async function remove() {
    if (!confirm(`Eliminare il modulo "${module.title}" e tutte le sue lezioni?`)) return;
    await api.delete(`/admin/modules/${module.id}`);
    await onChanged();
  }

  async function move(direction: 'up' | 'down') {
    await api.patch(`/admin/modules/${module.id}/move`, { direction });
    await onChanged();
  }

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        {editingTitle ? (
          <div className="flex flex-1 items-center gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800"
              autoFocus
            />
            <button type="button" onClick={rename} className="btn-secondary px-2 py-1 text-xs">
              Salva
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditingTitle(true)}
            className="text-left font-medium text-slate-800 hover:text-accent-600 dark:text-slate-100 dark:hover:text-accent-400"
          >
            {module.title}
          </button>
        )}
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" onClick={() => move('up')} disabled={isFirst} className="btn-secondary px-2 py-1 text-xs disabled:opacity-30">
            ↑
          </button>
          <button type="button" onClick={() => move('down')} disabled={isLast} className="btn-secondary px-2 py-1 text-xs disabled:opacity-30">
            ↓
          </button>
          <button type="button" onClick={remove} className="btn-secondary px-2 py-1 text-xs text-rose-600 dark:text-rose-400">
            Elimina
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-l-2 border-slate-100 pl-4 dark:border-slate-800">
        {module.lessons.map((l, i) => (
          <LessonEditor
            key={l.id}
            lesson={l}
            isFirst={i === 0}
            isLast={i === module.lessons.length - 1}
            onChanged={onChanged}
          />
        ))}
      </div>

      {addingLesson ? (
        <NewLessonForm moduleId={module.id} onCreated={onChanged} onDone={() => setAddingLesson(false)} />
      ) : (
        <button type="button" onClick={() => setAddingLesson(true)} className="btn-secondary mt-3 text-xs">
          + Aggiungi lezione
        </button>
      )}
    </div>
  );
}

function NewLessonForm({
  moduleId,
  onCreated,
  onDone,
}: {
  moduleId: string;
  onCreated: () => Promise<void>;
  onDone: () => void;
}) {
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="mt-3 flex items-center gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        setSaving(true);
        try {
          await api.post(`/admin/modules/${moduleId}/lessons`, { title, contentType: 'TEXT' });
          setTitle('');
          await onCreated();
          onDone();
        } finally {
          setSaving(false);
        }
      }}
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titolo nuova lezione"
        className="flex-1 rounded-lg border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800"
        autoFocus
      />
      <button type="submit" disabled={saving} className="btn-primary px-3 py-1 text-xs">
        Crea
      </button>
      <button type="button" onClick={onDone} className="btn-secondary px-3 py-1 text-xs">
        Annulla
      </button>
    </form>
  );
}

const CONTENT_ICON: Record<AdminLesson['contentType'], string> = { TEXT: '📖', VIDEO: '🎬', PDF: '📄' };

function LessonEditor({
  lesson,
  isFirst,
  isLast,
  onChanged,
}: {
  lesson: AdminLesson;
  isFirst: boolean;
  isLast: boolean;
  onChanged: () => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState(lesson.title);
  const [contentType, setContentType] = useState(lesson.contentType);
  const [contentBody, setContentBody] = useState(lesson.contentBody ?? '');
  const [videoUrl, setVideoUrl] = useState(lesson.videoUrl ?? '');
  const [estimatedMinutes, setEstimatedMinutes] = useState(lesson.estimatedMinutes);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await api.patch(`/admin/lessons/${lesson.id}`, {
        title,
        contentType,
        contentBody,
        videoUrl,
        estimatedMinutes,
      });
      await onChanged();
      setExpanded(false);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm(`Eliminare la lezione "${lesson.title}"?`)) return;
    await api.delete(`/admin/lessons/${lesson.id}`);
    await onChanged();
  }

  async function move(direction: 'up' | 'down') {
    await api.patch(`/admin/lessons/${lesson.id}/move`, { direction });
    await onChanged();
  }

  return (
    <div className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => setExpanded((e) => !e)} className="flex items-center gap-2 text-left">
          <span aria-hidden>{CONTENT_ICON[lesson.contentType]}</span>
          <span className="text-slate-700 dark:text-slate-200">{lesson.title}</span>
          <span className="text-xs text-slate-400">{lesson.estimatedMinutes} min</span>
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" onClick={() => move('up')} disabled={isFirst} className="btn-secondary px-2 py-0.5 text-xs disabled:opacity-30">
            ↑
          </button>
          <button type="button" onClick={() => move('down')} disabled={isLast} className="btn-secondary px-2 py-0.5 text-xs disabled:opacity-30">
            ↓
          </button>
          <button type="button" onClick={remove} className="btn-secondary px-2 py-0.5 text-xs text-rose-600 dark:text-rose-400">
            Elimina
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
          <label className="flex flex-col gap-1">
            <span className="text-slate-600 dark:text-slate-300">Titolo</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border border-slate-300 px-2 py-1 dark:border-slate-700 dark:bg-slate-800"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-slate-600 dark:text-slate-300">Tipo contenuto</span>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as AdminLesson['contentType'])}
                className="rounded-lg border border-slate-300 px-2 py-1 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="TEXT">Testo</option>
                <option value="VIDEO">Video</option>
                <option value="PDF">PDF</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-slate-600 dark:text-slate-300">Minuti stimati</span>
              <input
                type="number"
                min={0}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="rounded-lg border border-slate-300 px-2 py-1 dark:border-slate-700 dark:bg-slate-800"
              />
            </label>
          </div>

          {contentType === 'TEXT' && (
            <label className="flex flex-col gap-1">
              <span className="text-slate-600 dark:text-slate-300">Contenuto testuale</span>
              <textarea
                value={contentBody}
                onChange={(e) => setContentBody(e.target.value)}
                rows={4}
                className="rounded-lg border border-slate-300 px-2 py-1 dark:border-slate-700 dark:bg-slate-800"
              />
            </label>
          )}

          {contentType === 'PDF' && (
            <FileUploadField label="Documento PDF" accept="application/pdf" value={contentBody} onChange={setContentBody} />
          )}

          {contentType === 'VIDEO' && (
            <>
              <label className="flex flex-col gap-1">
                <span className="text-slate-600 dark:text-slate-300">URL video (es. manifest HLS)</span>
                <input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="rounded-lg border border-slate-300 px-2 py-1 dark:border-slate-700 dark:bg-slate-800"
                />
              </label>
              <FileUploadField label="Oppure carica un file video" accept="video/*" value={videoUrl} onChange={setVideoUrl} />
            </>
          )}

          <button type="button" onClick={save} disabled={saving} className="btn-primary w-fit">
            {saving ? 'Salvataggio…' : 'Salva lezione'}
          </button>
        </div>
      )}
    </div>
  );
}
