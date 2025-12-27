-- AlterTable
ALTER TABLE "TryOutAttempt" ADD COLUMN     "finished_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "UserAnswer" (
    "id" TEXT NOT NULL,
    "tryout_attempt_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "question_item_id" TEXT,
    "inputText" TEXT,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAnswer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserAnswer" ADD CONSTRAINT "UserAnswer_tryout_attempt_id_fkey" FOREIGN KEY ("tryout_attempt_id") REFERENCES "TryOutAttempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
