-- AlterTable
ALTER TABLE "DailyQuestionLog" ADD COLUMN     "userAnswer" TEXT;

-- AlterTable
ALTER TABLE "TryOutAttempt" ADD COLUMN     "current_subtest_order" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "subtest_started_at" TIMESTAMP(3);
