/*
  Warnings:

  - You are about to drop the column `phone` on the `Candidate` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[rawJobId]` on the table `JobPosting` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "RawJobStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED', 'IGNORED');

-- AlterTable
ALTER TABLE "Candidate" DROP COLUMN "phone";

-- AlterTable
ALTER TABLE "JobPosting" ADD COLUMN     "rawJobId" TEXT;

-- CreateTable
CREATE TABLE "RawJob" (
    "rawJobId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "title" TEXT,
    "companyName" TEXT,
    "location" TEXT,
    "originalUrl" TEXT,
    "jobType" TEXT,
    "status" "RawJobStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "lastSeenAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "RawJob_pkey" PRIMARY KEY ("rawJobId")
);

-- CreateTable
CREATE TABLE "SavedJob" (
    "savedJobId" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "candidateId" TEXT NOT NULL,
    "jobPostingId" TEXT NOT NULL,

    CONSTRAINT "SavedJob_pkey" PRIMARY KEY ("savedJobId")
);

-- CreateIndex
CREATE UNIQUE INDEX "RawJob_fingerprint_key" ON "RawJob"("fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "SavedJob_candidateId_jobPostingId_key" ON "SavedJob"("candidateId", "jobPostingId");

-- CreateIndex
CREATE UNIQUE INDEX "JobPosting_rawJobId_key" ON "JobPosting"("rawJobId");

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_rawJobId_fkey" FOREIGN KEY ("rawJobId") REFERENCES "RawJob"("rawJobId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedJob" ADD CONSTRAINT "SavedJob_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("candidateId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedJob" ADD CONSTRAINT "SavedJob_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("jobPostingId") ON DELETE RESTRICT ON UPDATE CASCADE;
