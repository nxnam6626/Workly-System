const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is missing in .env');
  process.exit(1);
}

async function fixDb() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected to PostgreSQL');

  try {
    // 1. Fix User table
    console.log('Checking User table...');
    const userColumns = [
      ['provider', 'TEXT NOT NULL DEFAULT \'LOCAL\''],
      ['providerId', 'TEXT'],
      ['lastLogin', 'TIMESTAMP(3)'],
      ['phoneNumber', 'TEXT'],
      ['avatar', 'TEXT'],
      ['isEmailVerified', 'BOOLEAN NOT NULL DEFAULT false'],
      ['refreshToken', 'TEXT']
    ];

    for (const [col, type] of userColumns) {
      await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "${col}" ${type}`).catch(e => console.log(`  - Skip ${col}: ${e.message}`));
    }

    // 2. Fix Recruiter table
    console.log('Checking Recruiter table...');
    await client.query('ALTER TABLE "Recruiter" ADD COLUMN IF NOT EXISTS "savedCandidateIds" TEXT[] DEFAULT \'{}\'').catch(e => console.log(`  - Skip savedCandidateIds: ${e.message}`));

    // 3. Fix Notification table
    console.log('Checking Notification table...');
    await client.query('ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "message" TEXT').catch(e => console.log(`  - Skip message: ${e.message}`));

    // 4. Create missing enums and tables from the pull
    console.log('Creating missing types and tables...');
    
    // Create RawJobStatus enum if not exists
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "RawJobStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED', 'IGNORED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `).catch(() => {});

    // Create RawJob table
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
        "updatedAt" TIMESTAMP NOT NULL
      )
    `).catch(() => {});

    // Create SavedJob table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "SavedJob" (
        "savedJobId" TEXT NOT NULL PRIMARY KEY,
        "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "candidateId" TEXT NOT NULL,
        "jobPostingId" TEXT NOT NULL
      )
    `).catch(() => {});

    // Add rawJobId to JobPosting
    await client.query('ALTER TABLE "JobPosting" ADD COLUMN IF NOT EXISTS "rawJobId" TEXT').catch(() => {});

    console.log('Database sync completed successfully!');
  } catch (err) {
    console.error('Error during sync:', err);
  } finally {
    await client.end();
  }
}

fixDb();
