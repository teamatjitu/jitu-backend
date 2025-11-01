-- AlterTable
ALTER TABLE "tryout_attempt" ADD COLUMN     "isFinished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rawScore" INTEGER,
ADD COLUMN     "scaledScore" INTEGER;
