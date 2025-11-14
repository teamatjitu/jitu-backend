/*
  Warnings:

  - A unique constraint covering the columns `[subtestAttemptId,soalId]` on the table `soal_attempt` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."soal_attempt_tryoutAttemptId_soalId_key";

-- CreateIndex
CREATE UNIQUE INDEX "soal_attempt_subtestAttemptId_soalId_key" ON "soal_attempt"("subtestAttemptId", "soalId");
