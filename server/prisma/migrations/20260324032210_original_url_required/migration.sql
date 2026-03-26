/*
  Warnings:

  - Made the column `originalUrl` on table `JobPosting` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "JobPosting" ALTER COLUMN "originalUrl" SET NOT NULL;
