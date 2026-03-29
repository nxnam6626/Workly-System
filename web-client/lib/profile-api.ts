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
};
