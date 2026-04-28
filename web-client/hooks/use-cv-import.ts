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
  const [currentProfile, setCurrentProfile] = useState<any>(null);

  const handleUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const response = await profileApi.extractCv(file);
      if (response && response.parsedData) {
        setParsedData(response.parsedData);
        // Fetch current profile for comparison
        try {
          const profile = await profileApi.getMe();
          setCurrentProfile(profile.candidate);
        } catch (e) {
          console.warn('Could not fetch profile for comparison', e);
        }
        setStep('review');
        
        if (response.parsedData.aiWarning) {
          toast.error(response.parsedData.aiWarning, { duration: 5000 });
        } else {
          toast.success('Bóc tách CV thành công!');
        }
      } else {
        toast.error('Không thể bóc tách dữ liệu. Bạn có thể nhập thông tin thủ công.');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      const message = error.response?.data?.message || 'Có lỗi xảy ra khi xử lý CV.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualEntry = () => {
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
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.response?.data?.message || 'Không thể lưu hồ sơ.');
    } finally {
      setIsSaving(false);
    }
  };

  const goToUpload = () => setStep('upload');

  return {
    step,
    isLoading,
    isSaving,
    parsedData,
    currentProfile,
    handleUpload,
    handleSaveProfile,
    handleManualEntry,
    goToUpload,
  };
}
