'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { profileApi } from '@/lib/profile-api';
import { useAuthStore } from '@/stores/auth';

export type Step = 'upload' | 'review' | 'success';

export function useCvImport() {
  const router = useRouter();
  const { updateUser } = useAuthStore();
  const [step, setStep] = useState<Step>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<any>(null);

  const handleUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await profileApi.extractCv(file);
      if (response && response.parsedData) {
        const raw = response.parsedData;
        // Chuẩn hóa dữ liệu từ snake_case (Server) sang camelCase (Frontend)
        const normalized = {
          fullName: raw.personal_info?.full_name || '',
          email: raw.personal_info?.email || '',
          phone: raw.personal_info?.phone || '',
          summary: raw.summary || '',
          gpa: raw.personal_info?.gpa || 0,
          education: Array.isArray(raw.education) 
            ? raw.education.map((edu: any) => ({
                school: edu.school || edu.institution || '',
                major: edu.major || '',
                degree: edu.degree || ''
              }))
            : raw.education ? [{
                school: raw.education.school || raw.education.institution || '',
                major: raw.education.major || '',
                degree: raw.education.degree || ''
              }] : [],
          skills: [
            ...(raw.skills?.hard_skills || []),
            ...(raw.skills?.soft_skills || [])
          ],
          experience: (raw.experience?.roles || []).map((r: any) => ({
            company: r.company_or_project,
            role: r.job_title,
            duration: r.duration,
            description: r.description
          })),
          projects: raw.projects || [],
          desiredJob: raw.desired_job || {},
          languages: raw.languages || [],
          interests: raw.interests || [],
          otherInfo: raw.other_info || [],
          certifications: Array.isArray(raw.certifications)
            ? raw.certifications.map((c: any) => ({
                name: typeof c === 'string' ? c : c.name || '',
                organization: typeof c === 'string' ? '' : c.organization || c.issuer || '',
                issueDate: typeof c === 'string' ? '' : c.issueDate || '',
              }))
            : [],
        };

        setParsedData(normalized);
        // Fetch current profile for comparison
        try {
          const profile = await profileApi.getMe();
          setCurrentProfile(profile.candidate);
        } catch (e) {
          console.warn('Could not fetch profile for comparison', e);
        }
        setStep('review');
        
        if (response.parsedData.error_message) {
          toast.error(response.parsedData.error_message, { duration: 5000 });
        } else {
          toast.success('Bóc tách CV thành công!');
        }
      } else {
        const msg = 'Không thể bóc tách dữ liệu. Bạn có thể nhập thông tin thủ công.';
        setError(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      const errorData = err.response?.data;
      const message = errorData?.message || 'Có lỗi xảy ra khi xử lý CV.';
      
      if (errorData?.error === 'CV_INCOMPLETE' && errorData.missingFields) {
        setError({
          message,
          missingFields: errorData.missingFields
        });
      } else {
        setError(message);
      }
      
      // toast.error(typeof message === 'string' ? message : 'Dữ liệu CV không hợp lệ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualEntry = () => {
    setError(null);
    setParsedData({
      fullName: '',
      email: '',
      phone: '',
      skills: [],
      experience: [],
      education: [],
      projects: [],
      summary: '',
      gpa: 0,
    });
    setStep('review');
  };

  const handleSaveProfile = async (data: any) => {
    setIsSaving(true);
    setError(null);
    try {
      // Mapping fields for profile update
      await profileApi.updateProfile({
        fullName: data.fullName,
        phone: data.phone,
        summary: data.summary,
        desiredJob: data.desiredJob,
        skills: data.skills.map((s: any) => ({
          skillName: typeof s === 'string' ? s : s.skillName,
          level: (typeof s === 'string' ? 'BEGINNER' : s.level) || 'BEGINNER',
        })),
        experiences: data.experience.map((exp: any) => ({
          company: exp.company,
          role: exp.role,
          duration: exp.duration,
          description: exp.description || '',
        })),
        projects: data.projects.map((p: any) => ({
          projectName: p.projectName,
          role: p.role || '',
          description: p.description || '',
          technology: p.technology || '',
        })),
        university: data.education?.[0]?.school,
        major: data.education?.[0]?.major,
        gpa: data.gpa,
        certifications: data.certifications,
        degrees: (data.education || []).map((edu: any) => ({
          name: edu.degree || 'Bằng cấp',
          school: edu.school || '',
          major: edu.major || '',
          issueDate: edu.duration || ''
        })),
        languages: (data.languages || []).map((l: any) => ({
          name: l.language || l.name,
          level: l.level
        })),
        interests: data.interests || [],
        otherInfo: data.otherInfo || []
      });

      setStep('success');
      toast.success('Hồ sơ của bạn đã được cập nhật!');
      
      // Update global auth store to sync name in header immediately
      try {
        const fullProfile = await profileApi.getMe();
        updateUser(fullProfile);
      } catch (e) {
        console.warn('Failed to sync auth store after profile update', e);
      }
      
      setTimeout(() => {
        router.push('/profile');
      }, 2000);
    } catch (err: any) {
      console.error('Save error:', err);
      const msg = err.response?.data?.message || 'Không thể lưu hồ sơ.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const goToUpload = () => {
    setStep('upload');
    setError(null);
  };

  return {
    step,
    isLoading,
    isSaving,
    parsedData,
    currentProfile,
    error,
    handleUpload,
    handleSaveProfile,
    handleManualEntry,
    goToUpload,
  };
}
