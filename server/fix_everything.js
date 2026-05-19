const { PrismaClient } = require('./src/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function fix() {
  const matches = await prisma.jobMatch.findMany({
    include: {
      jobPosting: true,
      candidate: {
        include: { cvs: { where: { isMain: true } } }
      }
    }
  });

  let count = 0;
  for (const match of matches) {
    const job = match.jobPosting;
    const cv = match.candidate?.cvs?.[0];
    if (!job || !cv) continue;

    // Simulate ExperienceStrategy logic
    const parsedData = cv.parsedData || {};
    const candidateYears = match.candidate.totalYearsExp ?? parsedData.yearsOfExperience ?? 0;
    
    let requiredYears = 0;
    const structuredReqs = typeof job.structuredRequirements === 'string' 
      ? JSON.parse(job.structuredRequirements) 
      : (job.structuredRequirements || {});
      
    if (structuredReqs.minExperienceYears !== undefined && structuredReqs.minExperienceYears !== null) {
      requiredYears = Number(structuredReqs.minExperienceYears) || 0;
    } else {
      requiredYears = parseInt(job.experience) || 0;
    }

    let yearScore = 0;
    if (requiredYears === 0) {
      yearScore = 100;
    } else {
      const ratio = candidateYears / requiredYears;
      if (ratio >= 1) {
        yearScore = 100;
      } else {
        yearScore = Math.max(10, Math.round(ratio * 100));
      }
    }

    // Read existing details
    const oldDetailsCol = typeof match.details === 'string' ? JSON.parse(match.details) : (match.details || {});
    
    const details = oldDetailsCol.details || {};
    details.experienceDetails = {
      yearsScore: yearScore,
      candidateYears,
      requiredYears
    };

    const breakdown = oldDetailsCol.breakdown || {};
    breakdown.experienceScore = yearScore;

    // Recalculate Final Score using existing weights
    const weights = details.weights || {
      skills: 0.45,
      jobTitle: 0.05,
      education: 0.1,
      languages: 0.05,
      experience: 0.1,
      relevantExp: 0.25
    };

    const finalScore = Math.round(
      (breakdown.skillsScore || 0) * weights.skills +
      (breakdown.jobTitleScore || 0) * weights.jobTitle +
      (breakdown.educationScore || 0) * weights.education +
      (breakdown.languageScore || 0) * weights.languages +
      (breakdown.experienceScore || 0) * weights.experience +
      (breakdown.relevantExpScore || 0) * weights.relevantExp
    );

    await prisma.jobMatch.update({
      where: { matchId: match.matchId },
      data: {
        score: finalScore,
        details: { breakdown, details }
      }
    });
    count++;
  }
  console.log(`Successfully recalculated and fixed scores for ${count} job matches.`);
}

fix()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
