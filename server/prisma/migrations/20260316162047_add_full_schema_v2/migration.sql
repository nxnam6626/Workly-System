-- CreateEnum
CREATE TYPE "CrawlStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "FilterAction" AS ENUM ('EXCLUDE', 'INCLUDE');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('FULLTIME', 'PARTTIME', 'INTERNSHIP', 'CONTRACT', 'REMOTE');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('CRAWLED', 'MANUAL');

-- CreateEnum
CREATE TYPE "AppStatus" AS ENUM ('PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "CrawlConfig" (
    "crawlConfigId" TEXT NOT NULL,
    "titleSelector" TEXT NOT NULL,
    "salarySelector" TEXT,
    "descriptionSelector" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "renderJs" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CrawlConfig_pkey" PRIMARY KEY ("crawlConfigId")
);

-- CreateTable
CREATE TABLE "CrawlSource" (
    "crawlSourceId" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastCrawlAt" TIMESTAMP(3),
    "adminId" TEXT NOT NULL,
    "crawlConfigId" TEXT NOT NULL,

    CONSTRAINT "CrawlSource_pkey" PRIMARY KEY ("crawlSourceId")
);

-- CreateTable
CREATE TABLE "CrawlLog" (
    "crawlLogId" TEXT NOT NULL,
    "status" "CrawlStatus" NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "itemsProcessed" INTEGER,
    "errorMessage" TEXT,
    "crawlSourceId" TEXT NOT NULL,

    CONSTRAINT "CrawlLog_pkey" PRIMARY KEY ("crawlLogId")
);

-- CreateTable
CREATE TABLE "FilterRule" (
    "filterRuleId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "minReliabilityScore" DOUBLE PRECISION,
    "action" "FilterAction" NOT NULL,
    "adminId" TEXT NOT NULL,
    "crawlSourceId" TEXT NOT NULL,

    CONSTRAINT "FilterRule_pkey" PRIMARY KEY ("filterRuleId")
);

-- CreateTable
CREATE TABLE "Company" (
    "companyId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "taxCode" TEXT,
    "isRegistered" BOOLEAN NOT NULL DEFAULT false,
    "verifyStatus" INTEGER NOT NULL DEFAULT 0,
    "logo" TEXT,
    "banner" TEXT,
    "address" TEXT,
    "description" TEXT,
    "websiteUrl" TEXT,
    "companySize" INTEGER,
    "businessLicenseUrl" TEXT,
    "adminId" TEXT,
    "recruiterId" TEXT,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("companyId")
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "jobPostingId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requirements" TEXT,
    "benefits" TEXT,
    "salaryMin" DECIMAL(19,0),
    "salaryMax" DECIMAL(19,0),
    "currency" TEXT DEFAULT 'VND',
    "jobType" "JobType",
    "locationCity" TEXT,
    "deadline" TIMESTAMP(3),
    "status" INTEGER NOT NULL DEFAULT 1,
    "postType" "PostType" NOT NULL DEFAULT 'CRAWLED',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "originalUrl" TEXT,
    "aiReliabilityScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedBy" TEXT,
    "recruiterId" TEXT,
    "companyId" TEXT NOT NULL,
    "crawlSourceId" TEXT,

    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("jobPostingId")
);

-- CreateTable
CREATE TABLE "CV" (
    "cvId" TEXT NOT NULL,
    "cvTitle" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "candidateId" TEXT NOT NULL,

    CONSTRAINT "CV_pkey" PRIMARY KEY ("cvId")
);

-- CreateTable
CREATE TABLE "Application" (
    "applicationId" TEXT NOT NULL,
    "applyDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appStatus" "AppStatus" NOT NULL DEFAULT 'PENDING',
    "cvSnapshotUrl" TEXT NOT NULL,
    "coverLetter" TEXT,
    "feedback" TEXT,
    "candidateId" TEXT NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "cvId" TEXT NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("applicationId")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "conversationId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "lastMessage" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("conversationId")
);

-- CreateTable
CREATE TABLE "Message" (
    "messageId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("messageId")
);

-- CreateIndex
CREATE UNIQUE INDEX "CrawlSource_crawlConfigId_key" ON "CrawlSource"("crawlConfigId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_taxCode_key" ON "Company"("taxCode");

-- CreateIndex
CREATE UNIQUE INDEX "JobPosting_originalUrl_crawlSourceId_key" ON "JobPosting"("originalUrl", "crawlSourceId");

-- AddForeignKey
ALTER TABLE "CrawlSource" ADD CONSTRAINT "CrawlSource_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("adminId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrawlSource" ADD CONSTRAINT "CrawlSource_crawlConfigId_fkey" FOREIGN KEY ("crawlConfigId") REFERENCES "CrawlConfig"("crawlConfigId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrawlLog" ADD CONSTRAINT "CrawlLog_crawlSourceId_fkey" FOREIGN KEY ("crawlSourceId") REFERENCES "CrawlSource"("crawlSourceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FilterRule" ADD CONSTRAINT "FilterRule_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("adminId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FilterRule" ADD CONSTRAINT "FilterRule_crawlSourceId_fkey" FOREIGN KEY ("crawlSourceId") REFERENCES "CrawlSource"("crawlSourceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("adminId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "Recruiter"("recruiterId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "Recruiter"("recruiterId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_crawlSourceId_fkey" FOREIGN KEY ("crawlSourceId") REFERENCES "CrawlSource"("crawlSourceId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CV" ADD CONSTRAINT "CV_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("candidateId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("candidateId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("jobPostingId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "CV"("cvId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("candidateId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "Recruiter"("recruiterId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("conversationId") ON DELETE RESTRICT ON UPDATE CASCADE;
