export interface CvParsedData {
  is_cv: boolean;
  error_message?: string;
  personal_info: {
    full_name: string;
    email: string;
    phone: string;
    location?: string;
    gpa?: number;
  };
  summary?: string;
  categories?: string[];
  desired_job?: {
    jobTitle?: string;
    jobType?: string;
    expectedSalary?: string;
    location?: string;
  };
  education: {
    degree?: string;
    major?: string;
    school?: string;
    duration?: string;
  }[];
  certifications?: {
    name: string;
    organization?: string;
    issueDate?: string;
  }[];
  languages?: {
    language: string;
    level: string;
  }[];
  interests?: string[];
  skills: {
    hard_skills: {
      skillName: string;
      level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    }[];
    soft_skills: {
      skillName: string;
      level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    }[];
  };
  experience: {
    total_months: number;
    roles: {
      job_title: string;
      company_or_project: string;
      duration: string;
      description: string;
    }[];
  };
  projects?: {
    projectName: string;
    description: string;
    role?: string;
    technology?: string;
  }[];
  other_info?: {
    header: string;
    content: string;
  }[];
}
