export type ActionType = 'PAUSE' | 'RESUME' | 'CLOSE' | 'RENEW';
export type TabType = 'ACTIVE' | 'PENDING' | 'REJECTED' | 'PAUSED' | 'CLOSED' | 'EXPIRED';

export interface Job {
  jobPostingId: string;
  title: string;
  status: 'PENDING' | 'APPROVED' | 'EXPIRED' | 'CLOSED' | 'REJECTED' | 'PAUSED';
  jobTier: 'URGENT' | 'PROFESSIONAL' | 'BASIC';
  createdAt: string;
  refreshedAt?: string;
  matchedCount: number;
  viewCount: number;
  applications?: { createdAt: string }[];
  structuredRequirements?: {
    isAiGenerated?: boolean;
    aiFeedback?: string | string[];
    autoFixedByAI?: boolean;
  };
}
export interface JobFormData {
  title: string;
  description: string;
  requirements: string;
  benefits: string;
  salaryMin: string | number;
  salaryMax: string | number;
  jobType: string;
  experience: string;
  vacancies: number;
  branchIds: string[];
  hardSkills: string[];
  softSkills: string[];
  minExperienceYears: number;
  jobLevel: string;
  jobTier: string;
  autoInviteMatches: boolean;
  autoRejectThreshold: number | '';
  isAiGenerated: boolean;
  categories: string[];
}
