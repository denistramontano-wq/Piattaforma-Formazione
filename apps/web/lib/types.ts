export type Level = 'BASE' | 'INTERMEDIO' | 'AVANZATO';

export interface CourseSummary {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverUrl: string | null;
  level: Level;
  estimatedMinutes: number;
  categories: { name: string; slug: string }[];
  tags: string[];
  moduleCount: number;
  lessonCount: number;
  enrollment: { status: string; progressPct: number } | null;
}

export interface CourseDetail extends Omit<CourseSummary, 'moduleCount' | 'lessonCount'> {
  author: string;
  modules: {
    id: string;
    title: string;
    lessons: {
      id: string;
      title: string;
      estimatedMinutes: number;
      contentType: 'TEXT' | 'VIDEO' | 'PDF';
      completed: boolean;
    }[];
  }[];
}

export interface LessonDetail {
  id: string;
  title: string;
  contentType: 'TEXT' | 'VIDEO' | 'PDF';
  contentBody: string | null;
  videoUrl: string | null;
  estimatedMinutes: number;
  course: { slug: string; title: string };
  module: { id: string; title: string };
  quizzes: { id: string; title: string }[];
}

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  _count: { courses: number };
  children: CategoryNode[];
}

export interface DocumentSummary {
  id: string;
  title: string;
  description: string | null;
  author: string | null;
  level: Level;
  estimatedMinutes: number;
  category: { name: string; slug: string } | null;
  versions: { versionNumber: number; fileUrl: string }[];
}

export interface VideoSummary {
  id: string;
  title: string;
  description: string | null;
  url: string;
  durationSeconds: number;
  level: Level;
  category: { name: string; slug: string } | null;
}

export interface QuizSummary {
  id: string;
  title: string;
  description: string | null;
  level: Level;
  questionCount: number;
  passThresholdPct: number;
}

export interface QuizQuestion {
  id: string;
  type: string;
  prompt: string;
  payload: any;
  scoreWeight: number;
  difficulty: Level;
}

export interface QuizDetail {
  id: string;
  title: string;
  description: string | null;
  passThresholdPct: number;
  questions: QuizQuestion[];
}

export interface QuizResult {
  scorePct: number;
  passed: boolean;
  details: { questionId: string; correct: boolean; explanation: string | null }[];
}

export interface MiniGame {
  id: string;
  title: string;
  description: string | null;
  type: string;
  difficulty: Level;
  config: any;
}

export interface DownloadFile {
  id: string;
  title: string;
  description: string | null;
  fileType: 'PDF' | 'WORD' | 'EXCEL' | 'POWERPOINT' | 'IMAGE' | 'VIDEO';
  url: string;
  sizeBytes: number;
  category: { name: string; slug: string } | null;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: { name: string; slug: string } | null;
}

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: string;
  level: number;
  totalXp: number;
  badgeCount: number;
}

export interface UserDashboard {
  user: { fullName: string; level: number; totalXp: number };
  coursesInProgress: number;
  coursesCompleted: number;
  certificatesCount: number;
  badgeCount: number;
  courses: { title: string; slug: string; coverUrl: string | null; status: string; progressPct: number }[];
}

export interface ProgressOverview {
  completedCourses: number;
  inProgressCourses: number;
  totalStudyMinutes: number;
  avgQuizScore: number;
  certificatesCount: number;
  badges: { name: string; earnedAt: string }[];
  courses: { title: string; slug: string; coverUrl: string | null; status: string; progressPct: number }[];
  recentQuizResults: { quizTitle: string; scorePct: number | null; passed: boolean | null; submittedAt: string | null }[];
}

export interface Certificate {
  id: string;
  verifyCode: string;
  pdfUrl: string | null;
  issuedAt: string;
  course: { title: string; slug: string };
}

export interface HomeHighlights {
  featured: {
    id: string;
    title: string;
    slug: string;
    coverUrl: string | null;
    level: Level;
    estimatedMinutes: number;
  }[];
  continueLearning: { title: string; slug: string; coverUrl: string | null; progressPct: number }[];
}

export interface AdminOverview {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  completedEnrollments: number;
  avgQuizScore: number;
  quizPassRatePct: number;
  inactiveUsers: number;
  topCourses: { title: string; slug: string; enrollments: number }[];
}

export type ContentStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';

export interface CategoryFlat {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  depth: number;
  usageCount: number;
}

export interface AdminCourseListItem {
  id: string;
  title: string;
  slug: string;
  status: ContentStatus;
  level: Level;
  publishAt: string | null;
  categories: { id: string; name: string }[];
  modules: { id: string; lessons: { id: string }[] }[];
  _count: { enrollments: number };
}

export interface AdminLesson {
  id: string;
  title: string;
  orderIndex: number;
  estimatedMinutes: number;
  contentType: 'TEXT' | 'VIDEO' | 'PDF';
  contentBody: string | null;
  videoUrl: string | null;
}

export interface AdminModule {
  id: string;
  title: string;
  orderIndex: number;
  lessons: AdminLesson[];
}

export interface AdminCourseDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverUrl: string | null;
  level: Level;
  estimatedMinutes: number;
  status: ContentStatus;
  publishAt: string | null;
  categories: { id: string; name: string }[];
  tags: { id: string; name: string }[];
  modules: AdminModule[];
}

export interface AdminDocument {
  id: string;
  title: string;
  description: string | null;
  author: string | null;
  level: Level;
  estimatedMinutes: number;
  category: { id: string; name: string } | null;
  categoryId?: string | null;
  versions: { versionNumber: number; fileUrl: string; changelog: string | null; isCurrent: boolean; createdAt: string }[];
}

export type SearchResultType = 'course' | 'manual' | 'video' | 'quiz' | 'game' | 'faq';

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  snippet: string | null;
  url: string;
  rank: number;
}

export interface SearchResponse {
  query: string;
  total: number;
  results: SearchResult[];
}

export interface SuggestItem {
  type: SearchResultType;
  title: string;
  url: string;
}
