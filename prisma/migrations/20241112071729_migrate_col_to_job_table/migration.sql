-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "appliedUserId" INTEGER;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_appliedUserId_fkey" FOREIGN KEY ("appliedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
