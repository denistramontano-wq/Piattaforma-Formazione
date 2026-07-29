import Link from 'next/link';
import { api } from '@/lib/api';
import type { VideoSummary } from '@/lib/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { EmptyState } from '@/components/ui/EmptyState';

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default async function VideosPage() {
  const videos = await api.get<VideoSummary[]>('/videos');

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Video' }]} />
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Video</h1>

      {videos.length === 0 ? (
        <EmptyState title="Nessun video disponibile" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <Link key={video.id} href={`/videos/${video.id}`} className="card overflow-hidden hover:shadow-md">
              <div className="relative flex h-32 items-center justify-center bg-slate-900 text-3xl text-white">▶</div>
              <div className="flex flex-col gap-1 p-4">
                <p className="font-medium text-slate-800 dark:text-slate-100">{video.title}</p>
                <p className="line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{video.description}</p>
                <p className="text-xs text-slate-400">{formatDuration(video.durationSeconds)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
