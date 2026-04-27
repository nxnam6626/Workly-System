import { Injectable } from '@nestjs/common';

@Injectable()
export class MatchAnalysisService {
  /**
   * Tạo báo cáo phân tích chi tiết cho Dashboard
   */
  generateAnalysis(
    breakdown: any = {},
    details: any = {},
  ) {
    const matchedCount = (details.skillDetails?.matchedSkills || []).length;
    
    let conclusion = '';
    if (breakdown.skillsScore > 80 && breakdown.relevantExpScore > 80) {
      conclusion = 'Ứng viên cực kỳ tiềm năng, kỹ năng và kinh nghiệm thực tế rất sát với yêu cầu.';
    } else if (breakdown.locationScore === 0) {
      conclusion = 'Ứng viên có kỹ năng tốt nhưng gặp rào cản về địa điểm làm việc.';
    } else if (breakdown.educationScore > 90) {
      conclusion = 'Ứng viên có nền tảng học thuật xuất sắc và chuyên ngành rất phù hợp.';
    } else if (breakdown.experienceScore < 50) {
      conclusion = 'Ứng viên tiềm năng về kỹ năng nhưng cần kiểm tra thêm về độ chín trong kinh nghiệm.';
    } else {
      conclusion = 'Hồ sơ có mức độ phù hợp khá, cần cân nhắc thêm qua phỏng vấn trực tiếp.';
    }

    return {
      summary: conclusion,
      skillsAnalysis: {
        matchedSkills: details.skillDetails?.matchedSkills || [],
        matchRate: matchedCount / (matchedCount + 5 || 1), // Giả định trung bình 5 kỹ năng
      },
      strengths: this.getStrengths(breakdown, details),
      weaknesses: this.getWeaknesses(breakdown, details),
    };
  }

  private getStrengths(breakdown: any, details: any): string[] {
    const strengths: string[] = [];
    if (breakdown.skillsScore > 80) strengths.push('Sở hữu các kỹ năng chuyên môn trọng tâm');
    if (breakdown.relevantExpScore > 80) strengths.push('Kinh nghiệm thực tế trong các dự án tương đồng rất tốt');
    if (breakdown.experienceScore > 80) strengths.push('Kinh nghiệm vị trí tương đương rất ổn định');
    if (breakdown.educationScore > 85) strengths.push('Nền tảng giáo dục và chuyên ngành phù hợp cao');
    if (breakdown.languageScore > 80) strengths.push('Trình độ ngoại ngữ tốt, đáp ứng yêu cầu quốc tế');
    return strengths;
  }

  private getWeaknesses(breakdown: any, details: any): string[] {
    const weaknesses: string[] = [];
    if (breakdown.skillsScore < 60) {
      weaknesses.push(`Cần bổ sung thêm một số kỹ năng kỹ thuật trọng yếu.`);
    }
    if (breakdown.experienceScore < 60) {
      weaknesses.push('Số năm kinh nghiệm làm việc chưa đạt kỳ vọng');
    }
    if (breakdown.locationScore === 0) {
      weaknesses.push('Khoảng cách địa lý hoặc yêu cầu làm việc tại chỗ là một rào cản');
    }
    if (breakdown.salaryScore < 80) {
      weaknesses.push('Mức lương mong muốn đang vượt ngân sách dự kiến của công ty');
    }
    if (breakdown.industryScore === 0) {
      weaknesses.push('Kinh nghiệm chưa thuộc lĩnh vực ưu tiên của tin tuyển dụng');
    }
    return weaknesses;
  }
}
