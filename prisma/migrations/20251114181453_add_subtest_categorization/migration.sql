/*
  Warnings:

  - Added the required column `kategori` to the `subtest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `subtest` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "KATEGORI_SUBTEST" AS ENUM ('TES_POTENSI_SKOLASTIK', 'TES_LITERASI_BAHASA', 'PENALARAN_MATEMATIKA');

-- CreateEnum
CREATE TYPE "SUBTEST_TYPE" AS ENUM ('PU', 'PPU', 'PBM', 'PK', 'LBI', 'LBE', 'PM');

-- AlterTable
ALTER TABLE "subtest" ADD COLUMN     "kategori" "KATEGORI_SUBTEST" NOT NULL,
ADD COLUMN     "type" "SUBTEST_TYPE" NOT NULL;

-- DropEnum
DROP TYPE "public"."SUBTEST";
