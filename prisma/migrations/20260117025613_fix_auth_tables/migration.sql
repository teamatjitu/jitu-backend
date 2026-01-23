/*
  Warnings:

  - A unique constraint covering the columns `[orderId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `orderId` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Payment_userId_key";

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "orderId" TEXT NOT NULL,
ADD COLUMN     "snapToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_orderId_key" ON "Payment"("orderId");
