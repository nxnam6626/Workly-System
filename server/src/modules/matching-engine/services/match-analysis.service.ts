import { Injectable } from '@nestjs/common';

@Injectable()
export class MatchAnalysisService {
  /**
   * Tạo báo cáo phân tích chi tiết cho Dashboard
   */
  generateAnalysis(
    breakdown: { 
      keywordScore: number; 
      semanticScore: number; 
      experienceScore: number;
      educationScore: number;
      hardFilterScore: number;
    } = { keywordScore: 0, semanticScore: 0, experienceScore: 0, educationScore: 0, hardFilterScore: 0 },
    details: any = { matchedSkills: [], missingSkills: [] },
  ) {
    const matchedCount = (details.matchedSkills || []).length;
    const missingCount = (details.missingSkills || []).length;

    let conclusion = '';
    if (breakdown.semanticScore > 80 && breakdown.keywordScore > 80) {
      conclusion = 'Ứng viên cực kỳ tiềm năng, kiến thức chuyên môn và từ ngữ trong hồ sơ rất sát với yêu cầu.';
    } else if (breakdown.hardFilterScore < 70) {
      conclusion = 'Ứng viên có kỹ năng tốt nhưng gặp rào cản về các điều kiện bắt buộc (Địa điểm/Lương).';
    } else if (breakdown.educationScore > 90) {
      conclusion = 'Ứng viên có nền tảng học thuật xuất sắc và chuyên ngành rất phù hợp.';
    } else if (breakdown.experienceScore < 50) {
      conclusion = 'Ứng viên tiềm năng về kỹ năng nhưng cần kiểm tra thêm về độ chín trong kinh nghiệm thực tế.';
    } else {
      conclusion = 'Hồ sơ có mức độ phù hợp trung bình, cần cân nhắc thêm qua phỏng vấn trực tiếp.';
    }

    return {
      summary: conclusion,
      skillsAnalysis: {
        matchedSkills: details.matchedSkills || [],
        missingSkills: details.missingSkills || [],
        matchRate: matchedCount / (matchedCount + missingCount || 1),
      },
      strengths: this.getStrengths(breakdown, details),
      weaknesses: this.getWeaknesses(breakdown, details),
    };
  }

  private getStrengths(breakdown: any, details: any): string[] {
    const strengths: string[] = [];
    if (breakdown.semanticScore > 80) strengths.push('Khả năng hiểu bối cảnh và yêu cầu nghiệp vụ tốt');
    if (breakdown.keywordScore > 80) strengths.push('Sở hữu các kỹ năng chuyên môn trọng tâm');
    if (breakdown.experienceScore > 80) strengths.push('Kinh nghiệm vị trí tương đương rất tốt');
    if (breakdown.educationScore > 85) strengths.push('Nền tảng giáo dục và chuyên ngành phù hợp cao');
    return strengths;
  }

  private getWeaknesses(breakdown: any, details: any): string[] {
    const weaknesses: string[] = [];
    if ((details.missingSkills || []).length > 3) {
      weaknesses.push(`Thiếu một số kỹ năng kỹ thuật trọng yếu.`);
    }
    if (breakdown.experienceScore < 60) weaknesses.push('Số năm kinh nghiệm hoặc chức danh chưa đạt chuẩn');
    if (breakdown.hardFilterScore < 80) {
       const filterDetails = details.filters || {};
       if (filterDetails.locationScore < 100) weaknesses.push('Khoảng cách địa lý hoặc yêu cầu làm việc tại chỗ');
       if (filterDetails.salaryScore < 80) weaknesses.push('Mức lương mong muốn vượt ngân sách dự kiến');
    }
    return weaknesses;
  }
}
