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
    jobSearchExpiresAt?: string | null;
    gender?: string;
    birthYear?: number;
    location?: string;
    totalYearsExp?: number;
    currentSalary?: string;
    degree?: string;
    industries?: string[];
    languages?: { name: string; level: string }[];
    softSkills?: string[];
    interests?: string[];
    otherInfo?: { header: string; content: string }[];
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
    certifications: {
      certificationId: string;
      name: string;
      issuer?: string;
      issueDate?: string;
      credentialId?: string;
      credentialUrl?: string;
      fileUrl?: string;
      status?: string;
      adminFeedback?: string;
    }[];
    degrees: {
      degreeId: string;
      name: string;
      school: string;
      major?: string;
      issueDate?: string;
      fileUrl?: string;
      status?: string;
      issuer?: string;
      credentialId?: string;
      adminFeedback?: string;
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

export interface DegreeInput {
  name: string;
  school: string;
  major?: string;
  issueDate?: string;
  credentialId?: string;
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
  location?: string;
  totalYearsExp?: number;
  isOpenToWork?: boolean;
  jobSearchExpiresAt?: string | null;
  gender?: string;
  birthYear?: number;
  currentSalary?: string;
  degree?: string;
  industries?: string[];
  languages?: { name: string; level: string }[];
  softSkills?: string[];
  interests?: string[];
  otherInfo?: { header: string; content: string }[];
  certifications?: {
    name: string;
    organization?: string;
    issueDate?: string;
    credentialId?: string;
    credentialUrl?: string;
  }[];
  degrees?: DegreeInput[];
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export const profileApi = {
  getMe: (): Promise<CandidateProfile> =>
    api.get('/users/me').then((r) => r.data),

  updateProfile: (dto: UpdateProfileDto): Promise<CandidateProfile> =>
    api.patch('/candidates/me/profile', dto).then((r) => r.data),

  changePassword: (dto: ChangePasswordDto): Promise<{ message: string }> =>
    api.patch('/auth/change-password', dto).then((r) => r.data),

  setMainCv: (cvId: string): Promise<any> =>
    api.patch(`/candidates/cv/${cvId}/set-main`),

  deleteCv: (cvId: string): Promise<any> =>
    api.delete(`/candidates/cv/${cvId}`),

  updateCv: (cvId: string, data: any): Promise<any> =>
    api.patch(`/candidates/cv/${cvId}`, data),

  analyzeCv: (cvId: string): Promise<any> =>
    api.post(`/candidates/cv/${cvId}/analyze`).then((r) => r.data),

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

  verifyCertification: (id: string, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/candidates/certifications/${id}/verify`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  verifyDegree: (id: string, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/candidates/degrees/${id}/verify`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  syncDegree: (id: string): Promise<CandidateProfile> =>
    api.post(`/candidates/degrees/${id}/sync`).then((r) => r.data),

  getPendingVerifications: (): Promise<any> =>
    api.get('/admin/verifications/pending').then((r) => r.data),

  actionCertificationVerification: (id: string, action: 'APPROVE' | 'REJECT', feedback?: string): Promise<any> =>
    api.post(`/admin/verifications/certifications/${id}/action`, { action, feedback }).then((r) => r.data),

  actionDegreeVerification: (id: string, action: 'APPROVE' | 'REJECT', feedback?: string): Promise<any> =>
    api.post(`/admin/verifications/degrees/${id}/action`, { action, feedback }).then((r) => r.data),
};
