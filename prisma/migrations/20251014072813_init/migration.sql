-- CreateEnum
CREATE TYPE "public"."TIPE_SOAL" AS ENUM ('PILIHAN_GANDA', 'ISIAN_SINGKAT', 'BENAR_SALAH');

-- CreateEnum
CREATE TYPE "public"."SUBTEST" AS ENUM ('KPU', 'PPU', 'KMBM', 'PK', 'LBI', 'LBE', 'PM');

-- AlterTable
ALTER TABLE "public"."account" ADD COLUMN     "isPremium" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."tryout" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3) NOT NULL,
    "isClosed" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tryout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."soal" (
    "id" TEXT NOT NULL,
    "tryoutId" TEXT NOT NULL,
    "subtestType" "public"."SUBTEST" NOT NULL,
    "tipeSoal" "public"."TIPE_SOAL" NOT NULL,
    "question" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "soal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."opsi" (
    "id" TEXT NOT NULL,
    "soalId" TEXT NOT NULL,
    "teks" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opsi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pembahasan_soal" (
    "id" TEXT NOT NULL,
    "soalId" TEXT NOT NULL,
    "pembahasan" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pembahasan_soal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tryout_attempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tryoutId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "tryout_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."soal_attempt" (
    "id" TEXT NOT NULL,
    "tryoutAttemptId" TEXT NOT NULL,
    "soalId" TEXT NOT NULL,
    "jawaban" TEXT,
    "isCorrect" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "soal_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pembahasan_soal_soalId_key" ON "public"."pembahasan_soal"("soalId");

-- AddForeignKey
ALTER TABLE "public"."soal" ADD CONSTRAINT "soal_tryoutId_fkey" FOREIGN KEY ("tryoutId") REFERENCES "public"."tryout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."opsi" ADD CONSTRAINT "opsi_soalId_fkey" FOREIGN KEY ("soalId") REFERENCES "public"."soal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pembahasan_soal" ADD CONSTRAINT "pembahasan_soal_soalId_fkey" FOREIGN KEY ("soalId") REFERENCES "public"."soal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tryout_attempt" ADD CONSTRAINT "tryout_attempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tryout_attempt" ADD CONSTRAINT "tryout_attempt_tryoutId_fkey" FOREIGN KEY ("tryoutId") REFERENCES "public"."tryout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tryout_attempt" ADD CONSTRAINT "tryout_attempt_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."soal_attempt" ADD CONSTRAINT "soal_attempt_tryoutAttemptId_fkey" FOREIGN KEY ("tryoutAttemptId") REFERENCES "public"."tryout_attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."soal_attempt" ADD CONSTRAINT "soal_attempt_soalId_fkey" FOREIGN KEY ("soalId") REFERENCES "public"."soal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
