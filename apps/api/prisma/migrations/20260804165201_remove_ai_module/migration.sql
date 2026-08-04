-- Rimozione del modulo Intelligenza Artificiale (generatore contenuti + assistente virtuale)

-- DropForeignKey
ALTER TABLE "AiGeneration" DROP CONSTRAINT IF EXISTS "AiGeneration_reviewedById_fkey";
ALTER TABLE "ChatConversation" DROP CONSTRAINT IF EXISTS "ChatConversation_userId_fkey";
ALTER TABLE "ChatMessage" DROP CONSTRAINT IF EXISTS "ChatMessage_conversationId_fkey";

-- DropTable
DROP TABLE IF EXISTS "ChatMessage";
DROP TABLE IF EXISTS "ChatConversation";
DROP TABLE IF EXISTS "AiGeneration";
DROP TABLE IF EXISTS "AiUsageLog";

-- DropEnum
DROP TYPE IF EXISTS "AiSourceType";
DROP TYPE IF EXISTS "AiGenerationType";
DROP TYPE IF EXISTS "AiReviewStatus";
DROP TYPE IF EXISTS "ChatRole";
