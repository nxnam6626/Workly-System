import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('=== DEBUGGING INVITATIONS ===');
  
  // Find all candidates
  const candidates = await (prisma as any).candidate.findMany({
    include: {
      user: true,
    }
  });
  console.log(`Found ${candidates.length} candidates in database.`);
  
  for (const cand of candidates) {
    console.log(`\nCandidate: ${cand.fullName} (Email: ${cand.user?.email}, ID: ${cand.candidateId})`);
    
    // Find conversations
    const conversations = await (prisma as any).conversation.findMany({
      where: { candidateId: cand.candidateId },
      include: {
        recruiter: {
          include: { company: true }
        },
        messages: {
          orderBy: { sentAt: 'desc' }
        }
      }
    });
    
    console.log(`- Conversations count: ${conversations.length}`);
    
    for (const conv of conversations) {
      console.log(`  - Conversation with Recruiter: ${conv.recruiter.fullName} (Company: ${conv.recruiter.company?.companyName})`);
      console.log(`    Messages count: ${conv.messages.length}`);
      
      for (const msg of conv.messages) {
        const hasKeyword = msg.content.includes('mời ứng tuyển') || msg.content.includes('/jobs/');
        const match = msg.content.match(/\/jobs\/([a-zA-Z0-9\-]+)/);
        
        console.log(`    [Msg ${msg.messageId}] hasKeyword: ${hasKeyword}, match: ${match ? match[1] : 'NONE'}`);
        console.log(`    Content: "${msg.content}"`);
        
        if (hasKeyword && match && match[1]) {
          const slugOrId = match[1];
          const job = await (prisma as any).jobPosting.findFirst({
            where: {
              OR: [
                { jobPostingId: slugOrId },
                { slug: slugOrId }
              ]
            }
          });
          console.log(`      Job matched with ID/Slug "${slugOrId}": ${job ? job.title : 'NOT FOUND IN DATABASE!'}`);
        }
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
