import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AiChatContextService {
  private readonly logger = new Logger(AiChatContextService.name);

  constructor(private readonly prisma: PrismaService) { }

  async getCandidateRagContext(userId: string): Promise<string> {
    try {
      const candidate = await this.prisma.candidate.findUnique({
        where: { userId },
        include: {
          skills: true,
          cvs: {
            where: { isMain: true },
            take: 1,
          },
        },
      });

      if (!candidate) return '';

      let context = `\n--- [VỀ ỨNG VIÊN] ---\n`;
      context += `+ Thông tin chính: ${candidate.fullName} - Chuyên ngành ${candidate.major || 'N/A'}\n`;
      context += `+ Kỹ năng (Hệ thống ghi nhận): ${candidate.skills.map((s) => s.skillName).join(', ')}\n`;

      const mainCv = candidate.cvs[0];
      if (mainCv && mainCv.parsedData) {
        const data = mainCv.parsedData as any;
        context += `\n--- [DỮ LIỆU CV THAM KHẢO] ---\n`;
        context += `+ Tóm tắt CV: "${data.summary || ''}"\n`;
        context += `+ Kỹ năng trích xuất: ${JSON.stringify(data.skills || [])}\n`;
        context += `+ Kinh nghiệm: ${JSON.stringify(data.experience || [])}\n`;
      }
      context += `\n--- [LƯU Ý QUAN TRỌNG]: Dữ liệu CV có thể đã cũ. Nếu người dùng cung cấp thông tin mới trong trò chuyện, hãy ưu tiên thông tin đó. ---\n`;

      return context;
    } catch (e: any) {
      this.logger.error(`Lỗi khi lấy Candidate Context: ${e.message}`);
      return '';
    }
  }

  async getRecruiterPlanInfo(userId: string) {
    try {
      const recruiterRecord = await this.prisma.recruiter.findUnique({
        where: { userId },
        include: { recruiterSubscription: true },
      });
      const planType = recruiterRecord?.recruiterSubscription?.planType ?? null;

      let upsellContext = '';
      if (!planType) {
        upsellContext = `
--- [THÔNG TIN GÓI DỊCH VỤ CỦA NHÀ TUYỂN DỤNG] ---
Nhà tuyển dụng này đang dùng GÓI MIỄN PHÍ (FREE).

CÁC TÍNH NĂNG HẠN CHẾ VỚI GÓI FREE:
- Không dùng tính năng tạo tin tự động bằng AI
- Không có AI Cố Vấn JD và tự động sửa JD
- Không có AI Insights & phân tích nhân sự nâng cao
- Giới hạn số lượt đăng tin và mở khóa hồ sơ

CÁC GÓI NÂNG CẤP:
- GÓI LITE: Cho phép tạo JD bằng AI, AI Cố Vấn, tăng quotas. Liên hệ đường dẫn /recruiter/billing/plans
- GÓI GROWTH: Đầy đủ tính năng: AI Insights, tự động sửa JD, không giới hạn. Liên hệ đường dẫn /recruiter/billing/plans

HƯỚNG DẪN CHO AI:
- Khi nhà tuyển dụng hỏi về tính năng nào mà họ chưa có quyền truy cập: hãy giải thích mạch lạc nhưng chuyên nghiệp rằng tính năng này có trong gói trả phí.
- Ở cuối mỗi phản hồi hữu ích: THÊM vào 1 câu gợi mở khóa tiềm năng của gói trả phí. Ví dụ: "Nếu muốn AI tự động viết JD chuẩn cho bạn, hãy thử Gói LITE trên Workly."
- Không spam, chỉ gợi ý 1 lần mỗi phản hồi và luôn giữ văn phong chuyên nghiệp.
---`;
      }

      return { planType, upsellContext };
    } catch (e) {
      this.logger.warn(`Could not fetch recruiter plan: ${e}`);
      return { planType: null, upsellContext: '' };
    }
  }
}
