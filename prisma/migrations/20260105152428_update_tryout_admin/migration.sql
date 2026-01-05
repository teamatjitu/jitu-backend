-- DropForeignKey
ALTER TABLE "Subtest" DROP CONSTRAINT "Subtest_try_out_id_fkey";

-- AlterTable
ALTER TABLE "TryOut" ADD COLUMN     "status" "TryoutStatus" NOT NULL DEFAULT 'NOT_STARTED';

-- AddForeignKey
ALTER TABLE "Subtest" ADD CONSTRAINT "Subtest_try_out_id_fkey" FOREIGN KEY ("try_out_id") REFERENCES "TryOut"("id") ON DELETE CASCADE ON UPDATE CASCADE;
