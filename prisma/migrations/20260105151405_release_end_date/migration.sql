/*
  Warnings:

  - Added the required column `releaseDate` to the `TryOut` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "TryOut" ADD COLUMN     "releaseDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "scheduledEnd" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "Role" "Role" NOT NULL DEFAULT 'USER';
