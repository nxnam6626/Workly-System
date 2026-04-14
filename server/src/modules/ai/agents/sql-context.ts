export const ADMIN_SQL_SCHEMA_CONTEXT = `
Here is the strict database schema you must use to generate PostgreSQL queries. Use EXACT table and column names inside double quotes if they contain uppercase letters (Prisma requirement).

Model "User" {
  "userId" String @id
  "email" String
  "status" String ('ACTIVE' | 'LOCKED')
  "createdAt" DateTime
  "provider" String
}

Model "Candidate" {
  "candidateId" String @id
  "fullName" String
  "userId" String @unique
  "isOpenToWork" Boolean
}

Model "Company" {
  "companyId" String @id
  "companyName" String
  "verifyStatus" Int
}

Model "JobPosting" {
  "jobPostingId" String @id
  "title" String
  "status" String ('PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED')
  "createdAt" DateTime
  "companyId" String
  "viewCount" Int
}

Model "Application" {
  "applicationId" String @id
  "applyDate" DateTime
  "appStatus" String ('PENDING' | 'REVIEWED' | 'ACCEPTED' | 'REJECTED' | 'INTERVIEWING')
  "candidateId" String
  "jobPostingId" String
}

CRITICAL RULES:
1. Wrap all PascalCase table names and column names in double quotes. e.g. SELECT COUNT(*) FROM "JobPosting" WHERE status = 'APPROVED'
2. Always return the SQL string ONLY, with no backticks, no md blocks, no extra text.
3. Keep queries read-only (SELECT only - use of DELETE, UPDATE, INSERT, DROP is strictly prohibited).
`;
