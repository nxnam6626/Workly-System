const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

async function run() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected to Database');

  try {
    // 1. Fix User table
    console.log('Syncing User table...');
    const userCols = [
      ['provider', 'TEXT NOT NULL DEFAULT \'LOCAL\''],
      ['providerId', 'TEXT'],
      ['lastLogin', 'TIMESTAMP(3)'],
      ['phoneNumber', 'TEXT'],
      ['avatar', 'TEXT'],
      ['isEmailVerified', 'BOOLEAN NOT NULL DEFAULT false'],
      ['updatedAt', 'TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP'],
      ['refreshToken', 'TEXT']
    ];
    for (const [col, type] of userCols) {
      await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "${col}" ${type}`).catch(e => {});
    }

    // 2. Fix Recruiter table
    console.log('Syncing Recruiter table...');
    await client.query('ALTER TABLE "Recruiter" ADD COLUMN IF NOT EXISTS "savedCandidateIds" TEXT[] DEFAULT \'{}\'').catch(e => {});

    // 3. Fix Notification table
    console.log('Syncing Notification table...');
    await client.query('ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "message" TEXT').catch(e => {});

    // 4. Fix JobPosting table
    console.log('Syncing JobPosting table...');
    await client.query('ALTER TABLE "JobPosting" ADD COLUMN IF NOT EXISTS "rawJobId" TEXT').catch(e => {});
    await client.query('ALTER TABLE "JobPosting" ADD COLUMN IF NOT EXISTS "aiReliabilityScore" DOUBLE PRECISION').catch(e => {});
    await client.query('ALTER TABLE "JobPosting" ADD COLUMN IF NOT EXISTS "approvedBy" TEXT').catch(e => {});

    // 5. Create missing tables
    console.log('Creating missing tables if not exist...');
    
    // RawJobStatus Enum
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "RawJobStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED', 'IGNORED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `).catch(e => {});

    // RawJob Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "RawJob" (
        "rawJobId" TEXT NOT NULL PRIMARY KEY,
        "source" TEXT NOT NULL,
        "fingerprint" TEXT NOT NULL UNIQUE,
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
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(e => {});

    // SavedJob Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "SavedJob" (
        "savedJobId" TEXT NOT NULL PRIMARY KEY,
        "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "candidateId" TEXT NOT NULL,
        "jobPostingId" TEXT NOT NULL
      )
    `).catch(e => {});

    // Conversation Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Conversation" (
        "conversationId" TEXT NOT NULL PRIMARY KEY,
        "candidateId" TEXT NOT NULL,
        "recruiterId" TEXT NOT NULL,
        "lastMessage" TEXT,
        "isRead" BOOLEAN NOT NULL DEFAULT false,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "userId" TEXT
      )
    `).catch(e => {});

    // Message Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Message" (
        "messageId" TEXT NOT NULL PRIMARY KEY,
        "content" TEXT NOT NULL,
        "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "isRead" BOOLEAN NOT NULL DEFAULT false,
        "conversationId" TEXT NOT NULL,
        "senderId" TEXT NOT NULL
      )
    `).catch(e => {});

    console.log('✅ DATABASE SYNC SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Error syncing database:', err);
  } finally {
    await client.end();
  }
}

run();
