import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth';
import { JobFormData } from '@/types/job';

export const defaultForm: JobFormData = {
  title: '',
  description: '',
  requirements: '',
  benefits: '',
  salaryMin: '',
  salaryMax: '',
  jobType: 'FULLTIME',
  experience: 'Không yêu cầu',
  vacancies: 1,
  branchIds: [],
  hardSkills: [],
  softSkills: [],
  minExperienceYears: 0,
  jobLevel: 'STAFF',
  jobTier: 'BASIC',
  autoInviteMatches: false,
  isAiGenerated: false,
  categories: [],
};

export function usePostJob(editJobId?: string | null) {
  const router = useRouter();
  const [formData, setFormData] = useState<JobFormData>(defaultForm);
  const [initialFormData, setInitialFormData] = useState<JobFormData | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(!!editJobId);
  const [hardSkillInput, setHardSkillInput] = useState('');
  const [softSkillInput, setSoftSkillInput] = useState('');
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [userPlan, setUserPlan] = useState<string>('FREE');
  const [subscription, setSubscription] = useState<any>(null);
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [allIndustries, setAllIndustries] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const [branches, setBranches] = useState<any[]>([]);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [modResult, setModResult] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);

  const { accessToken } = useAuthStore();

  const fetchInitialData = useCallback(async () => {
    try {
      const [industriesRes, companyRes, walletRes] = await Promise.all([
        api.get('/job-postings/industries'),
        api.get('/companies/my-company'),
        api.get('/wallets/balance').catch(() => ({ data: null }))
      ]);
      setAllIndustries(Array.isArray(industriesRes.data) ? industriesRes.data : []);
      setBranches(companyRes.data.branches || []);
      setCompanyProfile(companyRes.data);
      if (walletRes.data) {
        setUserPlan(walletRes.data.subscription?.planType || 'FREE');
        setSubscription(walletRes.data.subscription || null);
      }
    } catch (error) {
      console.error('Failed to fetch initial data', error);
    }
  }, []);

  useEffect(() => {
    if (accessToken) {
      fetchInitialData();
    }
  }, [accessToken, fetchInitialData]);

  const fetchJobDetails = useCallback(async () => {
    if (!editJobId || !accessToken) return;
    setLoadingData(true);
    try {
      const { data } = await api.get(`/job-postings/${editJobId}`);
      const mappedData: JobFormData = {
        title: data.title || '',
        description: data.description || '',
        requirements: data.requirements || '',
        benefits: data.benefits || '',
        salaryMin: data.salaryMin ? String(data.salaryMin) : '',
        salaryMax: data.salaryMax ? String(data.salaryMax) : '',
        jobType: data.jobType || 'FULLTIME',
        jobLevel: data.jobLevel || 'STAFF',
        experience: data.experience || 'Không yêu cầu',
        vacancies: data.vacancies || 1,
        branchIds: data.branches?.map((b: any) => b.branchId) || [],
        hardSkills: data.structuredRequirements?.hardSkills || [],
        softSkills: data.structuredRequirements?.softSkills || [],
        minExperienceYears: data.structuredRequirements?.minExperienceYears || 0,
        jobTier: data.jobTier || 'BASIC',
        autoInviteMatches: data.autoInviteMatches || false,
        isAiGenerated: data.structuredRequirements?.isAiGenerated || false,
        categories: data.structuredRequirements?.categories || [],
      };
      setFormData(mappedData);
      setInitialFormData(mappedData);
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast.error('Không thể tải dữ liệu công việc.');
    } finally {
      setLoadingData(false);
    }
  }, [editJobId, accessToken]);

  useEffect(() => {
    if (editJobId) {
      fetchJobDetails();
    } else {
      setLoadingData(false);
    }
  }, [editJobId, fetchJobDetails]);

  const handleSuggestCategories = async () => {
    if (!formData.title) return;
    setIsSuggesting(true);
    try {
      const { data } = await api.post('/job-postings/suggest-categories', {
        title: formData.title,
        description: formData.description
      });
      setSuggestedCategories(data || []);
    } catch (error) {
      console.error('Error suggesting categories:', error);
    } finally {
      setIsSuggesting(false);
    }
  };

  const toggleCategory = (cat: string) => {
    setFormData(prev => {
      const exists = prev.categories.includes(cat);
      if (exists) {
        return { ...prev, categories: prev.categories.filter(c => c !== cat) };
      } else {
        return { ...prev, categories: [...prev.categories, cat] };
      }
    });
  };

  const handleBranchToggle = (branchId: string) => {
    setFormData(prev => {
      const updated = prev.branchIds.includes(branchId)
        ? prev.branchIds.filter(id => id !== branchId)
        : [...prev.branchIds, branchId];
      return { ...prev, branchIds: updated };
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: name === 'minExperienceYears' ? Number(value) : value }));
    }
  };

  const addSkill = (type: 'hard' | 'soft', skill: string) => {
    const key = type === 'hard' ? 'hardSkills' : 'softSkills';
    if (skill.trim() && !formData[key].includes(skill.trim())) {
      setFormData(prev => ({ ...prev, [key]: [...prev[key], skill.trim()] }));
    }
  };

  const removeSkill = (type: 'hard' | 'soft', skill: string) => {
    const key = type === 'hard' ? 'hardSkills' : 'softSkills';
    setFormData(prev => ({ ...prev, [key]: prev[key].filter(s => s !== skill) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (currentStep !== totalSteps || !accessToken) return;

    if (formData.hardSkills.length === 0) {
      toast.error('Vui lòng nhập ít nhất một kỹ năng chuyên môn!');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        salaryMin: formData.salaryMin ? Number(formData.salaryMin) : null,
        salaryMax: formData.salaryMax ? Number(formData.salaryMax) : null,
        vacancies: Number(formData.vacancies),
      };

      if (editJobId) {
        await api.patch(`/job-postings/${editJobId}`, payload);
        toast.success('Cập nhật thành công!');
      } else {
        await api.post('/job-postings', payload);
        toast.success('Gửi yêu cầu thành công! Đang chờ phê duyệt.');
      }
      router.push('/recruiter/jobs');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
    } finally {
      setSaving(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return toast.error('Vui lòng nhập yêu cầu.');
    setAiGenerating(true);
    try {
      const { data } = await api.post('/ai/generate-jd', { prompt: aiPrompt });
      if (data?.data) {
        setFormData(prev => ({
          ...prev,
          ...data.data,
          salaryMin: data.data.salaryMin ? String(data.data.salaryMin) : prev.salaryMin,
          salaryMax: data.data.salaryMax ? String(data.data.salaryMax) : prev.salaryMax,
          isAiGenerated: true,
        }));
        toast.success('AI đã tạo JD thành công!');
        setAiModalOpen(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi gọi AI.');
    } finally {
      setAiGenerating(false);
    }
  };

  const handlePreCheck = async () => {
    if (!formData.description || !formData.requirements) return toast.error('Thiếu thông tin!');
    setIsChecking(true);
    try {
      const { data } = await api.post('/job-postings/pre-check', {
        ...formData,
        salaryMin: formData.salaryMin ? Number(formData.salaryMin) : undefined,
        salaryMax: formData.salaryMax ? Number(formData.salaryMax) : undefined,
      });
      setModResult(data);
      if (data.safe && data.score >= 70) toast.success('Đạt chuẩn!');
      else if (!data.safe) toast.error(`Vi phạm: ${data.reason}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi kiểm duyệt.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (formData.title.length <= 5) return toast.error('Tiêu đề quá ngắn.');
      if (formData.categories.length === 0) return toast.error('Thiếu lĩnh vực.');
    }
    if (currentStep === 2 && formData.hardSkills.length === 0) return toast.error('Thiếu kỹ năng.');
    if (currentStep === 3 && (!formData.description || !formData.requirements)) return toast.error('Thiếu nội dung.');
    
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handlePrevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return {
    formData, setFormData, saving, loadingData, currentStep, setCurrentStep, totalSteps,
    hardSkillInput, setHardSkillInput, softSkillInput, setSoftSkillInput,
    aiModalOpen, setAiModalOpen, aiPrompt, setAiPrompt, aiGenerating,
    suggestedCategories, isSuggesting, allIndustries, branches, companyProfile, modResult, isChecking,
    toggleCategory, handleBranchToggle, handleChange, addSkill, removeSkill,
    handleSubmit, handleAiGenerate, handlePreCheck, handleNextStep, handlePrevStep,
    handleSuggestCategories, userPlan, subscription
  };
}
