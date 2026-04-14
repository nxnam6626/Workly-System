'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { profileApi } from '@/lib/profile-api';

export type Step = 'upload' | 'review' | 'success';

export function useCvImport() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);

  const handleUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const response = await profileApi.extractCv(file);
      if (response && response.parsedData) {
        setParsedData(response.parsedData);
        setStep('review');
        toast.success('Bóc tách CV thành công!');
      } else {
        toast.error('Không thể bóc tách dữ liệu từ CV này. Vui lòng thử lại.');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi xử lý CV.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (data: any) => {
    setIsSaving(true);
    try {
      // Mapping fields for profile update
      // The backend updateProfile expects certain fields
      await profileApi.updateProfile({
        fullName: data.fullName,
        phone: data.phone,
        skills: data.skills.map((s: any) => ({
          skillName: typeof s === 'string' ? s : s.skillName,
          level: (typeof s === 'string' ? 'BEGINNER' : s.level) || 'BEGINNER',
        })),
        university: data.education?.[0]?.school,
        major: data.education?.[0]?.major,
        gpa: data.gpa,
      });

      // Also might need to update other parts of the profile if needed
      // but for onboarding purposes, this is the main part.

      setStep('success');
      toast.success('Hồ sơ của bạn đã được cập nhật!');
      
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
    handleUpload,
    handleSaveProfile,
    goToUpload,
  };
}
