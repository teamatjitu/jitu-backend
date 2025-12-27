/*
  Warnings:

  - Added the required column `batch` to the `TryOut` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TryoutBatch" AS ENUM ('SNBT', 'MANDIRI');

-- AlterTable
ALTER TABLE "TryOut" ADD COLUMN     "batch" "TryoutBatch" NOT NULL,
ADD COLUMN     "code" SERIAL NOT NULL;
