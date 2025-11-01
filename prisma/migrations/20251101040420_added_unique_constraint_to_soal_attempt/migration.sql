/*
  Warnings:

  - A unique constraint covering the columns `[tryoutAttemptId,soalId]` on the table `soal_attempt` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "soal_attempt_tryoutAttemptId_soalId_key" ON "soal_attempt"("tryoutAttemptId", "soalId");
