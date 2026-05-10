import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { CandidateCvService } from './src/modules/profiles/candidates/services/candidate-cv.service';
import * as crypto from 'crypto';

async function main() {
  console.log('--- INITIALIZING NEST APP CONTEXT ---');
  const app = await NestFactory.createApplicationContext(AppModule);
  const cvService = app.get(CandidateCvService);

  // User with existing CV in db: Looked up via previously shown query, it exists!
  // I will retrieve the userId from candidate row for stability.
  const { PrismaService } = require('./src/prisma/prisma.service');
  const prisma = app.get(PrismaService);
  const existingCv = await prisma.cV.findFirst({ include: { candidate: true } });
  
  if (!existingCv) {
      console.error('No test CV found in DB.');
      process.exit(1);
  }

  const userId = existingCv.candidate.userId;
  console.log(`Simulating upload for user: ${userId}`);

  // Construct dummy file buffer that hashes EXACTLY to 'bfe0d960e8db858f2ad5d8d23161677d'
  // Wait, since I cannot generate exact buffer from hash, I will just mock the incoming file.buffer 
  // to actually contain whatever random bits, but I will locally calculate hash then inject that into service call?
  // NO. I must ensure the service computes EXACT HASH matching what's in DB.
  // Wait! If I just get any random buffer, the hash won't match.
  // So how can I FORCE a match?
  // I can temporarily UPDATE the DB record's fileHash to match MY TEST BUFFER'S HASH!
  
  const testBuffer = Buffer.from('Antigravity Test File Content 123');
  const testHash = crypto.createHash('md5').update(testBuffer).digest('hex');
  
  console.log(`Computed test hash: ${testHash}`);
  console.log(`Updating DB CV record temporarily to match test hash...`);
  await prisma.cV.update({ where: { cvId: existingCv.cvId }, data: { fileHash: testHash } });

  try {
      console.log('Calling extractAndAnalyzeCv with matching test content...');
      const mockFile = {
          buffer: testBuffer,
          mimetype: 'application/pdf',
          originalname: 'test.pdf'
      } as any;
      
      await cvService.extractAndAnalyzeCv(userId, mockFile);
      console.log('FAILED: Service DID NOT throw exception for duplicate hash!');
  } catch (err: any) {
      console.log('SUCCESS: Service THREW exception!');
      console.log('Caught Exception Object Status:', err.status);
      console.log('Caught Exception Object Body:', JSON.stringify(err.response, null, 2));
  } finally {
      // Restore original hash
      await prisma.cV.update({ where: { cvId: existingCv.cvId }, data: { fileHash: existingCv.fileHash } });
      await app.close();
  }
}

main().catch(console.error);
