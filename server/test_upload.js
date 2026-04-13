const fs = require('fs');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/src/app.module');
const { CvParsingService } = require('./dist/src/modules/candidates/cv-parsing.service');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const cvParsingService = app.get(CvParsingService);
  
  const pdfData = Buffer.from(
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000109 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n193\n%%EOF'
  );
  
  try {
    const text = await cvParsingService.extractTextFromPdf(pdfData);
    console.log("Extracted text:", text);
  } catch(e) {
    console.error("Extraction error:", e);
  }
  
  await app.close();
}
bootstrap();
