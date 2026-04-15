const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Find where "enum CrawlStatus {" starts
const startIdx = content.indexOf('enum CrawlStatus {');

if (startIdx > -1) {
    const keepStart = content.slice(0, Math.max(0, startIdx));
    
    // Now just append all the enums correctly
    const enums = `enum CrawlStatus {
  RUNNING
  SUCCESS
  FAILED
}

enum FilterAction {
  EXCLUDE
  INCLUDE
}

enum JobType {
  FULLTIME
  PARTTIME
  INTERNSHIP
}

enum PostType {
  CRAWLED
  MANUAL
}

enum AppStatus {
  PENDING
  REVIEWED
  ACCEPTED
  REJECTED
  INTERVIEWING
}

enum JobStatus {
  PENDING
  APPROVED
  REJECTED
  EXPIRED
  CLOSED
}

enum RawJobStatus {
  PENDING
  PROCESSED
  FAILED
  IGNORED
}

enum SkillLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}

enum PlanType {
  LITE
  GROWTH
}

enum JobTier {
  BASIC
  PROFESSIONAL
  URGENT
}

enum TransactionType {
  DEPOSIT
  BUY_PACKAGE
  POST_JOB
  OPEN_CV
}

enum SupportStatus {
  OPEN
  IN_PROGRESS
  CLOSED
}

model AiQueryCache {
  id String @id @default(uuid())
  query String @unique
  response String @db.Text
  createdAt DateTime @default(now())
}
`;
    fs.writeFileSync('prisma/schema.prisma', keepStart + enums, 'utf8');
    console.log("Fixed schema");
} else {
    console.log("Could not find start index");
}
