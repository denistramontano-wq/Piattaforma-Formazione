import { api } from '@/lib/api';
import type { VideoSummary } from '@/lib/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';

export default async function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const video = await api.get<VideoSummary>(`/videos/${id}`);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Video', href: '/videos' }, { label: video.title }]} />
      <div className="flex aspect-video items-center justify-center rounded-xl bg-slate-900 text-slate-300">
        <p className="text-sm">▶ Player video HLS — {video.url}</p>
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{video.title}</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">{video.description}</p>
      </div>
    </div>
  );
}
