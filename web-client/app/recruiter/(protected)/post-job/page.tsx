'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { Briefcase, Loader2, Save, MapPin, DollarSign, Calendar, Users, Info, Clock, ChevronDown, Plus, Crown, X as CloseIcon, Sparkles, CheckCircle2, Lock, Zap, Home, Shield, Eye, Target } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth';
import { LOCATIONS } from '@/lib/constants';
import { AutoResizeTextarea } from '@/components/ui/auto-resize-textarea';

const defaultForm = {
  title: '',
  description: '',
  requirements: '',
  benefits: '',
  salaryMin: '',
  salaryMax: '',
  jobType: 'FULLTIME',
  experience: 'Không yêu cầu',
  vacancies: 1,
  branchIds: [] as string[],
  hardSkills: [] as string[],
  softSkills: [] as string[],
  minExperienceYears: 0,
  jobLevel: 'STAFF',
  jobTier: 'BASIC',
  autoInviteMatches: false,
  isAiGenerated: false,
  categories: [] as string[],
};

function PostJobForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editJobId = searchParams.get('jobId');
  const [formData, setFormData] = useState(defaultForm);
  const [initialFormData, setInitialFormData] = useState<typeof defaultForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(!!editJobId);
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  const [hardSkillInput, setHardSkillInput] = useState('');
  const [softSkillInput, setSoftSkillInput] = useState('');
  const { accessToken } = useAuthStore();
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
  const [industryMenuOpen, setIndustryMenuOpen] = useState(false);
  const [industrySearch, setIndustrySearch] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState<string | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [modResult, setModResult] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [industriesRes, companyRes] = await Promise.all([
          api.get('/job-postings/industries'),
          api.get('/companies/my-company')
        ]);
        setAllIndustries(industriesRes.data);
        setBranches(companyRes.data.branches || []);
        setCompanyProfile(companyRes.data);
      } catch (error) {
        console.error('Failed to fetch initial data', error);
      }
    };

    if (accessToken) {
      fetchData();
      api.get('/wallets/balance').then(({ data }) => {
        setUserPlan(data?.subscription?.planType || 'FREE');
        setSubscription(data?.subscription || null);
      }).catch(() => { });
    }
  }, [accessToken]);

  // Tự động gợi ý ngành nghề
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.title.length > 5) {
        handleSuggestCategories();
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData.title]);

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

  useEffect(() => {
    if (editJobId && accessToken) {
      const fetchJobDetails = async () => {
        try {
          const { data } = await api.get(`/job-postings/${editJobId}`);
          setFormData({
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
          });
          setInitialFormData({
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
          });
        } catch (error) {
          console.error('Lỗi khi tải thông tin công việc:', error);
          toast.error('Không thể tải dữ liệu công việc. Bạn có thể tạo tin mới.');
        } finally {
          setLoadingData(false);
        }
      };
      fetchJobDetails();
    } else {
      setLoadingData(false);
    }
  }, [editJobId, accessToken]);

  // HỖ TRỢ TEST AI MODERATION - Tự động điền dữ liệu mẫu
  useEffect(() => {
    const testDataStr = localStorage.getItem('workly_test_jd');
    if (testDataStr) {
      try {
        const testData = JSON.parse(testDataStr);
        setFormData(prev => ({
          ...prev,
          ...testData,
          salaryMin: testData.salaryMin || '',
          salaryMax: testData.salaryMax || '',
        }));
        toast.success('Đã nạp dữ liệu mẫu thành công! Bạn có thể nhấn Đăng tin để test AI.');
      } catch (e) {
        console.error('Failed to parse test data', e);
      } finally {
        localStorage.removeItem('workly_test_jd');
      }
    }
  }, []);

  // Load AI Prefill Data
  useEffect(() => {
    if (!editJobId) {
      const savedData = localStorage.getItem('aiPrefillJobData');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setFormData(prev => ({
            ...prev,
            title: parsed.title || prev.title,
            description: parsed.description || prev.description,
            requirements: parsed.requirements || prev.requirements,
            benefits: parsed.benefits || prev.benefits,
            salaryMin: parsed.salaryMin ? String(parsed.salaryMin) : prev.salaryMin,
            salaryMax: parsed.salaryMax ? String(parsed.salaryMax) : prev.salaryMax,
            jobType: ['FULLTIME', 'PARTTIME', 'REMOTE'].includes(parsed.jobType) ? parsed.jobType : prev.jobType,
            experience: parsed.experience || prev.experience,
            vacancies: parsed.vacancies || prev.vacancies,
            hardSkills: Array.isArray(parsed.hardSkills) ? parsed.hardSkills : prev.hardSkills,
            softSkills: Array.isArray(parsed.softSkills) ? parsed.softSkills : prev.softSkills,
            minExperienceYears: parsed.minExperienceYears || prev.minExperienceYears,
            isAiGenerated: parsed.isAiGenerated !== undefined ? parsed.isAiGenerated : prev.isAiGenerated,
            categories: Array.isArray(parsed.categories) ? parsed.categories : prev.categories,
          }));
          setTimeout(() => {
            toast.success('✨ Đã tự động điền dữ liệu từ Workly AI!', { icon: '🤖' });
          }, 500);
          localStorage.removeItem('aiPrefillJobData');
        } catch (e) {
          console.error('Failed to parse AI prefill data', e);
        }
      }
    }
  }, [editJobId]);

  const handleBranchToggle = (branchId: string) => {
    let updated = [...formData.branchIds];
    if (updated.includes(branchId)) {
      updated = updated.filter(id => id !== branchId);
    } else {
      updated.push(branchId);
    }
    setFormData(prev => ({ ...prev, branchIds: updated }));
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

  const addHardSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && hardSkillInput.trim()) {
      e.preventDefault();
      if (!formData.hardSkills.includes(hardSkillInput.trim())) {
        setFormData(prev => ({ ...prev, hardSkills: [...prev.hardSkills, hardSkillInput.trim()] }));
      }
      setHardSkillInput('');
    }
  };

  const addSoftSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && softSkillInput.trim()) {
      e.preventDefault();
      if (!formData.softSkills.includes(softSkillInput.trim())) {
        setFormData(prev => ({ ...prev, softSkills: [...prev.softSkills, softSkillInput.trim()] }));
      }
      setSoftSkillInput('');
    }
  };

  const removeSkill = (type: 'hard' | 'soft', skill: string) => {
    setFormData(prev => ({
      ...prev,
      [type === 'hard' ? 'hardSkills' : 'softSkills']: prev[type === 'hard' ? 'hardSkills' : 'softSkills'].filter(s => s !== skill)
    }));
  };

  // --- Computed flags ---
  const isFormValid =
    formData.title.trim().length > 5 &&
    formData.requirements.trim().length > 0 &&
    formData.description.trim().length > 0 &&
    formData.hardSkills.length > 0 &&
    formData.categories.length > 0;

  const missingFields = [];
  if (formData.title.trim().length <= 5) missingFields.push('Tiêu đề (ít nhất 5 ký tự)');
  if (formData.categories.length === 0) missingFields.push('Lĩnh vực');
  if (formData.description.trim().length === 0) missingFields.push('Mô tả công việc');
  if (formData.requirements.trim().length === 0) missingFields.push('Yêu cầu');
  if (formData.hardSkills.length === 0) missingFields.push('Kỹ năng chuyên môn');

  const hasChanges = !editJobId || !initialFormData || (
    JSON.stringify({
      ...formData,
      hardSkills: [...formData.hardSkills].sort(),
      softSkills: [...formData.softSkills].sort(),
      branchIds: [...formData.branchIds].sort(),
    }) !== JSON.stringify({
      ...initialFormData,
      hardSkills: [...initialFormData.hardSkills].sort(),
      softSkills: [...initialFormData.softSkills].sort(),
      branchIds: [...initialFormData.branchIds].sort(),
    })
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submit triggered at step:", currentStep);
    
    // Chỉ cho phép submit khi đang ở bước cuối cùng (Xem trước)
    if (currentStep !== totalSteps) {
      console.warn("Prevented submission from step:", currentStep);
      return;
    }

    if (!accessToken) return;

    if (formData.hardSkills.length === 0) {
      toast.error('Vui lòng nhập ít nhất một kỹ năng chuyên môn để Matching Engine hoạt động!');
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
        toast.success('Cập nhật thông tin tuyển dụng thành công!');
      } else {
        await api.post('/job-postings', payload);
        toast.success('Gửi yêu cầu tuyển dụng thành công! Vui lòng chờ Admin duyệt.');
      }
      router.push('/recruiter/jobs');
    } catch (error: any) {
      console.error('Error saving job:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu!');
    } finally {
      setSaving(false);
    }
  };

  // --- AI JD Generation Handler ---
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Vui lòng nhập yêu cầu của bạn.');
      return;
    }
    setAiGenerating(true);
    try {
      const { data } = await api.post('/ai/generate-jd', { prompt: aiPrompt });
      if (data && data.data) {
        setFormData(prev => ({
          ...prev,
          title: data.data.title || prev.title,
          description: data.data.description || prev.description,
          requirements: data.data.requirements || prev.requirements,
          benefits: data.data.benefits || prev.benefits,
          salaryMin: data.data.salaryMin ? String(data.data.salaryMin) : prev.salaryMin,
          salaryMax: data.data.salaryMax ? String(data.data.salaryMax) : prev.salaryMax,
          jobType: ['FULLTIME', 'PARTTIME', 'REMOTE'].includes(data.data.jobType) ? data.data.jobType : prev.jobType,
          experience: data.data.experience || prev.experience,
          vacancies: data.data.vacancies || prev.vacancies,
          hardSkills: Array.isArray(data.data.hardSkills) ? data.data.hardSkills : prev.hardSkills,
          softSkills: Array.isArray(data.data.softSkills) ? data.data.softSkills : prev.softSkills,
          minExperienceYears: data.data.minExperienceYears || prev.minExperienceYears,
          isAiGenerated: true,
          categories: Array.isArray(data.data.categories) ? data.data.categories : prev.categories,
        }));
        toast.success('Đã tự động viết JD thành công bằng AI!', { icon: '🤖' });
        setAiModalOpen(false);
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error('Chỉ tài khoản VIP (LITE hoặc GROWTH) mới sử dụng được tính năng này!');
      } else {
        toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi gọi AI.');
      }
    } finally {
      setAiGenerating(false);
    }
  };

  // --- AI Moderation Pre-check Handler ---
  const handlePreCheck = async () => {
    if (!formData.description || !formData.requirements) {
      toast.error('Vui lòng điền mô tả và yêu cầu trước khi kiểm duyệt.');
      return;
    }
    setIsChecking(true);
    setModResult(null);
    try {
      const payload = {
        ...formData,
        salaryMin: formData.salaryMin ? Number(formData.salaryMin) : undefined,
        salaryMax: formData.salaryMax ? Number(formData.salaryMax) : undefined,
        vacancies: Number(formData.vacancies),
      };
      const { data } = await api.post('/job-postings/pre-check', payload);
      setModResult(data);
      if (data.safe && data.score >= 70) {
        toast.success('AI đánh giá tin tuyển dụng của bạn đạt chuẩn!');
      } else if (data.safe) {
        toast('AI đánh giá tin tuyển dụng cần cải thiện thêm.', { icon: '⚠️' });
      } else {
        toast.error(`AI phát hiện vi phạm: ${data.reason}`);
      }
    } catch (error: any) {
      console.error('Moderation check failed', error);
      const errorMessage = error.response?.data?.message || 'Không thể kiểm duyệt nội dung lúc này.';
      // Nếu message là mảng (class-validator), join chúng lại
      const displayMessage = Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage;
      toast.error(displayMessage);
    } finally {
      setIsChecking(false);
    }
  };

  const handleNextStep = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (currentStep === 1) {
      if (formData.title.trim().length <= 5) {
        toast.error('Tiêu đề công việc phải có ít nhất 5 ký tự.');
        return;
      }
      if (formData.categories.length === 0) {
        toast.error('Vui lòng chọn ít nhất một lĩnh vực kinh doanh.');
        return;
      }
    }
    if (currentStep === 2) {
      if (formData.hardSkills.length === 0) {
        toast.error('Vui lòng nhập ít nhất một kỹ năng chuyên môn.');
        return;
      }
    }
    if (currentStep === 3) {
      if (!formData.description.trim()) {
        toast.error('Vui lòng nhập mô tả công việc.');
        return;
      }
      if (!formData.requirements.trim()) {
        toast.error('Vui lòng nhập yêu cầu ứng viên.');
        return;
      }
    }
    setCurrentStep(prev => prev + 1);
  };

  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-[60vh] text-slate-500 flex-col gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        Đang tải thông tin...
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto space-y-6 pb-12"
    >
      <div className="border-b border-indigo-100 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-indigo-600" />
            {editJobId ? 'Chỉnh Sửa Tin Tuyển Dụng' : 'Gửi Yêu Cầu Tuyển Dụng'}
            {userPlan && (
              <span className={`text-[10px] px-3 py-1 rounded-full border font-black uppercase tracking-widest ml-2 ${userPlan === 'GROWTH' ? 'bg-amber-500/10 text-amber-600 border-amber-200' :
                userPlan === 'LITE' ? 'bg-indigo-500/10 text-indigo-600 border-indigo-200' :
                  'bg-slate-500/10 text-slate-600 border-slate-200'
                }`}>
                Gói {userPlan}
              </span>
            )}
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            {editJobId ? 'Cập nhật lại thông tin tuyển dụng, chức danh và yêu cầu.' : 'Điền thông tin chi tiết và gửi yêu cầu để Admin phê duyệt trước khi tin được hiển thị.'}
          </p>
        </div>

        {!editJobId && (
          <button
            onClick={() => {
              if (userPlan === 'FREE' || !userPlan) {
                toast('Vui lòng nâng cấp gói LITE hoặc GROWTH để sử dụng AI Viết JD.', { icon: '🔒' });
                router.push('/recruiter/wallet');
              } else {
                setAiModalOpen(true);
              }
            }}
            className={`flex-shrink-0 whitespace-nowrap flex items-center gap-2 px-5 py-2.5 rounded-full font-bold transition-all hover:-translate-y-0.5 border ${userPlan === 'FREE' || !userPlan
              ? 'bg-white text-slate-400 border-slate-200 shadow-sm hover:border-indigo-300 hover:text-indigo-600'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/30'
              }`}
          >
            {userPlan === 'FREE' || !userPlan ? (
              <>
                <Lock className="w-4 h-4 text-slate-400" />
                <span className="text-sm">Mở khóa AI Viết JD</span>
              </>
            ) : (
              <>
                <Sparkles className={`w-5 h-5 ${userPlan === 'FREE' || !userPlan ? 'text-indigo-500' : 'text-purple-200'}`} />
                {userPlan === 'LITE' ? 'AI Gợi Ý Kỹ Năng' : 'AI Tối Ưu SEO & Conversion'}
              </>
            )}
          </button>
        )}
      </div>

      {aiModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] w-full max-w-4xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-white/20 relative"
          >
            {/* Subtle Texture/Grain Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/p6.png')]" />

            <div className="relative flex flex-col md:flex-row h-full min-h-[520px]">
              {/* Left Panel - Branding & Context */}
              <div className="w-full md:w-80 bg-[#F9F9F7] p-10 border-r border-slate-100 flex flex-col justify-between relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-60" />
                
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-8 transform -rotate-3">
                    <Sparkles className="w-7 h-7 text-indigo-600" />
                  </div>
                  <h3 style={{ fontFamily: "'DM Serif Display', serif" }} className="text-3xl text-[#111110] leading-[1.1] mb-5">
                    Trợ lý <em className="text-indigo-600 not-italic">Sáng tạo</em> JD
                  </h3>
                  <p className="text-sm text-[#666660] leading-relaxed mb-8 font-medium">
                    Cung cấp cho AI những ý chính về công việc, chúng tôi sẽ biến chúng thành một bản JD chuyên nghiệp, chuẩn SEO và thu hút nhân tài.
                  </p>

                  <div className="space-y-5">
                    {[
                      'Tự động đề xuất kỹ năng chuyên sâu',
                      'Tối ưu từ khóa chuẩn SEO ngành',
                      'Cấu trúc văn bản thu hút & hiện đại'
                    ].map((text, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-white shadow-sm border border-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                        </div>
                        <p className="text-[11px] text-[#444440] font-bold uppercase tracking-wider">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`relative z-10 mt-10 p-5 rounded-2xl border backdrop-blur-sm transition-all duration-500 ${
                  userPlan === 'GROWTH' ? 'bg-amber-50/80 border-amber-200 shadow-sm' :
                  userPlan === 'LITE' ? 'bg-indigo-50/80 border-indigo-200 shadow-sm' :
                  'bg-slate-100 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <Crown className={`w-4 h-4 ${userPlan === 'GROWTH' ? 'text-amber-600' : userPlan === 'LITE' ? 'text-indigo-600' : 'text-slate-500'}`} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#111110]">
                      {userPlan === 'GROWTH' ? 'Growth Engine' : userPlan === 'LITE' ? 'Lite Engine' : 'Basic Engine'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#666660] leading-snug font-medium">
                    {userPlan === 'GROWTH' ? 'Đang kích hoạt mô hình AI cao cấp nhất để tối ưu hóa tỷ lệ chuyển đổi JD.' :
                     userPlan === 'LITE' ? 'Hỗ trợ viết JD cơ bản và tự động hóa trích xuất kỹ năng chuyên môn.' :
                     'Nâng cấp để mở khóa toàn bộ sức mạnh AI và tối ưu hóa SEO chuyên sâu.'}
                  </p>
                </div>
              </div>

              {/* Right Panel - Input Workspace */}
              <div className="flex-1 p-10 flex flex-col bg-white">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#A0A090] mb-1">Input Workspace</h4>
                    <p className="text-[11px] text-[#BEBDB5] font-medium italic">Dán mô tả thô hoặc các ý chính vào đây...</p>
                  </div>
                  <button onClick={() => setAiModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400 transition-all hover:rotate-90">
                    <CloseIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 relative group">
                  {/* Subtle Background Pattern for Input */}
                  <div className="absolute inset-0 bg-[#FAF9F6] rounded-[2rem] opacity-40 pointer-events-none border border-slate-100" />
                  
                  <textarea
                    className="relative w-full h-full min-h-[320px] p-8 bg-transparent outline-none resize-none transition-all text-[#111110] placeholder-[#D0CFCA] font-medium leading-relaxed text-base"
                    placeholder="Ví dụ: [FPT SHOP] Cần tuyển Nhân viên tư vấn bán hàng tại Đà Nẵng...\n📍 Địa điểm: Hải Châu, Thanh Khê\n💻 Mô tả: Tư vấn sản phẩm, hướng dẫn khách hàng...\n🎯 Yêu cầu: 18-28 tuổi, thân thiện...\n🎁 Quyền lợi: Lương 8-15tr, đầy đủ BHXH..."
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    disabled={aiGenerating}
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  />
                  
                  {/* Floating Metadata */}
                  <div className="absolute bottom-6 right-6 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                    <span className="px-3 py-1.5 bg-white border border-[#E8E8E2] rounded-xl text-[10px] text-[#999890] font-black uppercase tracking-widest shadow-sm">
                      {aiPrompt.length} chars
                    </span>
                    <span className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] text-indigo-600 font-black uppercase tracking-widest shadow-sm">
                      {aiPrompt.split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>
                </div>

                <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <button 
                      type="button" 
                      onClick={() => setAiPrompt(prev => prev + (prev ? "\n\n" : "") + "📍 Địa điểm: \n💻 Mô tả: \n🎯 Yêu cầu: \n🎁 Quyền lợi: ")}
                      className="flex items-center gap-2 text-[10px] font-black text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-[0.2em] group"
                    >
                      <Plus className="w-3.5 h-3.5 transition-transform group-hover:rotate-90" />
                      Thêm cấu trúc mẫu
                    </button>
                  </div>

                  <div className="flex items-center gap-5 w-full sm:w-auto">
                    <button 
                      disabled={aiGenerating} 
                      onClick={() => setAiModalOpen(false)} 
                      className="flex-1 sm:flex-none text-[11px] font-black uppercase tracking-[0.2em] text-[#BEBDB5] hover:text-[#111110] transition-colors"
                    >
                      Hủy bỏ
                    </button>
                    <button 
                      onClick={handleAiGenerate} 
                      disabled={aiGenerating || !aiPrompt.trim()} 
                      className="flex-1 sm:flex-none relative overflow-hidden group bg-[#111110] text-white px-10 py-4 rounded-2xl font-bold text-xs uppercase tracking-[0.15em] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 shadow-xl shadow-slate-200"
                    >
                      {/* Gradient Hover Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_100%] animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                      
                      <div className="relative flex items-center justify-center gap-3">
                        {aiGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        <span>{aiGenerating ? 'AI đang soạn thảo...' : 'Phát sinh JD ngay'}</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* AI Modal Block */}


      {/* Progress Bar */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-6">
        <div className="max-w-2xl mx-auto relative">
          {/* Connection Lines Container */}
          <div className="absolute top-5 left-5 right-5 h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
          <div
            className="absolute top-5 left-5 h-0.5 bg-indigo-600 -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: `calc(((currentStep - 1) / (totalSteps - 1)) * (100% - 40px))` }}
          />

          {/* Icons Row */}
          <div className="flex items-center justify-between relative z-10">
            {[
              { step: 1, label: 'Cơ bản', icon: Briefcase },
              { step: 2, label: 'Chi tiết', icon: Info },
              { step: 3, label: 'Nội dung', icon: Save },
              { step: 4, label: 'Hạng tin', icon: Crown },
              { step: 5, label: 'Xem trước', icon: Eye }
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center group">
                <div
                  onClick={() => currentStep > item.step && setCurrentStep(item.step)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer shadow-sm ${currentStep >= item.step ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white text-slate-400 border-2 border-slate-100'
                    }`}
                >
                  {currentStep > item.step ? <CheckCircle2 className="w-5 h-5" /> : <item.icon className="w-5 h-5" />}
                </div>
                {/* Labels Row (Positioned absolutely or with negative margin to not affect circle spacing) */}
                <span className={`absolute -bottom-6 whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${currentStep >= item.step ? 'text-indigo-600' : 'text-slate-400'}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="h-6" /> {/* Spacer for labels */}
      </div>

      <div className="relative">
        <form onSubmit={handleSubmit} className="w-full bg-white rounded-[2.5rem] shadow-xl shadow-slate-100/50 border border-slate-100 p-10 space-y-10 min-h-[600px] flex flex-col relative overflow-hidden">
          <div className="flex-1">
            {currentStep === 1 && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Tiêu đề công việc <span className="text-red-500">*</span></label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full h-11 px-4 rounded-xl border border-slate-200 outline-none" placeholder="VD: Senior Developer" />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                    <span>Lĩnh vực & Ngành nghề <span className="text-red-500">*</span></span>
                    {isSuggesting && <span className="text-[10px] text-indigo-500 flex items-center gap-1 animate-pulse"><Sparkles className="w-3 h-3" /> AI đang gợi ý...</span>}
                  </label>

                  {/* AI Suggested Tags */}
                  {suggestedCategories.length > 0 && (
                    <div className="flex flex-wrap gap-2 items-center bg-indigo-50/50 p-3 rounded-2xl border border-dashed border-indigo-100">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mr-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Gợi ý từ AI:
                      </span>
                      {suggestedCategories.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleCategory(cat)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${formData.categories.includes(cat)
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-white text-indigo-600 border border-indigo-100 hover:border-indigo-300'
                            }`}
                        >
                          {cat}
                          {formData.categories.includes(cat) ? <CloseIcon className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="relative">
                    <div onClick={() => setIndustryMenuOpen(!industryMenuOpen)} className="w-full min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 cursor-pointer flex flex-wrap gap-2 items-center bg-white">
                      {formData.categories.length === 0 ? <span className="text-slate-400 text-sm">Hoặc chọn thủ công...</span> :
                        formData.categories.map(cat => (
                          <span key={cat} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100 flex items-center gap-1">
                            {cat} <CloseIcon className="w-3 h-3" onClick={(e) => { e.stopPropagation(); toggleCategory(cat); }} />
                          </span>
                        ))
                      }
                    </div>
                    {industryMenuOpen && (
                      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <div className="bg-white border border-slate-200 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[70vh] w-full max-w-2xl animate-in fade-in zoom-in duration-300 relative">
                          {/* Close Button */}
                          <button
                            onClick={() => setIndustryMenuOpen(false)}
                            className="absolute top-4 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors z-[60]"
                          >
                            <CloseIcon className="w-5 h-5 text-slate-500" />
                          </button>

                          {/* Search Bar */}
                          <div className="p-6 pt-8 border-b border-slate-100 bg-slate-50/50">
                            <div className="relative max-w-md">
                              <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                              <input
                                type="text"
                                placeholder="Tìm kiếm ngành nghề hoặc vị trí..."
                                value={industrySearch}
                                onChange={(e) => setIndustrySearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                              />
                            </div>
                          </div>

                          <div className="flex flex-1 overflow-hidden min-h-[300px]">
                            {industrySearch.trim() === '' ? (
                              <>
                                {/* Left Pane: Categories */}
                                <div className="w-1/3 border-r border-slate-100 overflow-y-auto bg-slate-50/30">
                                  {allIndustries.map(cat => (
                                    <div
                                      key={cat.category}
                                      onMouseEnter={() => setActiveCategoryTab(cat.category)}
                                      onClick={() => toggleCategory(cat.category)}
                                      className={`px-4 py-3 cursor-pointer transition-all flex items-center justify-between group ${activeCategoryTab === cat.category || formData.categories.includes(cat.category)
                                        ? 'bg-white text-indigo-600 font-bold'
                                        : 'text-slate-600 hover:bg-white hover:text-indigo-500'
                                        }`}
                                    >
                                      <span className="text-xs truncate">{cat.category}</span>
                                      {formData.categories.includes(cat.category) && <CheckCircle2 className="w-3 h-3 text-indigo-600" />}
                                    </div>
                                  ))}
                                </div>

                                {/* Right Pane: Sub-categories */}
                                <div className="w-2/3 overflow-y-auto p-4 bg-white">
                                  {activeCategoryTab ? (
                                    <div className="space-y-4">
                                      <div className="flex items-center justify-between">
                                        <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ngành con trong {activeCategoryTab}</h5>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const cat = allIndustries.find(i => i.category === activeCategoryTab);
                                            if (cat) cat.subCategories.forEach((s: string) => { if (!formData.categories.includes(s)) toggleCategory(s); });
                                          }}
                                          className="text-[9px] font-bold text-indigo-600 hover:underline"
                                        >
                                          Chọn tất cả
                                        </button>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        {allIndustries.find(i => i.category === activeCategoryTab)?.subCategories?.map((sub: string) => (
                                          <button
                                            key={sub}
                                            type="button"
                                            onClick={() => toggleCategory(sub)}
                                            className={`px-3 py-2 rounded-xl text-[11px] font-medium text-left border transition-all ${formData.categories.includes(sub)
                                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                              : 'bg-white text-slate-600 border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30'
                                              }`}
                                          >
                                            {sub}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 opacity-60">
                                      <Briefcase className="w-8 h-8" />
                                      <p className="text-[10px] font-bold uppercase tracking-widest">Chọn một lĩnh vực để xem chi tiết</p>
                                    </div>
                                  )}
                                </div>
                              </>
                            ) : (
                              /* Search Results View */
                              <div className="w-full overflow-y-auto p-4 bg-white">
                                <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Kết quả tìm kiếm cho "{industrySearch}"</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {Array.from(new Set(allIndustries.flatMap(cat => [cat.category, ...cat.subCategories])))
                                    .filter(name => name.toLowerCase().includes(industrySearch.toLowerCase()))
                                    .map(name => (
                                      <button
                                        key={name}
                                        type="button"
                                        onClick={() => toggleCategory(name)}
                                        className={`px-3 py-2 rounded-xl text-[11px] font-medium text-left border transition-all ${formData.categories.includes(name)
                                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                          : 'bg-white text-slate-600 border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30'
                                          }`}
                                      >
                                        {name}
                                      </button>
                                    ))
                                  }
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Footer Info */}
                          <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                            <p className="text-[10px] text-slate-400 font-medium italic">Bí quyết: Chọn ngành nghề chính xác giúp AI tìm ứng viên tốt hơn.</p>
                            <button
                              type="button"
                              onClick={() => setIndustryMenuOpen(false)}
                              className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg hover:bg-slate-800 transition-all"
                            >
                              Xác nhận
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Loại hình công việc</label>
                    <select name="jobType" value={formData.jobType} onChange={handleChange} className="w-full h-11 px-4 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 bg-white text-sm font-medium">
                      <option value="FULLTIME">Toàn thời gian</option>
                      <option value="PARTTIME">Bán thời gian</option>
                      <option value="REMOTE">Làm việc từ xa</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Chức vụ</label>
                    <select name="jobLevel" value={formData.jobLevel} onChange={handleChange} className="w-full h-11 px-4 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 bg-white text-sm font-medium">
                      <option value="INTERN">Thực tập sinh</option>
                      <option value="STAFF">Nhân viên/Chuyên viên</option>
                      <option value="MANAGER">Trưởng nhóm/Trưởng phòng</option>
                      <option value="DIRECTOR">Giám đốc/Cấp cao hơn</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                {/* Basic Info & Salary Group */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {/* Left Column: Basic Requirements */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-500" /> Số lượng tuyển dụng
                      </label>
                      <div className="relative">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input type="number" name="vacancies" value={formData.vacancies} onChange={handleChange} className="w-full h-11 pl-12 pr-4 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none font-bold text-slate-700" placeholder="1" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-indigo-500" /> Yêu cầu kinh nghiệm
                      </label>
                      <select
                        value={formData.experience}
                        onChange={(e) => {
                          const val = e.target.value;
                          let minYears = 0;
                          if (val === '1 - 2 năm') minYears = 1;
                          else if (val === '3 - 5 năm') minYears = 3;
                          else if (val === 'Trên 5 năm') minYears = 5;
                          setFormData(p => ({ ...p, experience: val, minExperienceYears: minYears }));
                        }}
                        className="w-full h-11 px-4 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 bg-white text-sm font-medium text-slate-700"
                      >
                        <option value="Không yêu cầu">Không yêu cầu</option>
                        <option value="Dưới 1 năm">Dưới 1 năm</option>
                        <option value="1 - 2 năm">1 - 2 năm</option>
                        <option value="3 - 5 năm">3 - 5 năm</option>
                        <option value="Trên 5 năm">Trên 5 năm</option>
                      </select>
                    </div>
                  </div>

                  {/* Right Column: Salary Configuration */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-indigo-500" /> Mức lương đề xuất
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.salaryMin === '0' && formData.salaryMax === '0'}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(p => ({ ...p, salaryMin: '0', salaryMax: '0' }));
                            } else {
                              setFormData(p => ({ ...p, salaryMin: '10000000', salaryMax: '15000000' }));
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs font-bold text-slate-500 group-hover:text-indigo-600 transition-colors">Thỏa thuận</span>
                      </label>
                    </div>

                    {(formData.salaryMin !== '0' || formData.salaryMax !== '0') ? (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mức lương tối thiểu</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={formData.salaryMin}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (Number(val) <= Number(formData.salaryMax)) setFormData(p => ({ ...p, salaryMin: val }));
                              }}
                              className="w-full h-11 px-4 pr-12 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none font-semibold text-sm text-slate-700 bg-white transition-all"
                              placeholder="0"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">VNĐ</span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mức lương tối đa</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={formData.salaryMax}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (Number(val) >= Number(formData.salaryMin)) setFormData(p => ({ ...p, salaryMax: val }));
                              }}
                              className="w-full h-11 px-4 pr-12 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none font-semibold text-sm text-slate-700 bg-white transition-all"
                              placeholder="0"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">VNĐ</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2 text-slate-500">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-xs font-bold">Lương thỏa thuận khi phỏng vấn</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-px bg-slate-100 w-full" />

                {/* Skills Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                      <span>Kỹ năng chuyên môn</span>
                      <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-black uppercase tracking-tighter">Hard Skills</span>
                    </label>
                    <div className="relative group">
                      <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      <input type="text" value={hardSkillInput} onChange={e => setHardSkillInput(e.target.value)} onKeyDown={addHardSkill} placeholder="Nhấn Enter để thêm..." className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 text-sm font-medium transition-all shadow-sm focus:shadow-md" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.hardSkills.map(s => (
                        <span key={s} className="px-3 py-1.5 bg-indigo-50/50 text-indigo-700 text-[11px] font-bold rounded-lg border border-indigo-100/50 flex items-center gap-2 hover:bg-indigo-50 transition-colors">
                          {s} <CloseIcon className="w-3.5 h-3.5 cursor-pointer opacity-50 hover:opacity-100 transition-opacity" onClick={() => removeSkill('hard', s)} />
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                      <span>Kỹ năng bổ trợ</span>
                      <span className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full font-black uppercase tracking-tighter">Soft Skills</span>
                    </label>
                    <div className="relative group">
                      <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                      <input type="text" value={softSkillInput} onChange={e => setSoftSkillInput(e.target.value)} onKeyDown={addSoftSkill} placeholder="Nhấn Enter để thêm..." className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 outline-none focus:border-purple-500 text-sm font-medium transition-all shadow-sm focus:shadow-md" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.softSkills.map(s => (
                        <span key={s} className="px-3 py-1.5 bg-purple-50/50 text-purple-700 text-[11px] font-bold rounded-lg border border-purple-100/50 flex items-center gap-2 hover:bg-purple-50 transition-colors">
                          {s} <CloseIcon className="w-3.5 h-3.5 cursor-pointer opacity-50 hover:opacity-100 transition-opacity" onClick={() => removeSkill('soft', s)} />
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {formData.jobType !== 'ONLINE' && (
                  <div className="space-y-4 pt-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-500" /> Địa điểm làm việc
                    </label>
                    {branches.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {branches.map(b => (
                          <button
                            key={b.branchId}
                            type="button"
                            onClick={() => handleBranchToggle(b.branchId)}
                            className={`px-5 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${formData.branchIds.includes(b.branchId)
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200'
                              : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-200 hover:text-indigo-600'
                              }`}
                          >
                            {b.name}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-5 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-start gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                          <Home className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Địa chỉ làm việc</p>
                          <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                            {companyProfile?.address || 'Chưa cập nhật địa chỉ trong hồ sơ công ty'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Mô tả công việc</label>
                  <AutoResizeTextarea name="description" value={formData.description} onChange={handleChange} className="w-full p-4 rounded-xl border border-slate-200 outline-none" placeholder="..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Yêu cầu ứng viên</label>
                  <AutoResizeTextarea name="requirements" value={formData.requirements} onChange={handleChange} className="w-full p-4 rounded-xl border border-slate-200 outline-none" placeholder="..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Quyền lợi được hưởng</label>
                  <AutoResizeTextarea name="benefits" value={formData.benefits} onChange={handleChange} className="w-full p-4 rounded-xl border border-slate-200 outline-none" placeholder="..." />
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handlePreCheck}
                    disabled={isChecking}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 disabled:opacity-50 transition-all text-sm"
                  >
                    {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4 text-indigo-400" />}
                    Kiểm duyệt nội dung bằng AI
                  </button>

                  {modResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-4 p-5 rounded-2xl border-2 ${modResult.safe ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${modResult.safe ? 'bg-emerald-500' : 'bg-red-500'} text-white`}>
                            {modResult.safe ? <CheckCircle2 className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                          </div>
                          <span className={`font-black text-xs uppercase tracking-widest ${modResult.safe ? 'text-emerald-700' : 'text-red-700'}`}>
                            KẾT QUẢ KIỂM DUYỆT (SCORE: {modResult.score})
                          </span>
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${modResult.safe ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {modResult.safe ? 'HỢP LỆ' : 'VI PHẠM'}
                        </span>
                      </div>

                      <p className={`text-sm font-bold mb-3 ${modResult.safe ? 'text-slate-800' : 'text-red-800'}`}>
                        {modResult.reason}
                      </p>

                      {modResult.feedback && modResult.feedback.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Gợi ý từ AI:</p>
                          <ul className="space-y-1.5">
                            {modResult.feedback.map((f: string, i: number) => (
                              <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                                <Zap className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="mt-4 pt-3 border-t border-slate-200/50 flex items-center justify-between">
                        <p className="text-[10px] text-slate-400 font-medium italic">
                          {modResult.suggestedAction}
                        </p>
                        <span className="text-[9px] font-black text-indigo-400 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> POWERED BY WORKLY AI
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                <div className="space-y-6">
                  <div className="flex items-end justify-between">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#A0A090] mb-2">Service Selection</h4>
                      <h3 style={{ fontFamily: "'DM Serif Display', serif" }} className="text-3xl text-[#111110]">Hạng tin đăng</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Gói hiện tại</p>
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[11px] font-black uppercase tracking-widest border border-indigo-100">
                        {userPlan} Plan
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      {
                        id: 'BASIC',
                        label: 'Standard',
                        description: 'Hiển thị cơ bản, tiếp cận ứng viên tự nhiên.',
                        remaining: subscription ? Math.max(0, subscription.maxBasicPosts - subscription.usedBasicPosts) : 0,
                        total: subscription?.maxBasicPosts || 0,
                        icon: <Zap className="w-6 h-6" />,
                        bgSelected: 'bg-indigo-50/30',
                        borderSelected: 'border-indigo-600',
                        accentColor: 'bg-indigo-600',
                        glowColor: 'bg-indigo-500/10',
                        textColor: 'text-indigo-600',
                        shadowSelected: 'shadow-indigo-900/5'
                      },
                      {
                        id: 'PROFESSIONAL',
                        label: 'Professional',
                        description: 'Ưu tiên hiển thị, tăng 2x lượt tiếp cận.',
                        remaining: subscription ? Math.max(0, subscription.maxVipPosts - subscription.usedVipPosts) : 0,
                        total: subscription?.maxVipPosts || 0,
                        icon: <Crown className="w-6 h-6" />,
                        bgSelected: 'bg-amber-50/30',
                        borderSelected: 'border-amber-600',
                        accentColor: 'bg-amber-600',
                        glowColor: 'bg-amber-500/10',
                        textColor: 'text-amber-600',
                        shadowSelected: 'shadow-amber-900/5'
                      },
                      {
                        id: 'URGENT',
                        label: 'Urgent',
                        description: 'Ghim top đầu, AI Matching mạnh nhất.',
                        remaining: subscription ? Math.max(0, subscription.maxUrgentPosts - subscription.usedUrgentPosts) : 0,
                        total: subscription?.maxUrgentPosts || 0,
                        icon: <Shield className="w-6 h-6" />,
                        bgSelected: 'bg-rose-50/30',
                        borderSelected: 'border-rose-600',
                        accentColor: 'bg-rose-600',
                        glowColor: 'bg-rose-500/10',
                        textColor: 'text-rose-600',
                        shadowSelected: 'shadow-rose-900/5'
                      }
                    ].map((tier, idx) => {
                      const isSelected = formData.jobTier === tier.id;
                      const hasQuota = tier.remaining > 0;
                      const isDisabled = !hasQuota && tier.id !== 'BASIC';
                      
                      return (
                        <motion.div
                          key={tier.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          onClick={() => !isDisabled && setFormData(p => ({ ...p, jobTier: tier.id as any }))}
                          className={`relative group p-8 rounded-[2.5rem] border-2 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[300px] ${
                            isSelected 
                              ? `${tier.borderSelected} ${tier.bgSelected} shadow-xl ${tier.shadowSelected}`
                              : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm'
                          } ${isDisabled ? 'opacity-50 grayscale bg-slate-50' : ''}`}
                        >
                          {/* Accent Glow */}
                          {isSelected && (
                            <div className={`absolute -top-24 -right-24 w-48 h-48 ${tier.glowColor} rounded-full blur-3xl`} />
                          )}

                          <div className="relative z-10">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${
                              isSelected ? `${tier.accentColor} text-white shadow-lg` : 'bg-slate-50 text-slate-400'
                            }`}>
                              {tier.icon}
                            </div>
                            <h4 className="text-xl font-bold text-[#111110] mb-3">{tier.label}</h4>
                            <p className="text-xs text-[#666660] leading-relaxed mb-8 font-medium">
                              {tier.description}
                            </p>
                          </div>

                          <div className="relative z-10 space-y-5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-widest text-[#A0A090]">Quota Status</span>
                              <span className={`text-[10px] font-black tracking-widest ${hasQuota ? 'text-emerald-600' : 'text-rose-500'}`}>
                                {hasQuota ? 'ACTIVE' : 'EXHAUSTED'}
                              </span>
                            </div>
                            
                            <div className="h-1.5 w-full bg-slate-100/50 rounded-full overflow-hidden border border-slate-100/50">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(tier.remaining / Math.max(1, tier.total)) * 100}%` }}
                                transition={{ duration: 1, ease: "circOut" }}
                                className={`h-full rounded-full ${tier.accentColor}`}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <p className="text-[11px] font-black text-[#111110] tracking-tight">
                                {tier.remaining} <span className="text-[#A0A090] font-medium italic">/ {tier.total} turns left</span>
                              </p>
                              {isSelected && (
                                <div className={`w-6 h-6 rounded-full ${tier.accentColor} flex items-center justify-center text-white shadow-sm transform scale-110`}>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </div>
                              )}
                              {!hasQuota && !isSelected && (
                                <Lock className="w-3.5 h-3.5 text-slate-300" />
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {userPlan === 'GROWTH' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-[#F9F9F7] border border-slate-100 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group"
                  >
                    {/* Subtle background glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-full blur-3xl opacity-40 -translate-y-1/2 translate-x-1/4 group-hover:scale-110 transition-transform duration-1000" />
                    
                    <div className="flex items-center gap-7 relative z-10">
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center flex-shrink-0 transform -rotate-3 group-hover:rotate-0 transition-transform">
                        <Zap className="w-8 h-8 text-amber-500" />
                      </div>
                      <div>
                        <h5 style={{ fontFamily: "'DM Serif Display', serif" }} className="text-xl text-[#111110] mb-2">Tự động mời ứng viên <em className="text-amber-500 not-italic">(Auto-Invite)</em></h5>
                        <p className="text-xs text-[#666660] font-medium leading-relaxed max-w-md">AI sẽ tự động phân tích và gửi lời mời ứng tuyển đến các ứng viên phù hợp nhất ngay sau khi bạn đăng tin.</p>
                      </div>
                    </div>
                    <div 
                      className={`w-20 h-10 rounded-full p-1.5 cursor-pointer relative flex items-center transition-all duration-500 shadow-inner ${formData.autoInviteMatches ? 'bg-amber-500' : 'bg-[#E8E8E2]'}`} 
                      onClick={() => setFormData(p => ({ ...p, autoInviteMatches: !p.autoInviteMatches }))}
                    >
                      <div className={`bg-white w-7 h-7 rounded-full shadow-lg transform transition-transform duration-500 ${formData.autoInviteMatches ? 'translate-x-10' : 'translate-x-0'}`} />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {currentStep === 5 && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest mb-4">
                    <Eye className="w-4 h-4" /> Xem trước nội dung tin đăng
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                      <h3 className="text-xl font-black text-slate-800 mb-4">{formData.title}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Mức lương</p>
                          <p className="text-sm font-black text-slate-700">
                            {formData.salaryMin === '0' && formData.salaryMax === '0'
                              ? 'Thỏa thuận'
                              : `${Number(formData.salaryMin).toLocaleString()} - ${Number(formData.salaryMax).toLocaleString()} VNĐ`}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Loại hình</p>
                          <p className="text-sm font-black text-slate-700">{formData.jobType}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Kinh nghiệm</p>
                          <p className="text-sm font-black text-slate-700">{formData.experience}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Số lượng</p>
                          <p className="text-sm font-black text-slate-700">{formData.vacancies} người</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                          <h4 className="text-xs font-black text-slate-400 uppercase mb-3 flex items-center gap-2">
                            <Briefcase className="w-3 h-3" /> Lĩnh vực
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {formData.categories.map(c => (
                              <span key={c} className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-lg border border-indigo-100">{c}</span>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                          <h4 className="text-xs font-black text-slate-400 uppercase mb-3 flex items-center gap-2">
                            <Target className="w-3 h-3" /> Kỹ năng chuyên môn
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {formData.hardSkills.map(s => (
                              <span key={s} className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg">{s}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                          <h4 className="text-xs font-black text-slate-400 uppercase mb-3 flex items-center gap-2">
                            <MapPin className="w-3 h-3" /> Địa điểm làm việc
                          </h4>
                          <div className="space-y-2">
                            {formData.branchIds.length > 0 ? (
                              branches.filter(b => formData.branchIds.includes(b.branchId)).map(b => (
                                <p key={b.branchId} className="text-xs font-bold text-slate-600 flex items-center gap-2">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {b.name}
                                </p>
                              ))
                            ) : (
                              <p className="text-xs font-bold text-slate-600 flex items-center gap-2">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {companyProfile?.address || 'Toàn quốc'}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                          <h4 className="text-xs font-black text-slate-400 uppercase mb-3 flex items-center gap-2">
                            <Crown className="w-3 h-3" /> Hạng tin đăng
                          </h4>
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest">{formData.jobTier}</span>
                            {formData.autoInviteMatches && (
                              <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full uppercase tracking-widest flex items-center gap-1">
                                <Zap className="w-3 h-3" /> Auto-Invite On
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm space-y-6">
                      <section>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tighter mb-3 flex items-center gap-2">
                          <div className="w-1 h-4 bg-indigo-600 rounded-full" /> Mô tả công việc
                        </h4>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed pl-3 border-l border-slate-100">{formData.description}</p>
                      </section>
                      <section>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tighter mb-3 flex items-center gap-2">
                          <div className="w-1 h-4 bg-indigo-600 rounded-full" /> Yêu cầu ứng viên
                        </h4>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed pl-3 border-l border-slate-100">{formData.requirements}</p>
                      </section>
                      {formData.benefits && (
                        <section>
                          <h4 className="text-sm font-black text-slate-800 uppercase tracking-tighter mb-3 flex items-center gap-2">
                            <div className="w-1 h-4 bg-indigo-600 rounded-full" /> Quyền lợi
                          </h4>
                          <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed pl-3 border-l border-slate-100">{formData.benefits}</p>
                        </section>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-auto">
            <button type="button" onClick={() => setCurrentStep(currentStep - 1)} disabled={currentStep === 1} className={`px-6 py-2 rounded-xl font-bold ${currentStep === 1 ? 'opacity-0' : 'text-slate-500 hover:bg-slate-50'}`}>Quay lại</button>
            <div className="flex flex-col items-end gap-2">
              {!isFormValid && currentStep >= 4 && (
                <div className="flex items-center gap-2 text-[10px] font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 animate-pulse">
                  <Info className="w-3 h-3" /> Thiếu: {missingFields.join(', ')}
                </div>
              )}
              {currentStep < totalSteps ? (
                <button type="button" onClick={(e) => handleNextStep(e)} className="px-8 py-2 rounded-xl bg-indigo-600 text-white font-black hover:bg-indigo-700 shadow-lg">Tiếp tục</button>
              ) : (
                <button type="submit" disabled={saving || !isFormValid} className="px-10 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black shadow-xl shadow-indigo-200 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  {saving ? 'Đang lưu...' : (editJobId ? 'Cập nhật tin' : 'Đăng tin ngay')}
                </button>
              )}
            </div>
          </div>
        </form>

      </div>
    </motion.div>
  );
}

export default function PostJobPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-[60vh] text-slate-500 flex-col gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        Đang tải...
      </div>
    }>
      <PostJobForm />
    </Suspense>
  );
}
