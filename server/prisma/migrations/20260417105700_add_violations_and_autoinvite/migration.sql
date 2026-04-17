-- Add missing columns to production database
-- Migration: add_violations_and_autoinvite

-- Add violations column to User table (if not exists)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "violations" INTEGER NOT NULL DEFAULT 0;

-- Add autoInviteMatches column to JobPosting table (if not exists)
ALTER TABLE "JobPosting" ADD COLUMN IF NOT EXISTS "autoInviteMatches" BOOLEAN NOT NULL DEFAULT false;

-- Add JobMatch table (if not exists)
CREATE TABLE IF NOT EXISTS "JobMatch" (
    "matchId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "matchedSkills" TEXT[],
    "candidateId" TEXT NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobMatch_pkey" PRIMARY KEY ("matchId")
);

-- Add unique constraint for JobMatch (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'JobMatch_candidateId_jobPostingId_key'
    ) THEN
        ALTER TABLE "JobMatch" ADD CONSTRAINT "JobMatch_candidateId_jobPostingId_key" UNIQUE ("candidateId", "jobPostingId");
    END IF;
END $$;

-- Add AiQueryCache table (if not exists)
CREATE TABLE IF NOT EXISTS "AiQueryCache" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiQueryCache_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint for AiQueryCache (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'AiQueryCache_query_key'
    ) THEN
        ALTER TABLE "AiQueryCache" ADD CONSTRAINT "AiQueryCache_query_key" UNIQUE ("query");
    END IF;
END $$;

-- Add foreign keys for JobMatch (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'JobMatch_candidateId_fkey'
    ) THEN
        ALTER TABLE "JobMatch" ADD CONSTRAINT "JobMatch_candidateId_fkey"
            FOREIGN KEY ("candidateId") REFERENCES "Candidate"("candidateId") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'JobMatch_jobPostingId_fkey'
    ) THEN
        ALTER TABLE "JobMatch" ADD CONSTRAINT "JobMatch_jobPostingId_fkey"
            FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("jobPostingId") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Add missing columns to Recruiter table
ALTER TABLE "Recruiter" ADD COLUMN IF NOT EXISTS "aiInsightsCache" JSONB;
ALTER TABLE "Recruiter" ADD COLUMN IF NOT EXISTS "aiInsightsCacheKey" TEXT;
ALTER TABLE "Recruiter" ADD COLUMN IF NOT EXISTS "aiInsightsCachedAt" TIMESTAMP(3);

-- Add missing fields to RecruiterSubscription
ALTER TABLE "RecruiterSubscription" ADD COLUMN IF NOT EXISTS "canViewAIReport" BOOLEAN NOT NULL DEFAULT false;

-- Add matchedCount alias view (virtual - handled in application layer)
