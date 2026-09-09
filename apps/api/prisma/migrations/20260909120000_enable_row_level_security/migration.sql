-- Abilita Row Level Security su tutte le tabelle dello schema "public".
--
-- Supabase espone automaticamente lo schema "public" tramite la sua API
-- REST (PostgREST), usando i ruoli "anon"/"authenticated" che NON hanno il
-- privilegio BYPASSRLS. Senza RLS abilitata, chiunque conoscesse l'URL del
-- progetto Supabase e la chiave pubblica ("anon"/"publishable") potrebbe
-- leggere o scrivere direttamente tutte le righe di tutte le tabelle
-- tramite quella API REST, scavalcando completamente il backend NestJS.
--
-- Il backend NestJS/Prisma si connette invece con il ruolo proprietario del
-- database (o comunque un ruolo con privilegi pieni), che ignora RLS: questa
-- migrazione non cambia quindi alcun comportamento dell'applicazione, ma
-- blocca l'accesso diretto non autenticato via PostgREST. Non vengono
-- aggiunte policy: RLS abilitata senza policy significa "nessun accesso"
-- per i ruoli soggetti a RLS, che è il comportamento desiderato dato che
-- l'app non usa PostgREST.

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Course" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Module" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lesson" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Enrollment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LessonProgress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Video" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Quiz" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Question" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QuizAttempt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QuizAttemptAnswer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MiniGame" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GameSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DownloadFile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Faq" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Certificate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserLevel" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Badge" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserBadge" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "XpRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "XpEvent" ENABLE ROW LEVEL SECURITY;

-- Tabelle di join implicite generate da Prisma per le relazioni many-to-many.
ALTER TABLE "_CourseCategories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_CourseTags" ENABLE ROW LEVEL SECURITY;

-- Tabella interna di Prisma per lo storico delle migrazioni: non contiene
-- dati applicativi, ma è comunque nello schema "public" esposto da PostgREST.
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
