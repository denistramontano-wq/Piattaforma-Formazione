-- CreateEnum
CREATE TYPE "QuestionMode" AS ENUM ('SEQUENTIAL', 'RANDOM');

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "orderIndex" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN     "bankSize" INTEGER,
ADD COLUMN     "maxAttempts" INTEGER,
ADD COLUMN     "questionMode" "QuestionMode" NOT NULL DEFAULT 'SEQUENTIAL',
ADD COLUMN     "timeLimitSeconds" INTEGER;

-- AlterTable (nullable first, backfilled below, then set NOT NULL)
ALTER TABLE "QuizAttempt" ADD COLUMN     "questionIds" JSONB;

UPDATE "QuizAttempt" qa
SET "questionIds" = COALESCE(
  (SELECT jsonb_agg(q.id) FROM "Question" q WHERE q."quizId" = qa."quizId"),
  '[]'::jsonb
)
WHERE qa."questionIds" IS NULL;

ALTER TABLE "QuizAttempt" ALTER COLUMN "questionIds" SET NOT NULL;
