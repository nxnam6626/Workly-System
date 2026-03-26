/*
  Warnings:

  - You are about to drop the column `crawlSourceId` on the `CrawlLog` table. All the data in the column will be lost.
  - You are about to drop the column `crawlSourceId` on the `JobPosting` table. All the data in the column will be lost.
  - You are about to drop the `CrawlConfig` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CrawlSource` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FilterRule` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[originalUrl]` on the table `JobPosting` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `providerName` to the `CrawlLog` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CrawlLog" DROP CONSTRAINT "CrawlLog_crawlSourceId_fkey";

-- DropForeignKey
ALTER TABLE "CrawlSource" DROP CONSTRAINT "CrawlSource_adminId_fkey";

-- DropForeignKey
ALTER TABLE "CrawlSource" DROP CONSTRAINT "CrawlSource_crawlConfigId_fkey";

-- DropForeignKey
ALTER TABLE "FilterRule" DROP CONSTRAINT "FilterRule_adminId_fkey";

-- DropForeignKey
ALTER TABLE "FilterRule" DROP CONSTRAINT "FilterRule_crawlSourceId_fkey";

-- DropForeignKey
ALTER TABLE "JobPosting" DROP CONSTRAINT "JobPosting_crawlSourceId_fkey";

-- DropIndex
DROP INDEX "JobPosting_originalUrl_crawlSourceId_key";

-- AlterTable
ALTER TABLE "CrawlLog" DROP COLUMN "crawlSourceId",
ADD COLUMN     "providerName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "JobPosting" DROP COLUMN "crawlSourceId";

-- DropTable
DROP TABLE "CrawlConfig";

-- DropTable
DROP TABLE "CrawlSource";

-- DropTable
DROP TABLE "FilterRule";

-- CreateIndex
CREATE UNIQUE INDEX "JobPosting_originalUrl_key" ON "JobPosting"("originalUrl");
