import api from '@/lib/api';

export interface CandidateProfile {
  userId: string;
  email: string;
  status: string;
  phoneNumber?: string;
  avatar?: string;
  isEmailVerified: boolean;
  provider: string;
  createdAt: string;
  lastLogin?: string;
  candidate?: {
    candidateId: string;
    fullName: string;
    university?: string;
    major?: string;
    gpa?: number;
    cvUrl?: string;
    skills: { skillId: string; skillName: string }[];
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

export interface UpdateProfileDto {
  fullName: string;
  phone: string;
  university?: string;
  major?: string;
  gpa?: number;
  skills?: string[];
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

  updateAvatar: (file: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.patch('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
};
