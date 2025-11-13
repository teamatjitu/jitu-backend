/*
  Warnings:

  - A unique constraint covering the columns `[attemptId,subtestId]` on the table `subtest_attempt` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "subtest_attempt_attemptId_subtestId_key" ON "subtest_attempt"("attemptId", "subtestId");
