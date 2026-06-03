import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const SLEEP = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Models available on this API key (verified 2026-06-02)
// Priority: gemini-2.5-flash (most capable, vision support) → gemini-2.0-flash → gemini-2.0-flash-lite
const VISION_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];

/**
 * Verification result returned by verifyDocument.
 * Each field maps to a specific verification criterion (see VERIFICATION_CRITERIA below).
 */
export interface DocumentVerificationResult {
  // Criterion 1: Document authenticity
  is_valid: boolean;
  document_type_detected: string;

  // Criterion 2: Issuer/institution
  extracted_institution: string;
  institution_type:
    | 'university'
    | 'college'
    | 'vocational'
    | 'international_org'
    | 'domestic_org'
    | 'unknown';

  // Criterion 3: Holder identity
  extracted_name: string;
  name_matches: boolean;

  // Criterion 4: Academic / professional content
  extracted_major: string | null;
  extracted_specialization: string | null;
  extracted_grade: string | null; // e.g. "Giỏi", "Khá", or null

  // Criterion 4b: Language certificate score (TOEIC, IELTS, JLPT, HSK...)
  extracted_score: string | null; // e.g. "800", "7.5", "N2", "HSK 5" — null if not applicable

  // Criterion 5: Temporal validity
  extracted_issue_date: string | null;
  extracted_expiry_date: string | null; // null = no expiry / permanent

  // Criterion 6: Credential ID
  extracted_credential_id: string | null;

  // Criterion 7: Visual authenticity signals
  has_official_seal: boolean; // Dấu đỏ / dấu nổi
  has_signature: boolean; // Chữ ký
  has_security_features: boolean; // Watermark, hologram, v.v.
  image_quality: 'clear' | 'acceptable' | 'poor';

  // Overall assessment
  confidence_score: number; // 0-100
  risk_level: 'low' | 'medium' | 'high'; // low = likely authentic
  reason: string; // Vietnamese explanation
  verification_criteria_summary: string[]; // List of passed/failed criteria
}

@Injectable()
export class AiExtractionService {
  private genAI: GoogleGenerativeAI;
  private isConfigured: boolean = false;
  private readonly logger = new Logger(AiExtractionService.name);

  constructor() {
    require('dotenv').config({ override: true });
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      this.genAI = new GoogleGenerativeAI(key);
      this.isConfigured = true;
    }
  }

  async extractTextFromLocalFile(fileUrl: string): Promise<string> {
    try {
      if (!fileUrl) return '';
      const absolutePath = path.join(process.cwd(), fileUrl);
      if (!fs.existsSync(absolutePath)) return '';

      const dataBuffer = fs.readFileSync(absolutePath);
      if (!this.isConfigured) return '';

      for (const modelName of VISION_MODELS) {
        try {
          const model = this.genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent([
            'Trích xuất toàn bộ văn bản (text) từ file PDF/Document này một cách rõ ràng và chính xác. Trả về nội dung thuần túy.',
            {
              inlineData: {
                data: dataBuffer.toString('base64'),
                mimeType: 'application/pdf',
              },
            },
          ]);
          return result.response.text().trim();
        } catch (e: any) {
          this.logger.warn(
            `[AiExtractionService] Local PDF extraction failed with ${modelName}: ${e.message}`,
          );
          await SLEEP(500);
        }
      }
      return '';
    } catch (e: any) {
      this.logger.error('Error parsing local PDF: ' + e.message);
      return '';
    }
  }

  async extractTextFromBuffer(
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    // Word (.docx, .doc) — use mammoth, no vision needed
    if (
      mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      try {
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        return result.value || '';
      } catch (e: any) {
        this.logger.error('Mammoth extraction failed: ' + e.message);
        return '';
      }
    }

    if (!this.isConfigured) return '';
    for (const modelName of VISION_MODELS) {
      try {
        const model = this.genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([
          'Trích xuất toàn bộ văn bản (text) từ file PDF/Document này một cách rõ ràng và chính xác. Trả về nội dung thuần túy.',
          { inlineData: { data: buffer.toString('base64'), mimeType } },
        ]);
        return result.response.text().trim();
      } catch (e: any) {
        this.logger.warn(
          `[AiExtractionService] Buffer extraction failed with ${modelName}: ${e.message}`,
        );
        await SLEEP(500);
      }
    }
    return '';
  }

  async extractTextFromPdfUrl(fileUrl: string): Promise<string> {
    try {
      if (!fileUrl) return '';
      const response = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
      });
      const dataBuffer = Buffer.from(response.data);
      if (!this.isConfigured) return '';

      for (const modelName of VISION_MODELS) {
        try {
          const model = this.genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent([
            'Trích xuất toàn bộ văn bản (text) từ file PDF này một cách rõ ràng và chính xác. Trả về nội dung thuần túy.',
            {
              inlineData: {
                data: dataBuffer.toString('base64'),
                mimeType: 'application/pdf',
              },
            },
          ]);
          return result.response.text().trim();
        } catch (e: any) {
          this.logger.warn(
            `[AiExtractionService] URL PDF extraction failed with ${modelName}: ${e.message}`,
          );
          await SLEEP(500);
        }
      }
      return '';
    } catch (e: any) {
      this.logger.error('Error fetching/parsing PDF: ' + e.message);
      return '';
    }
  }

  /**
   * Verifies a degree or certification document image/PDF using Gemini Vision.
   *
   * VERIFICATION CRITERIA (7 tiêu chí):
   * 1. Tính xác thực tài liệu   — Đây có thực sự là bằng cấp/chứng chỉ không?
   * 2. Đơn vị cấp               — Tên trường/tổ chức cấp, loại hình (ĐH, CĐ, quốc tế...)
   * 3. Danh tính người được cấp — Họ tên khớp với ứng viên (cho phép sai dấu)
   * 4. Nội dung học thuật/nghề  — Chuyên ngành, chuyên sâu, xếp loại
   * 5. Thời hạn hiệu lực        — Ngày cấp, ngày hết hạn (nếu có)
   * 6. Mã định danh             — Số hiệu bằng, Credential ID
   * 7. Tín hiệu xác thực trực quan — Dấu đỏ, chữ ký, watermark, hologram, chất lượng ảnh
   */
  async verifyDocument(
    buffer: Buffer,
    mimeType: string,
    expectedName: string,
    docType: 'certification' | 'degree',
  ): Promise<DocumentVerificationResult> {
    const fallback: DocumentVerificationResult = {
      is_valid: true,
      document_type_detected: docType === 'degree' ? 'Bằng cấp' : 'Chứng chỉ',
      extracted_institution: 'N/A',
      institution_type: 'unknown',
      extracted_name: expectedName,
      name_matches: true,
      extracted_major: null,
      extracted_specialization: null,
      extracted_grade: null,
      extracted_score: null,
      extracted_issue_date: null,
      extracted_expiry_date: null,
      extracted_credential_id: null,
      has_official_seal: false,
      has_signature: false,
      has_security_features: false,
      image_quality: 'acceptable',
      confidence_score: 50,
      risk_level: 'medium',
      reason: '',
      verification_criteria_summary: [],
    };

    if (!this.isConfigured) {
      this.logger.warn(
        '[AiExtractionService] Gemini API Key is not configured. Skipping AI verification.',
      );
      return {
        ...fallback,
        confidence_score: 100,
        risk_level: 'low',
        reason: 'Gemini API Key chưa được cấu hình. Bỏ qua xác minh AI.',
        verification_criteria_summary: [
          '⚠️ AI không được cấu hình — tất cả tiêu chí bị bỏ qua',
        ],
      };
    }

    const docLabel =
      docType === 'degree'
        ? 'Bằng Đại học / Cao đẳng / Trung cấp'
        : 'Chứng chỉ chuyên môn';

    const prompt = `
Bạn là chuyên gia thẩm định văn bằng, chứng chỉ tuyển dụng tại Việt Nam. Hãy phân tích tài liệu đính kèm theo ĐÚNG 7 tiêu chí bên dưới để xác định đây có phải là một "${docLabel}" hợp lệ không.

Tên ứng viên cần đối chiếu: "${expectedName}"

=== 7 TIÊU CHÍ XÁC MINH ===

[Tiêu chí 1 - Tính xác thực tài liệu]
Xác định loại tài liệu: bằng cấp thật, chứng chỉ thật, ảnh ghép/chỉnh sửa, hoặc không liên quan (ảnh selfie, phong cảnh, screenshot...).

[Tiêu chí 2 - Đơn vị cấp]
Xác định tên trường/tổ chức cấp và phân loại:
- "university": Đại học (ĐH Bách Khoa, ĐH Quốc Gia...)
- "college": Cao đẳng, Trung cấp
- "vocational": Trường nghề, Trung tâm đào tạo
- "international_org": Google, AWS, Coursera, Microsoft, Cisco...
- "domestic_org": Các tổ chức/hiệp hội trong nước
- "unknown": Không xác định được

[Tiêu chí 3 - Danh tính người được cấp]
Đọc họ tên CHÍNH XÁC trên tài liệu. So sánh với "${expectedName}":
- Coi là khớp (name_matches=true) nếu: cùng họ tên dù khác cách viết hoa/thường, có/không dấu tiếng Việt
- Ví dụ: "Trần Mạnh Dũng" = "TRAN MANH DUNG" = "trần mạnh dũng"

[Tiêu chí 4 - Nội dung học thuật/chuyên môn]
- extracted_major: Ngành học chính (Công nghệ thông tin, Kinh tế...) hoặc tên chứng chỉ
- extracted_specialization: Chuyên sâu/hướng chuyên ngành nếu có, otherwise null
- extracted_grade: Xếp loại/hạng (Xuất sắc, Giỏi, Khá, Trung bình...) hoặc null nếu không có
- extracted_score: Điểm số trên chứng chỉ ngôn ngữ (nếu có). Ví dụ:
  * TOEIC: "800" (chỉ số)
  * IELTS: "7.5" (chỉ số)
  * TOEFL iBT: "95"
  * JLPT: "N2" (cấp bậc)
  * HSK: "5" hoặc "HSK 5"
  * TOPIK: "4" hoặc "TOPIK II 4"
  * VSTEP: "B2" hoặc "C1"
  * DELF/DALF: "B2" hoặc "C1"
  * Goethe: "B2"
  * Nếu không phải chứng chỉ ngôn ngữ hoặc không có điểm/cấp bậc → null

[Tiêu chí 5 - Thời hạn hiệu lực]
- extracted_issue_date: Ngày/tháng/năm hoặc năm cấp (dạng chuỗi)
- extracted_expiry_date: Ngày hết hạn nếu có (VD: chứng chỉ CPA, chứng chỉ lái xe...). Nếu vĩnh viễn → null

[Tiêu chí 6 - Mã định danh]
Mã số bằng, số hiệu văn bằng, Credential ID, Badge ID... Nếu không thấy → null.

[Tiêu chí 7 - Tín hiệu xác thực trực quan]
- has_official_seal: Có dấu đỏ/dấu nổi của đơn vị cấp không?
- has_signature: Có chữ ký của người có thẩm quyền không?
- has_security_features: Có watermark, hologram, mã QR xác minh, hoặc các yếu tố bảo mật khác không?
- image_quality: "clear" (rõ nét, đọc được tất cả), "acceptable" (đọc được phần lớn), "poor" (mờ/tối/bị cắt)

=== ĐÁNH GIÁ TỔNG THỂ ===

confidence_score (0-100):
- 85-100: Rất tin cậy — đầy đủ thông tin, khớp tên, có dấu/chữ ký
- 70-84: Tin cậy — thiếu một số yếu tố phụ nhưng hợp lệ
- 50-69: Trung bình — thiếu dấu/chữ ký hoặc ảnh mờ
- 30-49: Thấp — tên không khớp hoặc thiếu nhiều thông tin
- 0-29: Rất thấp / nghi ngờ giả mạo

risk_level:
- "low": Tài liệu trông hợp lệ, ít nghi ngờ
- "medium": Có một số điểm cần lưu ý (ảnh mờ, thiếu dấu...)
- "high": Nghi ngờ giả mạo hoặc tài liệu không liên quan

reason: Giải thích cụ thể bằng tiếng Việt, nêu rõ điểm đạt và không đạt.

verification_criteria_summary: Mảng các chuỗi tóm tắt từng tiêu chí, dùng emoji ✅/❌/⚠️.
Ví dụ: ["✅ Tiêu chí 1: Tài liệu hợp lệ — phát hiện bằng đại học", "✅ Tiêu chí 3: Tên khớp — Trần Mạnh Dũng", "⚠️ Tiêu chí 7: Không thấy dấu đỏ rõ ràng"]

=== FORMAT TRẢ VỀ (JSON THUẦN, KHÔNG MARKDOWN) ===
{
  "is_valid": boolean,
  "document_type_detected": "string",
  "extracted_institution": "string",
  "institution_type": "university|college|vocational|international_org|domestic_org|unknown",
  "extracted_name": "string",
  "name_matches": boolean,
  "extracted_major": "string hoặc null",
  "extracted_specialization": "string hoặc null",
  "extracted_grade": "string hoặc null",
  "extracted_score": "string hoặc null (chỉ dùng cho chứng chỉ ngôn ngữ)",
  "extracted_issue_date": "string hoặc null",
  "extracted_expiry_date": "string hoặc null",
  "extracted_credential_id": "string hoặc null",
  "has_official_seal": boolean,
  "has_signature": boolean,
  "has_security_features": boolean,
  "image_quality": "clear|acceptable|poor",
  "confidence_score": number,
  "risk_level": "low|medium|high",
  "reason": "string",
  "verification_criteria_summary": ["string", ...]
}
`;

    let lastError: any = null;
    for (const modelName of VISION_MODELS) {
      try {
        this.logger.log(
          `[AiExtractionService] verifyDocument using model: ${modelName}`,
        );
        const model = this.genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: 'application/json' },
        });

        const result = await model.generateContent([
          prompt,
          { inlineData: { data: buffer.toString('base64'), mimeType } },
        ]);

        const raw = result.response.text().trim();
        const parsed = JSON.parse(raw) as DocumentVerificationResult;
        this.logger.log(
          `[AiExtractionService] verifyDocument OK — model=${modelName}, score=${parsed.confidence_score}, risk=${parsed.risk_level}`,
        );
        return parsed;
      } catch (e: any) {
        this.logger.warn(
          `[AiExtractionService] verifyDocument failed with ${modelName}: ${e.message}`,
        );
        lastError = e;
        await SLEEP(800);
      }
    }

    // --- FALLBACK TO GROQ ---
    try {
      this.logger.log(
        '[AiExtractionService] Gemini failed or rate limited. Falling back to Groq...',
      );
      const groqResult = await this.verifyDocumentWithGroq(
        buffer,
        mimeType,
        expectedName,
        docType,
      );
      if (groqResult) {
        groqResult.verification_criteria_summary.push(
          'ℹ️ Xác minh qua mô hình Groq dự phòng',
        );
        return groqResult;
      }
    } catch (groqErr: any) {
      this.logger.error(
        '[AiExtractionService] Groq fallback also failed: ' + groqErr.message,
      );
    }

    this.logger.error(
      '[AiExtractionService] All models failed for verifyDocument: ' +
        lastError?.message,
    );
    return {
      ...fallback,
      risk_level: 'medium',
      reason:
        'Lỗi trong quá trình AI phân tích tài liệu: ' +
        (lastError?.message ?? 'Unknown error'),
      verification_criteria_summary: [
        '❌ Lỗi hệ thống — không thể phân tích tài liệu',
      ],
    };
  }

  async verifyDocumentWithGroq(
    buffer: Buffer,
    mimeType: string,
    expectedName: string,
    docType: 'certification' | 'degree',
  ): Promise<DocumentVerificationResult> {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    const docLabel =
      docType === 'degree'
        ? 'Bằng Đại học / Cao đẳng / Trung cấp'
        : 'Chứng chỉ chuyên môn';
    const isImage = mimeType.startsWith('image/');

    if (isImage) {
      const base64Image = buffer.toString('base64');
      const dataUri = `data:${mimeType};base64,${base64Image}`;

      const prompt = `
Bạn là chuyên gia thẩm định văn bằng, chứng chỉ tuyển dụng tại Việt Nam. Hãy phân tích tài liệu đính kèm theo ĐÚNG 7 tiêu chí bên dưới để xác định đây có phải là một "${docLabel}" hợp lệ không.

Tên ứng viên cần đối chiếu: "${expectedName}"

=== 7 TIÊU CHÍ XÁC MINH ===
[Tiêu chí 1 - Tính xác thực tài liệu]
Xác định loại tài liệu: bằng cấp thật, chứng chỉ thật, ảnh ghép/chỉnh sửa, hoặc không liên quan (ảnh selfie, phong cảnh, screenshot...).

[Tiêu chí 2 - Đơn vị cấp]
Xác định tên trường/tổ chức cấp và phân loại:
- "university": Đại học (ĐH Bách Khoa, ĐH Quốc Gia...)
- "college": Cao đẳng, Trung cấp
- "vocational": Trường nghề, Trung tâm đào tạo
- "international_org": Google, AWS, Coursera, Microsoft, Cisco...
- "domestic_org": Các tổ chức/hiệp hội trong nước
- "unknown": Không xác định được

[Tiêu chí 3 - Danh tính người được cấp]
Đọc họ tên CHÍNH XÁC trên tài liệu. So sánh với "${expectedName}":
- Coi là khớp (name_matches=true) nếu: cùng họ tên dù khác cách viết hoa/thường, có/không dấu tiếng Việt
- Ví dụ: "Trần Mạnh Dũng" = "TRAN MANH DUNG" = "trần mạnh dũng"

[Tiêu chí 4 - Nội dung học thuật/chuyên môn]
- extracted_major: Ngành học chính hoặc tên chứng chỉ
- extracted_specialization: Chuyên sâu/hướng chuyên ngành nếu có, otherwise null
- extracted_grade: Xếp loại/hạng (Xuất sắc, Giỏi, Khá...) hoặc null
- extracted_score: Điểm số trên chứng chỉ ngôn ngữ (TOEIC:"800", IELTS:"7.5", JLPT:"N2", HSK:"5", TOPIK:"4", VSTEP:"B2", DELF:"B2", Goethe:"B2"). Không phải chứng chỉ ngôn ngữ → null.

[Tiêu chí 5 - Thời hạn hiệu lực]
- extracted_issue_date: Ngày/tháng/năm hoặc năm cấp (dạng chuỗi)
- extracted_expiry_date: Ngày hết hạn nếu có. Nếu vĩnh viễn → null

[Tiêu chí 6 - Mã định danh]
Mã số bằng, số hiệu văn bằng, Credential ID, Badge ID... Nếu không thấy → null.

[Tiêu chí 7 - Tín hiệu xác thực trực quan]
- has_official_seal: Có dấu đỏ/dấu nổi của đơn vị cấp không?
- has_signature: Có chữ ký của người có thẩm quyền không?
- has_security_features: Có watermark, hologram, mã QR xác minh, hoặc các yếu tố bảo mật khác không?
- image_quality: "clear" (rõ nét, đọc được tất cả), "acceptable" (đọc được phần lớn), "poor" (mờ/tối/bị cắt)

=== ĐÁNH GIÁ TỔNG THỂ ===
confidence_score (0-100):
- 85-100: Rất tin cậy — đầy đủ thông tin, khớp tên, có dấu/chữ ký
- 70-84: Tin cậy — thiếu một số yếu tố phụ nhưng hợp lệ
- 50-69: Trung bình — thiếu dấu/chữ ký hoặc ảnh mờ
- 30-49: Thấp — tên không khớp hoặc thiếu nhiều thông tin
- 0-29: Rất thấp / nghi ngờ giả mạo

risk_level:
- "low": Tài liệu trông hợp lệ, ít nghi ngờ
- "medium": Có một số điểm cần lưu ý (ảnh mờ, thiếu dấu...)
- "high": Nghi ngờ giả mạo hoặc tài liệu không liên quan

reason: Giải thích cụ thể bằng tiếng Việt, nêu rõ điểm đạt và không đạt.
verification_criteria_summary: Mảng các chuỗi tóm tắt từng tiêu chí, dùng emoji ✅/❌/⚠️.

=== FORMAT TRẢ VỀ ===
Trả về JSON thuần túy (không markdown, không có thẻ \`\`\`json). Cấu trúc:
{
  "is_valid": boolean,
  "document_type_detected": "string",
  "extracted_institution": "string",
  "institution_type": "university|college|vocational|international_org|domestic_org|unknown",
  "extracted_name": "string",
  "name_matches": boolean,
  "extracted_major": "string hoặc null",
  "extracted_specialization": "string hoặc null",
  "extracted_grade": "string hoặc null",
  "extracted_score": "string hoặc null (chỉ dùng cho chứng chỉ ngôn ngữ)",
  "extracted_issue_date": "string hoặc null",
  "extracted_expiry_date": "string hoặc null",
  "extracted_credential_id": "string hoặc null",
  "has_official_seal": boolean,
  "has_signature": boolean,
  "has_security_features": boolean,
  "image_quality": "clear|acceptable|poor",
  "confidence_score": number,
  "risk_level": "low|medium|high",
  "reason": "string",
  "verification_criteria_summary": ["string", ...]
}
`;

      let lastGroqError: any = null;
      for (const modelName of [
        'llama-3.2-11b-vision-preview',
        'llama-3.2-90b-vision-preview',
      ]) {
        try {
          this.logger.log(
            `[AiExtractionService] verifyDocumentWithGroq using vision model: ${modelName}`,
          );
          const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
              model: modelName,
              messages: [
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: prompt },
                    { type: 'image_url', image_url: { url: dataUri } },
                  ],
                },
              ],
              response_format: { type: 'json_object' },
              temperature: 0.1,
            },
            {
              headers: {
                Authorization: `Bearer ${groqKey}`,
                'Content-Type': 'application/json',
              },
            },
          );

          const raw = response.data.choices[0].message.content.trim();
          const parsed = JSON.parse(raw) as DocumentVerificationResult;
          this.logger.log(
            `[AiExtractionService] verifyDocumentWithGroq (Vision) OK — model=${modelName}, score=${parsed.confidence_score}`,
          );
          return parsed;
        } catch (e: any) {
          this.logger.warn(
            `[AiExtractionService] verifyDocumentWithGroq (Vision) failed with ${modelName}: ${e.message}`,
          );
          lastGroqError = e;
        }
      }
      throw lastGroqError || new Error('All Groq vision models failed');
    } else if (mimeType === 'application/pdf') {
      this.logger.log(
        '[AiExtractionService] verifyDocumentWithGroq parsing PDF text...',
      );
      const pdf = require('pdf-parse');
      const pdfData = await pdf(buffer);
      const extractedText = pdfData.text?.trim() || '';

      if (!extractedText) {
        throw new Error('PDF file has no extractable text content');
      }

      const prompt = `
Bạn là chuyên gia thẩm định văn bằng, chuyên môn tại Việt Nam. Hãy phân tích nội dung văn bản dưới đây được trích xuất từ một tài liệu PDF để xác minh xem đây có phải là một "${docLabel}" hợp lệ không.

Tên ứng viên cần đối chiếu: "${expectedName}"

NỘI DUNG TÀI LIỆU PDF:
"""
${extractedText}
"""

=== 7 TIÊU CHÍ XÁC MINH ===
[Tiêu chí 1 - Tính xác thực tài liệu]
Xác định loại tài liệu: bằng cấp thật, chứng chỉ thật, hoặc không liên quan từ nội dung chữ trích xuất.

[Tiêu chí 2 - Đơn vị cấp]
Xác định tên trường/tổ chức cấp và phân loại: "university" | "college" | "vocational" | "international_org" | "domestic_org" | "unknown".

[Tiêu chí 3 - Danh tính người được cấp]
Đọc họ tên CHÍNH XÁC trên tài liệu. So sánh với "${expectedName}": name_matches=true nếu khớp tên (không phân biệt hoa/thường, không/có dấu).

[Tiêu chí 4 - Nội dung học thuật/chuyên môn]
- extracted_major: Ngành học chính/tên chứng chỉ
- extracted_specialization: Chuyên ngành sâu nếu có
- extracted_grade: Xếp loại nếu có, nếu không → null

[Tiêu chí 5 - Thời hạn hiệu lực]
- extracted_issue_date: Ngày/tháng/năm cấp
- extracted_expiry_date: Ngày hết hạn nếu có, nếu không → null

[Tiêu chí 6 - Mã định danh]
Mã số bằng, số hiệu, Credential ID... nếu không thấy → null.

[Tiêu chí 7 - Tín hiệu xác thực trực quan]
(Vì phân tích dựa trên văn bản trích xuất, hãy dựa vào sự xuất hiện của các từ khóa như "đã ký", "hiệu trưởng", "seal", "ký thay", hoặc các dấu hiệu pháp lý trong văn bản để xác định).
- has_official_seal: Con dấu có xuất hiện hoặc ghi nhận trong văn bản
- has_signature: Có tên người ký đại diện trong văn bản
- has_security_features: Có thông tin mã QR/link kiểm tra trong văn bản
- image_quality: "clear"

=== ĐÁNH GIÁ TỔNG THỂ ===
confidence_score (0-100): Đánh giá dựa trên mức độ đầy đủ thông tin chữ trích xuất.
risk_level: "low" | "medium" | "high".
reason: Giải thích cụ thể bằng tiếng Việt.
verification_criteria_summary: Mảng các chuỗi tóm tắt kèm emoji.

=== FORMAT TRẢ VỀ ===
Trả về JSON thuần túy (không markdown, không có thẻ \`\`\`json). Cấu trúc:
{
  "is_valid": boolean,
  "document_type_detected": "string",
  "extracted_institution": "string",
  "institution_type": "university|college|vocational|international_org|domestic_org|unknown",
  "extracted_name": "string",
  "name_matches": boolean,
  "extracted_major": "string hoặc null",
  "extracted_specialization": "string hoặc null",
  "extracted_grade": "string hoặc null",
  "extracted_issue_date": "string hoặc null",
  "extracted_expiry_date": "string hoặc null",
  "extracted_credential_id": "string hoặc null",
  "has_official_seal": boolean,
  "has_signature": boolean,
  "has_security_features": boolean,
  "image_quality": "clear",
  "confidence_score": number,
  "risk_level": "low|medium|high",
  "reason": "string",
  "verification_criteria_summary": ["string", ...]
}
`;

      let lastGroqError: any = null;
      for (const modelName of [
        'llama-3.3-70b-specdec',
        'llama-3.1-8b-instant',
      ]) {
        try {
          this.logger.log(
            `[AiExtractionService] verifyDocumentWithGroq using text model: ${modelName}`,
          );
          const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
              model: modelName,
              messages: [
                {
                  role: 'user',
                  content: prompt,
                },
              ],
              response_format: { type: 'json_object' },
              temperature: 0.1,
            },
            {
              headers: {
                Authorization: `Bearer ${groqKey}`,
                'Content-Type': 'application/json',
              },
            },
          );

          const raw = response.data.choices[0].message.content.trim();
          const parsed = JSON.parse(raw) as DocumentVerificationResult;
          this.logger.log(
            `[AiExtractionService] verifyDocumentWithGroq (Text) OK — model=${modelName}, score=${parsed.confidence_score}`,
          );
          return parsed;
        } catch (e: any) {
          this.logger.warn(
            `[AiExtractionService] verifyDocumentWithGroq (Text) failed with ${modelName}: ${e.message}`,
          );
          lastGroqError = e;
        }
      }
      throw lastGroqError || new Error('All Groq text models failed');
    } else {
      throw new Error(`Unsupported mimeType for Groq fallback: ${mimeType}`);
    }
  }
}
