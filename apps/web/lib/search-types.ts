import type { SearchResultType } from './types';

export const SEARCH_TYPE_META: Record<SearchResultType, { label: string; labelPlural: string; icon: string }> = {
  course: { label: 'Corso', labelPlural: 'Corsi', icon: '📚' },
  manual: { label: 'Manuale', labelPlural: 'Manuali', icon: '📄' },
  video: { label: 'Video', labelPlural: 'Video', icon: '🎬' },
  quiz: { label: 'Quiz', labelPlural: 'Quiz', icon: '❓' },
  game: { label: 'Mini gioco', labelPlural: 'Mini giochi', icon: '🎮' },
  faq: { label: 'FAQ', labelPlural: 'FAQ', icon: '💬' },
};

export const SEARCH_TYPE_ORDER: SearchResultType[] = ['course', 'manual', 'video', 'quiz', 'game', 'faq'];
