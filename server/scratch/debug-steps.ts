import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../src/common/supabase/supabase.service';
import { CvParsingService } from '../src/modules/profiles/candidates/cv-parsing.service';
import { CandidateProfileService } from '../src/modules/profiles/candidates/services/candidate-profile.service';
import { CandidateCvService } from '../src/modules/profiles/candidates/services/candidate-cv.service';
import * as dotenv from 'dotenv';

dotenv.config();

// Create mock config service
class MockConfigService extends ConfigService {
  constructor() {
    super(process.env);
  }
  get<T = any>(key: string): T {
    return process.env[key] as any;
  }
}

async function run() {
  const connectionString = process.env.DATABASE_URL;
  console.log('Connecting to database:', connectionString ? 'Configured' : 'Missing');
  
  const pool = new Pool({ connectionString, family: 4 } as any);
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter }) as any;

  const configService = new MockConfigService();

  // Instantiate services
  const supabaseService = new SupabaseService(configService);
  (supabaseService as any).onModuleInit();

  const cvParsingService = new CvParsingService(configService);

  const candidateProfileService = new CandidateProfileService(
    null as any,
    null as any,
    null as any
  );

  const poolTest = new Pool({ connectionString, family: 4 } as any);
  const adapterTest = new PrismaPg(poolTest);
  const prismaTest = new PrismaClient({ adapter: adapterTest });
  
  // Let's find an active candidate
  const user = await prismaTest.user.findFirst({
    where: { email: 'cand_bulk1@test.com' },
    include: { candidate: true }
  });

  if (!user || !user.candidate) {
    await prismaTest.$disconnect();
    await poolTest.end();
    throw new Error('Candidate user not found in DB. Run seed first.');
  }

  console.log('Testing for candidate:', user.candidate.fullName, 'userId:', user.userId);

  candidateProfileService.findByUserId = async (id: string) => {
    return user.candidate as any;
  };
  
  // We don't need queue for matching in this basic run
  const candidateCvService = new CandidateCvService(
    prisma,
    supabaseService,
    cvParsingService,
    candidateProfileService,
    null as any, // aiExtractionService
    null as any, // notificationsService
    null as any // matchingQueue mock
  );

  try {
    // Generate a mock CV text of length > 200 to pass the length checks
    const cvText = `
    HỌ VÀ TÊN: Nguyễn Văn A
    Email: nguyen.van.a@example.com
    Số điện thoại: 0987654321
    Học vấn:
    - Cử nhân Công nghệ Thông tin, Đại học Bách Khoa (2018 - 2022)
    Kinh nghiệm làm việc:
    - Lập trình viên Node.js tại Công ty ABC (2022 - Hiện tại)
      Mô tả công việc: Phát triển hệ thống backend, tối ưu hóa cơ sở dữ liệu.
    Chứng chỉ:
    - Google Digital Garage: Fundamentals of Digital Marketing (2022)
    Kỹ năng: JavaScript, Node.js, Express, PostgreSQL
    `;

    const mockPdfBuffer = Buffer.from(cvText);
    const mockFile = {
      buffer: mockPdfBuffer,
      originalname: 'cv_test.txt', // Use txt to read directly
      mimetype: 'text/plain',
      size: mockPdfBuffer.length,
    } as any;

    console.log('Step 1: Extracting text locally...');
    const rawText = await cvParsingService.extractTextLocal(mockFile.buffer, mockFile.mimetype);
    console.log('Raw text extracted (length):', rawText.length);

    console.log('Step 2: Checking is CV...');
    const isCv = cvParsingService.validateIsCv(rawText);
    console.log('Is CV check:', isCv);

    console.log('Step 3: Uploading CV to Supabase and saving CV record...');
    const cv = await candidateCvService.uploadCvOnly(user.userId, mockFile);
    console.log('Saved CV:', cv);

    console.log('Step 4: AI Parsing from text...');
    const extractedData = await cvParsingService.parseCvFromText(rawText);
    console.log('Extracted Data:', JSON.stringify(extractedData, null, 2));

    if (extractedData) {
      console.log('Step 5: Schema validation...');
      const schemaCheck = cvParsingService.validateParsedData(extractedData);
      console.log('Schema Check:', schemaCheck);

      console.log('Step 6: Updating CV with parsedData...');
      const updated = await candidateCvService.updateCv(user.userId, cv.cvId, { parsedData: extractedData });
      console.log('Update success!', updated);
    } else {
      throw new Error('AI extraction returned null.');
    }
  } catch (error: any) {
    console.error('ERROR ENCOUNTERED:');
    console.error(error);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  } finally {
    await prismaTest.$disconnect();
    await poolTest.end();
    await prisma.$disconnect();
    await pool.end();
  }
}

run();
