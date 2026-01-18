-- AlterTable
ALTER TABLE "user" ADD COLUMN     "currentStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastDailyDate" TIMESTAMP(3),
ADD COLUMN     "tokenBalance" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "TryOut" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "solutionPrice" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "referralCode" TEXT,
    "scheduledStart" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TryOut_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyQuestionLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyQuestionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subtest" (
    "id" TEXT NOT NULL,
    "try_out_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Subtest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "subtest_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "imageUrl" TEXT,
    "narration" TEXT,
    "content" TEXT,
    "explanation" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,
    "correct_answer_short_answer" TEXT,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionItem" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "content" TEXT,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,

    CONSTRAINT "QuestionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnlockedSolution" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tryOutId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnlockedSolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TryOutAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "try_out_id" TEXT NOT NULL,
    "total_score" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TryOutAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TryOut_referralCode_key" ON "TryOut"("referralCode");

-- CreateIndex
CREATE INDEX "daily_user_date_idx" ON "DailyQuestionLog"("userId", "completedAt");

-- AddForeignKey
ALTER TABLE "DailyQuestionLog" ADD CONSTRAINT "DailyQuestionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyQuestionLog" ADD CONSTRAINT "DailyQuestionLog_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subtest" ADD CONSTRAINT "Subtest_try_out_id_fkey" FOREIGN KEY ("try_out_id") REFERENCES "TryOut"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_subtest_id_fkey" FOREIGN KEY ("subtest_id") REFERENCES "Subtest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionItem" ADD CONSTRAINT "QuestionItem_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenTransaction" ADD CONSTRAINT "TokenTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnlockedSolution" ADD CONSTRAINT "UnlockedSolution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnlockedSolution" ADD CONSTRAINT "UnlockedSolution_tryOutId_fkey" FOREIGN KEY ("tryOutId") REFERENCES "TryOut"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TryOutAttempt" ADD CONSTRAINT "TryOutAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TryOutAttempt" ADD CONSTRAINT "TryOutAttempt_try_out_id_fkey" FOREIGN KEY ("try_out_id") REFERENCES "TryOut"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
