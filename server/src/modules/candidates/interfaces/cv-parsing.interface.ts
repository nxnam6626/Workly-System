export interface CvParsedData {
  fullName: string;
  email: string;
  phone: string;
  skills: {
    skillName: string;
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  }[];
  experience: {
    company: string;
    role: string;
    years: number;
    description?: string;
  }[];
  education: {
    school: string;
    degree: string;
    major: string;
  }[];
  totalYearsExp: number;
  summary?: string;
  university?: string;
  major?: string;
  gpa?: number;
  projects?: {
    projectName: string;
    description: string;
    role?: string;
    technology?: string;
  }[];
}
