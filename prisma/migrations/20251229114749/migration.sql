/*
  Warnings:

  - The values [EXPIRED] on the enum `TryoutStatus` will be removed. If these variants are still used in the database, this will fail.
  - Changed the type of `name` on the `Subtest` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "SubtestName" AS ENUM ('PU', 'PPU', 'PBM', 'PK', 'LBI', 'LBE', 'PM');

-- AlterEnum
BEGIN;
CREATE TYPE "TryoutStatus_new" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'FINISHED');
ALTER TYPE "TryoutStatus" RENAME TO "TryoutStatus_old";
ALTER TYPE "TryoutStatus_new" RENAME TO "TryoutStatus";
DROP TYPE "public"."TryoutStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "Subtest" DROP COLUMN "name",
ADD COLUMN     "name" "SubtestName" NOT NULL;
