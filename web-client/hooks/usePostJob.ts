import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth';
import { useSocketStore } from '@/stores/socket';
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
  autoInviteMatches: true,
  autoInviteThreshold: 70,
  autoRejectThreshold: 50,
  matchMode: 'BALANCED',
  isAiGenerated: false,
  categories: [],
  slaApplicationDays: 3,
  slaInterviewDays: 5,
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

  const [processingState, setProcessingState] = useState<{
    isOpen: boolean;
    jobId: string | null;
    status: 'moderating' | 'matching' | 'inviting' | 'done';
    matchedCount: number;
    invitedCount: number;
  }>({
    isOpen: false,
    jobId: null,
    status: 'moderating',
    matchedCount: 0,
    invitedCount: 0,
  });

  const { accessToken } = useAuthStore();
  const { socket } = useSocketStore();

  useEffect(() => {
    if (!socket || !processingState.isOpen || !processingState.jobId) return;

    const handleJobMatchUpdated = (payload: { jobId: string; matchedCount: number; autoInvitedCount?: number; status?: string }) => {
      if (payload.jobId === processingState.jobId) {
        const willInvite = formData.autoInviteMatches && (payload.autoInvitedCount ?? 0) > 0;
        
        setProcessingState(prev => {
          // Nếu backend gửi event completed, chúng ta set status là done luôn
          if (payload.status === 'completed') {
             return {
               ...prev,
               status: 'done',
               matchedCount: payload.matchedCount,
               invitedCount: payload.autoInvitedCount ?? prev.invitedCount
             };
          }
          
          // Trạng thái đang inviting
          return {
            ...prev,
            status: willInvite ? 'inviting' : 'done',
            matchedCount: payload.matchedCount
          };
        });
      }
    };

    const handleNotification = (msg: { title?: string; type?: string }) => {
      if (msg.title?.includes('Đã mời tự động') || msg.title?.includes('AI đã gửi')) {
         const countStr = msg.title.replace(/\D/g, '');
         const count = parseInt(countStr) || 0;
         setProcessingState(prev => ({
            ...prev,
            status: 'done',
            invitedCount: count
         }));
      }
    };

    socket.on('job_match_updated', handleJobMatchUpdated);
    socket.on('notification', handleNotification);

    return () => {
      socket.off('job_match_updated', handleJobMatchUpdated);
      socket.off('notification', handleNotification);
    };
  }, [socket, processingState.isOpen, processingState.jobId, formData.autoInviteMatches]);

  const fetchInitialData = useCallback(async () => {
    try {
      const [industriesRes, companyRes, walletRes] = await Promise.all([
        api.get('/job-postings/industries'),
        api.get('/companies/my-company'),
        api.get('/wallets/balance').catch(() => ({ data: null }))
      ]);
      setAllIndustries(Array.isArray(industriesRes.data) ? industriesRes.data : []);
      
      const companyBranches = companyRes.data.branches || [];
      setBranches(companyBranches);
      setCompanyProfile(companyRes.data);
      
      if (!editJobId && companyBranches.length > 0) {
        const hq = companyBranches.find((b: any) => b.isHeadquarters) || companyBranches[0];
        setFormData(prev => ({
          ...prev,
          branchIds: prev.branchIds.length > 0 ? prev.branchIds : [hq.branchId]
        }));
      }

      if (walletRes.data) {
        setUserPlan(walletRes.data.subscription?.planType || 'FREE');
        setSubscription(walletRes.data.subscription || null);
      }
    } catch (error) {
      console.error('Failed to fetch initial data', error);
    }
  }, [editJobId]);

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
        autoInviteThreshold: data.autoInviteThreshold || 70,
        autoRejectThreshold: data.autoRejectThreshold || '',
        matchMode: data.matchMode || 'BALANCED',
        isAiGenerated: data.structuredRequirements?.isAiGenerated || false,
        categories: data.structuredRequirements?.categories || [],
        slaApplicationDays: data.slaApplicationDays || 3,
        slaInterviewDays: data.slaInterviewDays || 5,
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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.title.trim().length > 3) {
        handleSuggestCategories();
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [formData.title]);

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
      setFormData(prev => {
        const newData = { ...prev, [name]: name === 'minExperienceYears' ? Number(value) : value };
        
        // Auto-sync minExperienceYears if experience dropdown changes
        if (name === 'experience') {
          if (value === 'Không yêu cầu' || value === 'Dưới 1 năm') newData.minExperienceYears = 0;
          else if (value === '1 năm') newData.minExperienceYears = 1;
          else if (value === '2 năm') newData.minExperienceYears = 2;
          else if (value === '3 năm') newData.minExperienceYears = 3;
          else if (value === '4 năm') newData.minExperienceYears = 4;
          else if (value === '5 năm') newData.minExperienceYears = 5;
          else if (value === 'Trên 5 năm') newData.minExperienceYears = 5;
        }
        
        return newData;
      });
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
      const VALID_JOB_TYPES = ['FULLTIME', 'PARTTIME', 'REMOTE'];
      const VALID_JOB_LEVELS = ['INTERN', 'STAFF', 'MANAGER', 'DIRECTOR'];

      const payload = {
        ...formData,
        // Số — chuyển null nếu rỗng
        salaryMin: formData.salaryMin ? Number(formData.salaryMin) : undefined,
        salaryMax: formData.salaryMax ? Number(formData.salaryMax) : undefined,
        vacancies: Number(formData.vacancies) || 1,
        // autoRejectThreshold = 0 là hợp lệ (không từ chối ai), cần undefined khi chưa set
        autoRejectThreshold:
          formData.autoRejectThreshold !== '' && formData.autoRejectThreshold !== undefined
            ? Number(formData.autoRejectThreshold)
            : undefined,
        autoInviteThreshold: Number(formData.autoInviteThreshold) || 70,
        // Xử lý requirements và benefits: AI có thể trả về Array, cần ép về String
        requirements: Array.isArray(formData.requirements)
          ? formData.requirements.join('\n- ')
          : typeof formData.requirements === 'string' && formData.requirements.trim()
            ? formData.requirements.trim()
            : undefined,
        benefits: Array.isArray(formData.benefits)
          ? formData.benefits.join('\n- ')
          : typeof formData.benefits === 'string' && formData.benefits.trim()
            ? formData.benefits.trim()
            : undefined,
        // Enum — guard lại nếu AI generate trả về sai giá trị
        jobType: VALID_JOB_TYPES.includes(formData.jobType) ? formData.jobType : undefined,
        jobLevel: VALID_JOB_LEVELS.includes(formData.jobLevel) ? formData.jobLevel : undefined,
      };

      if (editJobId) {
        await api.patch(`/job-postings/${editJobId}`, payload);
        toast.success('Cập nhật thành công!');
        router.push('/recruiter/jobs');
      } else {
        const res = await api.post('/job-postings', payload);
        const createdJob = res.data;
        if (createdJob.status === 'APPROVED' || createdJob.status === 'PENDING') {
          toast.success('Đăng tin thành công!');
          router.push('/recruiter/jobs');
        } else {
          toast.success('Gửi yêu cầu thành công!');
          router.push('/recruiter/jobs');
        }
      }
    } catch (error: any) {
      const responseData = error.response?.data;
      const msg = responseData?.message;
      const status = error.response?.status;
      console.warn('[PostJob] Submit error:', { status, data: responseData, raw: error.message });
      if (Array.isArray(msg)) {
        toast.error(msg.join(' · '));
      } else if (msg) {
        toast.error(msg);
      } else if (status) {
        toast.error(`Lỗi ${status}: ${error.message}`);
      } else {
        toast.error(error.message || 'Có lỗi xảy ra!');
      }
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
          // Format arrays to strings so Textarea displays correctly
          requirements: Array.isArray(data.data.requirements) ? data.data.requirements.join('\n- ') : data.data.requirements,
          benefits: Array.isArray(data.data.benefits) ? data.data.benefits.join('\n- ') : data.data.benefits,
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
    handleSuggestCategories, userPlan, subscription,
    processingState, setProcessingState
  };
}
