/*
  Warnings:

  - You are about to drop the column `releaseDate` on the `TryOut` table. All the data in the column will be lost.
  - You are about to drop the column `scheduledEnd` on the `TryOut` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TryOut" DROP COLUMN "releaseDate",
DROP COLUMN "scheduledEnd";
