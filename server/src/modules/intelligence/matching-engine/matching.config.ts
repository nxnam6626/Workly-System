/**
 * Ma trận Trọng số ATS (Weight Matrix) dựa trên Cấp bậc công việc
 * Tổng các giá trị trong mỗi level phải bằng 1.0 (100%)
 */
export const WEIGHT_MATRIX: Record<string, any> = {
  INTERN: {
    skills: 0.4,
    education: 0.25,
    languages: 0.15,
    jobTitle: 0.1,
    relevantExp: 0.1,
    experience: 0.0, // Thường không yêu cầu số năm
  },
  FRESHER: {
    skills: 0.4,
    education: 0.2,
    languages: 0.1,
    jobTitle: 0.1,
    relevantExp: 0.15,
    experience: 0.05,
  },
  JUNIOR: {
    skills: 0.45,
    relevantExp: 0.25,
    experience: 0.1,
    education: 0.1,
    languages: 0.05,
    jobTitle: 0.05,
  },
  MIDDLE: {
    skills: 0.35,
    relevantExp: 0.35,
    experience: 0.15,
    jobTitle: 0.05,
    education: 0.05,
    languages: 0.05,
  },
  SENIOR: {
    relevantExp: 0.4,
    skills: 0.3,
    experience: 0.15,
    jobTitle: 0.1,
    education: 0.03,
    languages: 0.02,
  },
  MANAGER: {
    relevantExp: 0.4,
    experience: 0.2,
    skills: 0.15,
    jobTitle: 0.15,
    education: 0.05,
    languages: 0.05,
  },
  DIRECTOR: {
    relevantExp: 0.45,
    experience: 0.25,
    jobTitle: 0.2,
    skills: 0.05,
    education: 0.03,
    languages: 0.02,
  },
};

/**
 * Các hằng số hình phạt (Penalty Constants)
 */
export const PENALTY = {
  LOCATION_MISMATCH: 40, // Trừ 40% nếu sai địa điểm (Tier 1)
  INDUSTRY_MISMATCH: 50, // Trừ 50% nếu sai ngành nghề (Tier 1)
  SALARY_OVER_BUDGET: 10, // Trừ tối đa 10% nếu lương vượt ngân sách (Tier 3)
};

/**
 * Trọng số mặc định nếu không tìm thấy level
 */
export const DEFAULT_WEIGHTS = WEIGHT_MATRIX.JUNIOR;
