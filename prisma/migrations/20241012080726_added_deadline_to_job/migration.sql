/*
  Warnings:

  - Added the required column `deadline` to the `Job` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "deadline" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "skills" SET DEFAULT ARRAY[]::TEXT[];
