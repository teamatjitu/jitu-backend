/*
  Warnings:

  - You are about to drop the column `subtestType` on the `soal` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `tryout` table. All the data in the column will be lost.
  - Added the required column `subtestId` to the `soal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtestAttemptId` to the `soal_attempt` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "soal" DROP COLUMN "subtestType",
ADD COLUMN     "subtestId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "soal_attempt" ADD COLUMN     "subtestAttemptId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "tryout" DROP COLUMN "duration";

-- CreateTable
CREATE TABLE "subtest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "tryoutId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subtest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subtest_attempt" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "subtestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subtest_attempt_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "subtest" ADD CONSTRAINT "subtest_tryoutId_fkey" FOREIGN KEY ("tryoutId") REFERENCES "tryout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soal" ADD CONSTRAINT "soal_subtestId_fkey" FOREIGN KEY ("subtestId") REFERENCES "subtest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subtest_attempt" ADD CONSTRAINT "subtest_attempt_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "tryout_attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subtest_attempt" ADD CONSTRAINT "subtest_attempt_subtestId_fkey" FOREIGN KEY ("subtestId") REFERENCES "subtest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soal_attempt" ADD CONSTRAINT "soal_attempt_subtestAttemptId_fkey" FOREIGN KEY ("subtestAttemptId") REFERENCES "subtest_attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
