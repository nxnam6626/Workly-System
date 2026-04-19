import api from '@/lib/api';

export interface CandidateProfile {
  userId: string;
  email: string;
  status: string;
  phoneNumber?: string;
  avatar?: string;
  provider: string;
  createdAt: string;
  lastLogin?: string;
  candidate?: {
    candidateId: string;
    fullName: string;
    university?: string;
    major?: string;
    gpa?: number;
    summary?: string;
    desiredJob?: any;
    isOpenToWork: boolean;
    skills: { skillId: string; skillName: string; level: string; category?: string }[];
    experiences: { experienceId: string; company: string; role: string; duration: string; description?: string }[];
    projects: { projectId: string; projectName: string; description?: string; role?: string; technology?: string }[];
    cvs: {
      cvId: string;
      cvTitle: string;
      fileUrl: string;
      isMain: boolean;
      createdAt: string;
      parsedData: any;
    }[];
    applications: any[];
  };
}

export interface SkillInput {
  skillName: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}

export interface ExperienceInput {
  company: string;
  role: string;
  duration: string;
  description?: string;
}

export interface ProjectInput {
  projectName: string;
  description: string;
  role?: string;
  technology?: string;
}

export interface UpdateProfileDto {
  fullName?: string;
  phone?: string;
  university?: string;
  major?: string;
  gpa?: number;
  summary?: string;
  desiredJob?: any;
  skills?: SkillInput[];
  experiences?: ExperienceInput[];
  projects?: ProjectInput[];
  isOpenToWork?: boolean;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export const profileApi = {
  getMe: (): Promise<CandidateProfile> =>
    api.get('/users/me').then((r) => r.data),

  updateProfile: (dto: UpdateProfileDto): Promise<CandidateProfile> =>
    api.patch('/users/me/profile', dto).then((r) => r.data),

  changePassword: (dto: ChangePasswordDto): Promise<{ message: string }> =>
    api.patch('/auth/change-password', dto).then((r) => r.data),

  setMainCv: (cvId: string): Promise<any> =>
    api.patch(`/candidates/cv/${cvId}/set-main`),

  deleteCv: (cvId: string): Promise<any> =>
    api.delete(`/candidates/cv/${cvId}`),

  updateCv: (cvId: string, data: any): Promise<any> =>
    api.patch(`/candidates/cv/${cvId}`, data),

  extractCv: (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/candidates/cv/extract', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  uploadCvOnly: (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/candidates/cv/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  updateAvatar: (file: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.patch('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
};
