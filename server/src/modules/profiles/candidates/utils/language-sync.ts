import { PrismaService } from '@/prisma/prisma.service';

/**
 * Automatically parses verified certifications of a candidate,
 * identifies any language certifications (TOEIC, IELTS, TOEFL, HSK, JLPT, TOPIK, VSTEP, DELF, Goethe, etc.),
 * and updates the candidate's `languages` JSON field to ensure accurate candidate-job matching.
 *
 * Score resolution priority:
 *  1. aiVerification.extracted_score  — extracted directly from the document image by AI
 *  2. Parse from cert.name            — e.g. "TOEIC 800" → "800"
 *  3. Empty string                    — no misleading fallback
 */
export async function syncCandidateLanguagesFromCertifications(
  candidateId: string,
  prismaClient: PrismaService | any,
) {
  // 1. Fetch all VERIFIED certifications of the candidate
  const verifiedCerts = await prismaClient.certification.findMany({
    where: {
      candidateId,
      status: 'VERIFIED',
    },
  });

  // 2. Load current languages of the candidate
  const candidate = await prismaClient.candidate.findUnique({
    where: { candidateId },
    select: { languages: true },
  });

  let currentLangs: any[] = [];
  if (candidate && candidate.languages) {
    currentLangs = Array.isArray(candidate.languages)
      ? (candidate.languages as any[])
      : JSON.parse(JSON.stringify(candidate.languages));
  }

  const newLangs = [...currentLangs];

  for (const cert of verifiedCerts) {
    const certName = cert.name.toLowerCase();
    let language = '';
    let certificate = '';
    let scoreFromName = '';

    // --- English ---
    if (certName.includes('ielts')) {
      language = 'Tiếng Anh';
      certificate = 'IELTS';
      const m = cert.name.match(/ielts\s*(\d+(\.\d+)?)/i);
      scoreFromName = m ? m[1] : '';
    } else if (certName.includes('toeic')) {
      language = 'Tiếng Anh';
      certificate = 'TOEIC';
      const m = cert.name.match(/toeic\s*(\d+)/i);
      scoreFromName = m ? m[1] : '';
    } else if (certName.includes('toefl')) {
      language = 'Tiếng Anh';
      certificate = 'TOEFL';
      const m = cert.name.match(/toefl\s*(\d+)/i);
      scoreFromName = m ? m[1] : '';
    } else if (certName.includes('vstep')) {
      language = 'Tiếng Anh';
      certificate = 'VSTEP';
      const m = cert.name.match(/vstep\s*([a-c][1-2])/i);
      scoreFromName = m ? m[1].toUpperCase() : '';
    }
    // --- Chinese ---
    else if (certName.includes('hsk')) {
      language = 'Tiếng Trung';
      certificate = 'HSK';
      const m = cert.name.match(/hsk\s*([1-6])/i);
      scoreFromName = m ? m[1] : '';
    }
    // --- Japanese ---
    else if (certName.includes('jlpt') || /\bn[1-5]\b/.test(certName)) {
      language = 'Tiếng Nhật';
      certificate = 'JLPT';
      const mLevel = cert.name.match(/n([1-5])/i);
      if (mLevel) {
        scoreFromName = `N${mLevel[1]}`;
      } else {
        const mJlpt = cert.name.match(/jlpt\s*n?([1-5])/i);
        scoreFromName = mJlpt ? `N${mJlpt[1]}` : '';
      }
    }
    // --- Korean ---
    else if (certName.includes('topik')) {
      language = 'Tiếng Hàn';
      certificate = 'TOPIK';
      const m = cert.name.match(/topik\s*i*v*([1-6])/i);
      scoreFromName = m ? m[1] : '';
    }
    // --- French ---
    else if (
      certName.includes('delf') ||
      certName.includes('dalf') ||
      certName.includes('french') ||
      certName.includes('tiếng pháp')
    ) {
      language = 'Tiếng Pháp';
      certificate = 'DELF/DALF';
      const m = cert.name.match(/(delf|dalf)\s*([a-c][1-2])/i);
      scoreFromName = m ? `${m[1].toUpperCase()} ${m[2].toUpperCase()}` : '';
    }
    // --- German ---
    else if (
      certName.includes('goethe') ||
      certName.includes('german') ||
      certName.includes('tiếng đức')
    ) {
      language = 'Tiếng Đức';
      certificate = 'Goethe';
      const m = cert.name.match(/(a[1-2]|b[1-2]|c[1-2])/i);
      scoreFromName = m ? m[1].toUpperCase() : '';
    }

    if (!language) continue;

    // --- Score resolution: AI extracted_score > parsed from name ---
    let score = '';
    const aiData = cert.aiVerification as Record<string, any> | null;
    if (aiData?.extracted_score && typeof aiData.extracted_score === 'string') {
      score = aiData.extracted_score.trim();

      // Auto-update certification name if mismatch with the score from proof (minh chứng)
      if (score && score !== scoreFromName) {
        const currentName = (cert.name || '') as string;
        let updatedName = currentName;
        if (scoreFromName) {
          const escapedOldScore = scoreFromName.replace(
            /[-/\\^$*+?.()|[\]{}]/g,
            '\\$&',
          );
          const regex = new RegExp(escapedOldScore, 'i');
          if (regex.test(currentName)) {
            updatedName = currentName.replace(regex, score);
          } else {
            updatedName = `${currentName} ${score}`;
          }
        } else {
          const lowerName = currentName.toLowerCase();
          const lowerScore = score.toLowerCase();
          if (!lowerName.includes(lowerScore)) {
            updatedName = `${currentName} ${score}`;
          }
        }

        if (updatedName !== currentName) {
          await prismaClient.certification.update({
            where: { certificationId: cert.certificationId as string },
            data: { name: updatedName },
          });
          cert.name = updatedName;
        }
      }
    } else {
      score = scoreFromName;
    }

    const newLangObj = {
      name: language,
      language,
      certificate,
      score,
      level: score ? `${certificate} ${score}` : certificate,
    };

    // Update existing entry for this language, or push new one
    const existingIdx = newLangs.findIndex(
      (l: any) =>
        (l.language || l.name || '').toLowerCase() === language.toLowerCase(),
    );

    if (existingIdx >= 0) {
      const existing = newLangs[existingIdx];
      const existingCert = existing.certificate || 'Tự đánh giá';
      // Always overwrite if the existing entry was self-assessed or if we now have certificate info
      if (existingCert === 'Tự đánh giá' || certificate) {
        newLangs[existingIdx] = newLangObj;
      }
    } else {
      newLangs.push(newLangObj);
    }
  }

  // 3. Persist updated languages
  await prismaClient.candidate.update({
    where: { candidateId },
    data: { languages: newLangs },
  });
}
