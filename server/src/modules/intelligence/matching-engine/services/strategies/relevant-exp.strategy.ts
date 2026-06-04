import { Injectable, Logger } from '@nestjs/common';
import {
  IMatchingStrategy,
  MatchingResult,
} from '../../interfaces/matching.interface';
import { AiService } from '@/modules/intelligence/ai/ai.service';

@Injectable()
export class RelevantExpStrategy implements IMatchingStrategy {
  private readonly logger = new Logger(RelevantExpStrategy.name);

  constructor(private readonly aiService: AiService) {}

  async calculate(job: any, cv: any): Promise<MatchingResult> {
    try {
      const jobDesc = `${job.title} ${job.description} ${job.requirements}`;

      // 1. Thu thập kinh nghiệm từ nhiều nguồn (Ưu tiên Profile thủ công)
      const candidateObj = cv.candidate;

      const profileExps = (candidateObj?.experiences || [])
        .map(
          (exp: any) =>
            `${exp.role} tại ${exp.company}: ${exp.description || ''}`,
        )
        .join('\n');

      const profileProjects = (candidateObj?.projects || [])
        .map(
          (proj: any) =>
            `${proj.projectName} (${proj.role || ''}): ${proj.description || ''}`,
        )
        .join('\n');

      const parsedExps = (
        cv.parsedData?.workHistory ||
        cv.parsedData?.experiences ||
        []
      )
        .map((exp: any) => `${exp.role || ''} ${exp.description || ''}`)
        .join('\n');

      const fullCvExp =
        `${profileExps}\n${profileProjects}\n${parsedExps}`.trim();

      if (!fullCvExp) {
        return {
          score: 0,
          details: {
            message: 'Ứng viên chưa cập nhật thông tin kinh nghiệm hoặc dự án',
          },
        };
      }

      let similarity = 0;
      let jobRequirements: string[] = [];
      let candidateExps: string[] = [];
      let matchingPoints: string[] = [];
      let scoreExplanation = '';

      try {
        // 2. Sử dụng AI để đánh giá độ liên quan ngữ nghĩa & phân tích chi tiết
        const aiRes = await this.aiService.analyzeRelevantExperience(
          jobDesc,
          fullCvExp,
        );
        similarity = aiRes.similarity;
        jobRequirements = aiRes.jobRequirements;
        candidateExps = aiRes.candidateExps;
        matchingPoints = aiRes.matchingPoints;
        scoreExplanation = aiRes.scoreExplanation || '';

        // Nếu AI trả về mảng rỗng (do lỗi ngầm trong service AI không ném ra exception),
        // ném lỗi để kích hoạt fallback logic với keyword
        if (!jobRequirements || jobRequirements.length === 0) {
          throw new Error('AI returned empty jobRequirements');
        }

        // Boosting dựa trên chức danh (đảm bảo ít nhất 80% nếu trải nghiệm có chứa toàn bộ chức danh công việc)
        const normalizeAndSplit = (text: string) => {
          return text
            .toLowerCase()
            .replace(/\bdev\b/g, 'developer')
            .replace(/\bsr\b/g, 'senior')
            .replace(/\bjr\b/g, 'junior')
            .replace(/[&/\\#,+()$~%.'":*?<>{}]/g, ' ')
            .split(' ')
            .filter((w) => w.length > 2);
        };

        const jWords = normalizeAndSplit(job.title || '');
        const expLower = fullCvExp.toLowerCase().replace(/\bdev\b/g, 'developer');
        
        const hasDirectTitleMatch = jWords.length > 0 && jWords.every((w) => expLower.includes(w));
        
        if (hasDirectTitleMatch && similarity < 0.8) {
          similarity = 0.8;
          if (!scoreExplanation) {
            scoreExplanation = 'Ứng viên từng làm vị trí tương đương với chức danh công việc đang tuyển.';
          }
        }

        // Boosting cho các trường hợp rất khớp (như ví dụ CSKH của khách hàng)
        if (similarity > 0.6) {
          similarity = Math.min(1, similarity + 0.25);
        }
      } catch (e) {
        this.logger.warn(
          `AI Relevant Experience similarity analysis failed, using keyword fallback`,
        );
        // Fallback: Keyword count simple logic
        const keyTerms = job.title
          .toLowerCase()
          .split(' ')
          .filter((w: string) => w.length > 3);
        const matchCount = keyTerms.filter((t: string) =>
          fullCvExp.toLowerCase().includes(t),
        ).length;
        similarity = Math.min(0.8, matchCount / keyTerms.length + 0.2);

        // Làm sạch title (bỏ các số như 12, hoặc ký tự thừa) để hiển thị tự nhiên hơn
        const cleanTitle = job.title.replace(/\d+/g, '').replace(/\s*-\s*$/, '').trim();

        // Tách job title thành các cụm từ (phrase) để tạo thành nhiều bullet points
        const phrases = cleanTitle
          .split(/[-/|&,()]/)
          .map((p: string) => p.trim())
          .filter((p: string) => p.length > 2);

        const baseKey = phrases.length > 0 ? phrases[0] : cleanTitle;
        const subKey = phrases.length > 1 ? phrases[1] : 'chuyên môn nghiệp vụ';

        // Sinh dữ liệu dự phòng dưới dạng danh sách (bullet points) để UI hiển thị trực quan
        jobRequirements = [
          `Kinh nghiệm chuyên sâu vị trí ${baseKey}`,
          `Nắm vững các nghiệp vụ về ${subKey}`,
          `Có kinh nghiệm thực tế trong lĩnh vực ${cleanTitle}`
        ];
        
        if (matchCount > 0) {
          const matchPercent = Math.round((matchCount / keyTerms.length) * 100);
          const matchLevel = matchPercent >= 70 ? 'phần lớn' : 'một phần';

          // Các nhận xét cho ứng viên phải mang tính khái quát, an toàn, không được tự bịa (hallucinate) 
          // ra việc ứng viên có kinh nghiệm ở baseKey/subKey nếu CV không thực sự chứa nó.
          candidateExps = [
            `Hồ sơ thể hiện kinh nghiệm làm việc có liên quan đến lĩnh vực ứng tuyển`,
            `Sở hữu các kỹ năng nền tảng phù hợp với yêu cầu của vị trí`,
            `Có sự cọ xát thực tế qua các công việc hoặc dự án trước đây`
          ];
          matchingPoints = [
            `Mức độ phân tích từ khóa chuyên môn tương đồng: ${matchPercent}%`,
            `Có sự trùng khớp về định hướng công việc và ngành nghề`,
            `Kinh nghiệm thực tế đáp ứng ${matchLevel} yêu cầu cốt lõi của vị trí`
          ];
        } else {
          candidateExps = [];
          matchingPoints = [];
        }
        
        scoreExplanation = 'Hệ thống AI hiện đang bận. Đánh giá tạm thời được nội suy dựa trên mức độ khớp từ khóa chuyên môn trong hồ sơ.';
      }

      return {
        score: Math.round(similarity * 100),
        details: {
          similarity: Math.round(similarity * 100) / 100,
          cvEvidence: fullCvExp,
          jobRequirements,
          candidateExps,
          matchingPoints,
          scoreExplanation,
          message:
            'Phân tích chiều sâu giữa trách nhiệm đã làm và yêu cầu công việc',
        },
      };
    } catch (error) {
      this.logger.error(`RelevantExp Match Error: ${error.message}`);
      return { score: 50 };
    }
  }
}
