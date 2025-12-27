/*
  Warnings:

  - A unique constraint covering the columns `[tryout_attempt_id,question_id]` on the table `UserAnswer` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TryoutStatus" AS ENUM ('IN_PROGRESS', 'FINISHED', 'EXPIRED');

-- CreateIndex
CREATE UNIQUE INDEX "UserAnswer_tryout_attempt_id_question_id_key" ON "UserAnswer"("tryout_attempt_id", "question_id");
