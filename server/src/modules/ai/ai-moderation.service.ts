import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

const SLEEP = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const EVASION_KEYWORDS = [
  '0[1-9][0-9]{8,9}',
  'zalo', 'za loo', 'za lờ', 'zzl', 'dzalo', 'zl', 'da lo', 'zá lồ', 'zép\\s*lào', 'giấy\\s*lô', 'da\\s*lô', 'za\\s*lô', 'z\\s*a\\s*l\\s*o', 'z\\.l', 'z\\.a\\.l\\.o',
  'facebook', 'fb', 'phây', 'phở\\s*bò', 'phờ\\s*bờ', 'f\\s*b', 'fesbuk', 'face\\s*book', 'fắc\\s*búc',
  'telegram', 'tele', 'tê\\s*lê\\s*gram', 'whatsapp', 'viber', 'wechat', 'skype', 'discord', 'messenger', 'mess ',
  'tiktok', 'tóp\\s*tóp', 'tik\\s*tok', 'tíc\\s*tóc', 'tok\\s*tok', 'ig', 'insta', 'instagram', 'ins', 'youtube', 'linkedin',
  'stk', 'số\\s*tài\\s*khoản', 'chuyển\\s*khoản', 'vietcombank', 'vcb', 'techcombank', 'mbbank', 'vpbank', 'momo', 'zalopay', 'vnpay', 'chuyển\\s*tiền',
  'drive\\.google', '1drv\\.ms', 'dropbox', 'notion\\.site', 'onedrive', 'googledrive',
  'không\\s*chín', 'không\\s*ba', 'không\\s*bảy', 'không\\s*tám', 'không\\s*năm', 'sđt', 'số\\s*điện\\s*thoại', 'gọi\\s*số',
  '@gmail', '@yahoo', '@hotmail', '@outlook'
];

export const EVASION_REGEX = new RegExp(`(${EVASION_KEYWORDS.join('|')})`, 'i');

@Injectable()
export class AiModerationService {
  private genAI: GoogleGenerativeAI;
  private isConfigured: boolean = false;
  private readonly logger = new Logger(AiModerationService.name);

  constructor() {
    require('dotenv').config({ override: true });
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      this.genAI = new GoogleGenerativeAI(key);
      this.isConfigured = true;
    }
  }

  async moderateChatImageBuffer(buffer: Buffer, mimeType: string): Promise<{ isEvasion: boolean; textExtracted: string }> {
    if (!this.isConfigured) return { isEvasion: false, textExtracted: '' };
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `Trích xuất toàn bộ văn bản (text), số điện thoại, chữ viết tay, mã QR, link ứng dụng trong bức ảnh này. Liệt kê rõ ràng tất cả.`;
      
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: buffer.toString('base64'),
            mimeType: mimeType,
          },
        },
      ]);
      const extracted = result.response.text().trim();
      const normalized = extracted.replace(/[\s\.\-\_]/g, '');
      
      const isEvasion = EVASION_REGEX.test(extracted) || EVASION_REGEX.test(normalized);

      return { isEvasion, textExtracted: extracted };
    } catch (e: any) {
      this.logger.error('Failed to moderate image buffer: ' + e.message);
      return { isEvasion: false, textExtracted: '' };
    }
  }

  async moderateJobContent(
    title: string,
    description: string,
    requirements?: string,
    benefits?: string,
    hardSkills?: string[],
    jobTier: string = 'BASIC',
  ): Promise<{
    score: number;
    safe: boolean;
    flags: string[];
    reason: string;
    usedAI: boolean;
    feedback: string[];
  }> {
    if (!this.isConfigured) {
      const score = parseFloat((Math.random() * (95 - 70) + 70).toFixed(1));
      return {
        score,
        safe: true,
        flags: [],
        reason: 'AI not configured, fallback score.',
        usedAI: false,
        feedback: [],
      };
    }

    let depthInstruction = '';
    if (jobTier === 'URGENT' || jobTier === 'PROFESSIONAL') {
      depthInstruction = 'LƯU Ý ĐẶC BIÊT: Đây là tin tuyển dụng VIP (Nổi bật/Tuyển gấp). Bắt buộc nhận xét ĐẦY ĐỦ CHI TIẾT rành mạch, phân tích sâu logic kỹ năng/quyền lợi và nêu rõ ví dụ để HR cải thiện chất lượng JD.';
    } else {
      depthInstruction = 'LƯU Ý: Đây là tin tuyển dụng Thường. Chỉ cần nhận xét ngắn gọn, súc tích chỉ ra những điểm sai sót lớn nhất.';
    }

    const prompt = `Bạn là hệ thống kiểm duyệt nội dung tuyển dụng chuyên nghiệp. Trách nhiệm của bạn là phân tích tính chuẩn xác, minh bạch, chuyên nghiệp và độ an toàn của Tin Tuyển Dụng (JD), sau đó trả về chuẩn JSON thuần (tuyệt đối không dùng markdown, không bọc \`\`\`json):

TIÊU ĐỀ: ${title}
MÔ TẢ: ${description?.substring(0, 800) || ''}
YÊU CẦU: ${requirements?.substring(0, 500) || ''}
QUYỀN LỢI: ${benefits?.substring(0, 300) || ''}
KỸ NĂNG: ${(hardSkills || []).join(', ')}

PHÂN TÍCH VÀ ĐÁNH GIÁ THEO 3 TIÊU CHÍ:
1. Vi phạm nghiêm trọng (Safe = false):
- Dấu hiệu lừa đảo, đa cấp, tuyển mại dâm, cờ bạc online.
- Thu phí ứng viên (tiền cọc, tiền đồng phục, tiền tài liệu phỏng vấn).
- Phân biệt đối xử vi phạm pháp luật (tôn giáo, dân tộc, quê quán, giới tính nếu không có yếu tố đặc thù).
- Chứa nội dung quảng cáo bán hàng, spam link (không phải tuyển dụng thực).

2. Chất lượng Nội dung (Content Quality):
- Độ chi tiết: Quá sơ sài ("việc nhẹ lương cao", "inbox để trao đổi thêm") hay mô tả đầy đủ nhiệm vụ?
- Tính Logic: Yêu cầu kinh nghiệm/bằng cấp có mâu thuẫn với vị trí không? (Ví dụ Thực tập sinh đòi 3 năm KN). Mức lương có qúa phi thực tế không?
- Quyền lợi: Rõ ràng hay chỉ nói mông lung sáo rỗng ("hưởng mọi quyền lợi theo luật")?

3. Kỹ năng Trình bày (Language):
- Có sai lỗi chính tả nghiêm trọng, dùng teen-code, viết hoa/thuờng tùy tiện, văn phong thiếu chuyên nghiệp không?

${depthInstruction}

QUY TẮC CHẤM ĐIỂM (score: 0-100):
- 90-100: Tuyệt vời. Rõ ràng, ngôn từ chuyên nghiệp, minh bạch quyền lợi.
- 70-89: Tốt. Đạt mức tiêu chuẩn, tuy có vài chỗ hành văn chưa mượt hoặc quyền lợi hơi ngắn gọn.
- 50-69: Kém. JD cẩu thả, sơ sài, sai nhiều chính tả, yêu cầu lủng củng (Safe=true nhưng cần review nhắc nhở).
- <50: Vi phạm/Rác. Có yếu tố lừa đảo, thu phí, spam, cợt nhả tấu hài lơ mơ (Safe=false).

CẤU TRÚC JSON PHẢI TRẢ VỀ CHÍNH XÁC NHƯ SAU:
{"score":85,"safe":true,"flags":["thiếu mô tả chi tiết quyền lợi"],"reason":"Tóm tắt nhanh lý do chấm điểm","feedback":["Lời khuyên 1","Lời khuyên 2"]} (Lưu ý mảng feedback bắt buộc phải là Array gồm các chuỗi String)`;

    // 🥇 Priority 1: Groq
    if (process.env.GROQ_API_KEY) {
      try {
        const groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: 'You are a strict JD Moderator. Always return JSON.' }, { role: 'user', content: prompt }],
          temperature: 0.1,
          response_format: { type: "json_object" }
        }, {
          headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' }
        });
        const raw = groqRes.data.choices[0].message.content;
        const parsed = JSON.parse(raw.replace(/```json/gi, '').replace(/```/gi, '').trim());
        this.logger.log(`[AiModerationService] moderateJobContent: score=${parsed.score}, safe=${parsed.safe} (Groq)`);
        return {
          score: Math.min(100, Math.max(0, Number(parsed.score) || 70)),
          safe: parsed.safe !== false,
          flags: Array.isArray(parsed.flags) ? parsed.flags : [],
          reason: parsed.reason || '',
          feedback: Array.isArray(parsed.feedback) ? parsed.feedback : [parsed.feedback || ''],
          usedAI: true,
        };
      } catch (e: any) {
        this.logger.warn(`[AiModerationService] Groq moderateJobContent failed: ${e.message}. Falling back to Gemini...`);
      }
    }

    // 🥈 Priority 2: Gemini Fallback
    const modelsToTry = [
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-2.5-flash',
    ];
    for (const modelName of modelsToTry) {
      try {
        const model = this.genAI.getGenerativeModel({ model: modelName, generationConfig: { responseMimeType: "application/json" } });
        const result = await model.generateContent(prompt);
        const raw = result.response
          .text()
          .replace(/```json/gi, '')
          .replace(/```/gi, '')
          .trim();
        const parsed = JSON.parse(raw);
        this.logger.log(
          `[AiModerationService] moderateJobContent: score=${parsed.score}, safe=${parsed.safe} (${modelName})`,
        );
        return {
          score: Math.min(100, Math.max(0, Number(parsed.score) || 70)),
          safe: parsed.safe !== false,
          flags: Array.isArray(parsed.flags) ? parsed.flags : [],
          reason: parsed.reason || '',
          feedback: Array.isArray(parsed.feedback) ? parsed.feedback : [parsed.feedback || ''],
          usedAI: true,
        };
      } catch (e: any) {
        this.logger.warn(
          `[AiModerationService] moderateJobContent failed with ${modelName}: ${e.message?.substring(0, 80)}`,
        );
        await SLEEP(800);
      }
    }

    const fallbackScore = parseFloat(
      (Math.random() * (95 - 70) + 70).toFixed(1),
    );
    this.logger.warn(
      `[AiModerationService] moderateJobContent: All models failed, fallback score ${fallbackScore}`,
    );
    return {
      score: fallbackScore,
      safe: true,
      flags: [],
      reason: 'AI unavailable, fallback score.',
      usedAI: false,
      feedback: [],
    };
  }

  async moderateImage(
    imageInput: string,
    mimeType: string = 'image/jpeg',
    expectedType: 'face_only' | 'face_or_logo' | 'any' = 'face_or_logo',
  ): Promise<{ safe: boolean; reason: string; usedAI: boolean }> {
    if (!this.isConfigured)
      return { safe: true, reason: 'AI not configured.', usedAI: false };

    try {
      let imageData: string;

      if (imageInput.startsWith('http')) {
        const response = await axios.get(imageInput, {
          responseType: 'arraybuffer',
          timeout: 8000,
        });
        imageData = Buffer.from(response.data).toString('base64');
        const ct = response.headers['content-type'];
        if (ct) mimeType = ct.split(';')[0];
      } else {
        imageData = imageInput.replace(/^data:[^;]+;base64,/, '');
      }

      let ruleText =
        'Lưu ý: ảnh đại diện cá nhân chuyên nghiệp, logo công ty đều là HỢP LỆ.';
      if (expectedType === 'face_only') {
        ruleText =
          'RẤT QUAN TRỌNG: Đây là ảnh đại diện của Ứng viên xin việc. Bắt buộc MỘT TRONG HAI yêu cầu: (a) Phải có KHUÔN MẶT NGƯỜI rõ ràng. Hoặc (b) nếu không có khuôn mặt thì phải là một bức ảnh rất trang trọng/lịch sự để xin việc. NẾU là ảnh động vật, phong cảnh, ảnh troll, ảnh anime khiêu khích... KHÔNG CÓ MẶT NGƯỜI -> đánh dấu là KHÔNG AN TOÀN (safe: false) và ghi reason "Ảnh đại diện ứng viên nên có khuôn mặt hoặc là ảnh lịch sự!".';
      } else if (expectedType === 'face_or_logo') {
        ruleText =
          'Lưu ý: ảnh đại diện cá nhân chuyên nghiệp, khuông mặt người, logo công ty, logo doanh nghiệp đều là HỢP LỆ.';
      }

      const modelsToTry = ['gemini-2.0-flash', 'gemini-2.5-flash'];
      for (const modelName of modelsToTry) {
        try {
          const model = this.genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent([
            { inlineData: { data: imageData, mimeType: mimeType as any } },
            `Bạn là hệ thống kiểm duyệt ảnh cho nền tảng tuyển dụng. Phân tích ảnh và trả về JSON thuần:
Kiểm tra: (1) Ảnh khiêu dâm/bạo lực, (2) nội dung thù địch/phân biệt chủng tộc, (3) nội dung không phù hợp với môi trường công sở.
${ruleText}
Trả về đúng định dạng JSON: {"safe":true|false,"reason":"mô tả nếu không an toàn, hoặc OK nếu an toàn"}`,
          ]);
          const raw = result.response
            .text()
            .replace(/```json/gi, '')
            .replace(/```/gi, '')
            .trim();
          const parsed = JSON.parse(raw);
          this.logger.log(
            `[AiModerationService] moderateImage: safe=${parsed.safe} via ${modelName}`,
          );
          return {
            safe: parsed.safe !== false,
            reason: parsed.reason || 'OK',
            usedAI: true,
          };
        } catch (e: any) {
          this.logger.warn(
            `[AiModerationService] moderateImage failed with ${modelName}: ${e.message?.substring(0, 80)}`,
          );
          await SLEEP(500);
        }
      }
    } catch (e: any) {
      this.logger.warn(
        `[AiModerationService] moderateImage fetch error: ${e.message}`,
      );
    }

    return {
      safe: true,
      reason: 'AI unavailable, image allowed by default.',
      usedAI: false,
    };
  }
}
