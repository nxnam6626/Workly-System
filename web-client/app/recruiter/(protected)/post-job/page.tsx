'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { Briefcase, Loader2, Save, MapPin, DollarSign, Calendar, Users, Info, Clock, ChevronDown, Plus, Crown, X as CloseIcon, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth';
import { LOCATIONS } from '@/lib/constants';

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
  jobTier: 'BASIC',
  autoInviteMatches: false,
  isAiGenerated: false,
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
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [userPlan, setUserPlan] = useState<string>('FREE');

  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    if (accessToken) {
      api.get('/companies/my-company').then(({ data }) => setBranches(data.branches || []));
      api.get('/recruiters/wallet').then(({ data }) => setUserPlan(data?.subscription?.planType || 'FREE')).catch(() => {});
    }
  }, [accessToken]);

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
            experience: data.experience || 'Không yêu cầu',
            vacancies: data.vacancies || 1,
            branchIds: data.branches?.map((b: any) => b.branchId) || [],
            hardSkills: data.structuredRequirements?.hardSkills || [],
            softSkills: data.structuredRequirements?.softSkills || [],
            minExperienceYears: data.structuredRequirements?.minExperienceYears || 0,
            jobTier: data.jobTier || 'BASIC',
            autoInviteMatches: data.autoInviteMatches || false,
            isAiGenerated: data.structuredRequirements?.isAiGenerated || false,
          });
          setInitialFormData({
            title: data.title || '',
            description: data.description || '',
            requirements: data.requirements || '',
            benefits: data.benefits || '',
            salaryMin: data.salaryMin ? String(data.salaryMin) : '',
            salaryMax: data.salaryMax ? String(data.salaryMax) : '',
            jobType: data.jobType || 'FULLTIME',
            experience: data.experience || 'Không yêu cầu',
            vacancies: data.vacancies || 1,
            branchIds: data.branches?.map((b: any) => b.branchId) || [],
            hardSkills: data.structuredRequirements?.hardSkills || [],
            softSkills: data.structuredRequirements?.softSkills || [],
            minExperienceYears: data.structuredRequirements?.minExperienceYears || 0,
            jobTier: data.jobTier || 'BASIC',
            autoInviteMatches: data.autoInviteMatches || false,
            isAiGenerated: data.structuredRequirements?.isAiGenerated || false,
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
            jobType: ['FULLTIME', 'PARTTIME', 'INTERNSHIP'].includes(parsed.jobType) ? parsed.jobType : prev.jobType,
            experience: parsed.experience || prev.experience,
            vacancies: parsed.vacancies || prev.vacancies,
            hardSkills: Array.isArray(parsed.hardSkills) ? parsed.hardSkills : prev.hardSkills,
            softSkills: Array.isArray(parsed.softSkills) ? parsed.softSkills : prev.softSkills,
            minExperienceYears: parsed.minExperienceYears || prev.minExperienceYears,
            isAiGenerated: parsed.isAiGenerated !== undefined ? parsed.isAiGenerated : prev.isAiGenerated,
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
    formData.title.trim().length > 0 &&
    formData.description.trim().length > 0 &&
    formData.requirements.trim().length > 0 &&
    formData.hardSkills.length > 0;

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
            jobType: ['FULLTIME', 'PARTTIME', 'INTERNSHIP'].includes(data.data.jobType) ? data.data.jobType : prev.jobType,
            experience: data.data.experience || prev.experience,
            vacancies: data.data.vacancies || prev.vacancies,
            hardSkills: Array.isArray(data.data.hardSkills) ? data.data.hardSkills : prev.hardSkills,
            softSkills: Array.isArray(data.data.softSkills) ? data.data.softSkills : prev.softSkills,
            minExperienceYears: data.data.minExperienceYears || prev.minExperienceYears,
            isAiGenerated: true,
         }));
         toast.success('Đã tự động viết JD thành công bằng AI!', { icon: '🤖' });
         setAiModalOpen(false);
      }
    } catch(err: any) {
      if (err.response?.status === 403) {
         toast.error('Chỉ tài khoản VIP (LITE hoặc GROWTH) mới sử dụng được tính năng này!');
      } else {
         toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi gọi AI.');
      }
    } finally {
      setAiGenerating(false);
    }
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
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            {editJobId ? 'Cập nhật lại thông tin tuyển dụng, chức danh và yêu cầu.' : 'Điền thông tin chi tiết và gửi yêu cầu để Admin phê duyệt trước khi tin được hiển thị.'}
          </p>
        </div>
        
        {!editJobId && (
          <button 
            onClick={() => {
               if (userPlan === 'FREE' || !userPlan) {
                  setUpgradeModalOpen(true);
               } else {
                  setAiModalOpen(true);
               }
            }}
            className="flex-shrink-0 whitespace-nowrap flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-full font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all hover:-translate-y-0.5 border border-purple-500/30"
          >
            <Sparkles className="w-5 h-5 text-purple-200" />
            Trợ Lý AI Tạo JD
            {/* <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] uppercase ml-1 tracking-wider border border-white/10">VIP</span> */}
          </button>
        )}
      </div>

      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
           <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl"
           >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Trợ Lý AI Tự Động Viết JD</h3>
                    <p className="text-sm text-slate-500">Mô tả ngắn gọn yêu cầu, AI sẽ tự động viết một bản JD hoàn chỉnh chuẩn SEO.</p>
                  </div>
                </div>
                <button onClick={() => setAiModalOpen(false)} className="text-slate-400 hover:text-slate-600"><CloseIcon className="w-5 h-5"/></button>
              </div>
              <div className="p-6 space-y-4 shadow-inner bg-slate-50">
                 <textarea
                   className="w-full h-32 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none bg-white"
                   placeholder="Ví dụ: Cần tuyển 2 bạn lập trình viên ReactJS, yêu cầu 2 năm kinh nghiệm, làm việc tại TPHCM. Mức lương từ 15-20 triệu. Yêu cầu thành thạo Typescript, Next.js và Tailwind CSS..."
                   value={aiPrompt}
                   onChange={e => setAiPrompt(e.target.value)}
                   disabled={aiGenerating}
                 />
                 <div className="flex bg-amber-50 p-3 rounded-lg flex items-start gap-2 text-amber-700 text-sm">
                    <Crown className="w-5 h-5 flex-shrink-0" />
                    <p>Tính năng độc quyền dành cho nhà tuyển dụng gói <strong>LITE</strong> hoặc <strong>GROWTH</strong>. Giúp tiết kiệm 90% thời gian soạn thảo văn bản tuyển dụng truyền thống.</p>
                 </div>
              </div>
              <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
                 <button disabled={aiGenerating} onClick={() => setAiModalOpen(false)} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors">Đóng lại</button>
                 <button onClick={handleAiGenerate} disabled={aiGenerating || !aiPrompt.trim()} className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition-all">
                    {aiGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    {aiGenerating ? 'AI đang viết JD...' : 'Viết JD Ngay'}
                 </button>
              </div>
           </motion.div>
        </div>
      )}

      {upgradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
           <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
           >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm border border-amber-200">
                    <Crown className="w-6 h-6 text-amber-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Nâng Cấp Gói VIP</h3>
                </div>
                <button onClick={() => setUpgradeModalOpen(false)} className="text-slate-400 hover:text-slate-600"><CloseIcon className="w-5 h-5"/></button>
              </div>
              <div className="p-6 space-y-4 text-center">
                 <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                   <Sparkles className="w-10 h-10" />
                   <div className="absolute top-0 right-0 bg-amber-500 rounded-full p-1 border-2 border-white">
                      <Crown className="w-4 h-4 text-white" />
                   </div>
                 </div>
                 <h4 className="text-lg font-bold text-slate-800">Mở khoá sức mạnh AI Dành Cho Nhà Tuyển Dụng</h4>
                 <p className="text-slate-500 text-sm">
                    Tính năng <strong>Tự động sinh JD bằng AI siêu liên kết (Mô hình Groq Llama-3)</strong> chỉ dành cho tài khoản <strong>LITE</strong> hoặc <strong>GROWTH</strong>.
                 </p>
                 <ul className="text-left text-sm text-slate-600 space-y-2 mt-4 bg-slate-50 p-4 rounded-xl">
                   <li className="flex items-center gap-2"><span className="text-green-500">✔</span> Tiết kiệm 90% thời gian tạo tin.</li>
                   <li className="flex items-center gap-2"><span className="text-green-500">✔</span> Format chuẩn SEO, hiển thị chuyên nghiệp.</li>
                   <li className="flex items-center gap-2"><span className="text-green-500">✔</span> AI tự động trích xuất kỹ năng để Matching.</li>
                 </ul>
              </div>
              <div className="p-4 border-t border-slate-100 grid grid-cols-2 gap-3 bg-white">
                 <button onClick={() => setUpgradeModalOpen(false)} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors">Để sau</button>
                 <button onClick={() => router.push('/recruiter/billing/plans')} className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-5 py-2.5 rounded-xl font-bold hover:shadow-lg hover:shadow-orange-500/25 transition-all">
                    Nâng Cấp Ngay
                 </button>
              </div>
           </motion.div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 space-y-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              Tiêu đề công việc <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200"
              placeholder="VD: Senior Frontend Developer (React/Next.js)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" /> Loại hình công việc
              </label>
              <select
                name="jobType"
                value={formData.jobType}
                onChange={handleChange}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white transition-all duration-200"
              >
                <option value="FULLTIME">Toàn thời gian (Full-time)</option>
                <option value="PARTTIME">Bán thời gian (Part-time)</option>
                <option value="INTERNSHIP">Thực tập (Internship)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" /> Gói Hiển Thị Nhắm Mục Tiêu
                <div className="relative group">
                  <Info className="w-4 h-4 text-slate-300 hover:text-slate-500 transition-colors cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[280px] p-4 bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-xl pointer-events-none">
                    <p className="font-bold mb-2 text-white text-sm">Các gói hiển thị:</p>
                    <ul className="space-y-2">
                      <li><span className="font-bold text-slate-200">BASIC (100 xu):</span> Hiển thị cơ bản, độ ưu tiên xuất hiện bình thường.</li>
                      <li><span className="font-bold text-amber-400">VIP (250 xu):</span> Nhãn Nổi bật, ưu tiên hiển thị cao, AI tối ưu từ khóa.</li>
                      <li><span className="font-bold text-red-400">URGENT (450 xu):</span> Ghim ở top đầu, gửi thông báo đẩy (Push) đến ứng viên.</li>
                    </ul>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-slate-900"></div>
                  </div>
                </div>
              </label>
              <select
                name="jobTier"
                value={formData.jobTier}
                onChange={handleChange}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white transition-all duration-200"
              >
                <option value="BASIC">Thường - BASIC (100 xu)</option>
                <option value="PROFESSIONAL">Nổi bật - VIP PROFESSIONAL (250 xu)</option>
                <option value="URGENT">Tuyển gấp - URGENT (450 xu)</option>
              </select>
              {formData.jobTier === 'BASIC' && (
                <p className="text-xs text-slate-500 mt-1 italic">
                  Gói Thường: Tin hiển thị cơ bản, độ ưu tiên xuất hiện bình thường.
                </p>
              )}
              {formData.jobTier === 'PROFESSIONAL' && (
                <p className="text-xs text-amber-600 mt-1 italic">
                  Gói VIP: Bổ sung nhãn Nổi bật, ưu tiên hiển thị cao, AI tự động tối ưu hóa từ khóa chuyên sâu.
                </p>
              )}
              {formData.jobTier === 'URGENT' && (
                <p className="text-xs text-rose-600 mt-1 italic">
                  Gói Tuyển gấp: Hiệu ứng bắt mắt nhất, ghim ở đầu trang, gửi thông báo đẩy trực tiếp đến ứng viên tiềm năng!
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" /> Chọn chi nhánh làm việc
              </label>
              <div className="relative">
                <div
                  className="w-full min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 cursor-pointer flex flex-wrap gap-2 items-center bg-white transition-all duration-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500 relative pr-10"
                  onClick={() => setLocationMenuOpen(!locationMenuOpen)}
                >
                  {formData.branchIds.length === 0 ? (
                    <span className="text-slate-400">Chọn chi nhánh của bạn...</span>
                  ) : (
                    formData.branchIds.map(id => {
                      const b = branches.find(br => br.branchId === id);
                      return b ? (
                        <span key={id} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-md border border-indigo-100 flex items-center gap-1">
                          {b.name}
                        </span>
                      ) : null;
                    })
                  )}
                  <ChevronDown className={`w-5 h-5 text-slate-400 absolute right-3 transition-transform ${locationMenuOpen ? 'rotate-180' : ''}`} />
                </div>

                {locationMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setLocationMenuOpen(false)}
                    />
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-72 overflow-y-auto z-20 p-2 grid grid-cols-1 gap-1">
                      {branches.length === 0 && (
                        <div className="p-3 text-sm text-slate-500 text-center">Chưa có chi nhánh nào. Hãy cấu hình ở Hồ Sơ Doanh Nghiệp.</div>
                      )}
                      {branches.map(branch => (
                        <label key={branch.branchId} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group border-b border-slate-50 last:border-0">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer flex-shrink-0"
                            checked={formData.branchIds.includes(branch.branchId)}
                            onChange={() => handleBranchToggle(branch.branchId)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex flex-col">
                            <span className="text-sm text-slate-700 font-bold group-hover:text-indigo-700">{branch.name}</span>
                            <span className="text-xs text-slate-500 line-clamp-1">{branch.address}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-slate-400" /> Mức lương tối thiểu (VNĐ)
              </label>
              <input
                type="number"
                name="salaryMin"
                value={formData.salaryMin}
                onChange={handleChange}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200"
                placeholder="VD: 10000000"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-slate-400" /> Mức lương tối đa (VNĐ)
              </label>
              <input
                type="number"
                name="salaryMax"
                value={formData.salaryMax}
                onChange={handleChange}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200"
                placeholder="VD: 25000000"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" /> Số lượng tuyển
              </label>
              <input
                type="number"
                name="vacancies"
                value={formData.vacancies}
                onChange={handleChange}
                min="1"
                className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" /> Yêu cầu kinh nghiệm (Text)
              </label>
              <input
                type="text"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200"
                placeholder="VD: 1 - 2 năm"
              />
            </div>
          </div>

          {/* Matching Engine Configuration */}
          <div className="space-y-4 pt-6 border-t border-slate-100">
            <h3 className="text-lg font-bold text-indigo-700 flex items-center gap-2">
              <Users className="w-5 h-5" /> Matching Engine Configuration
            </h3>
            <p className="text-sm text-slate-500">Các thông tin dưới đây dùng để thuật toán tự động tìm ứng viên phù hợp nhất.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Kỹ năng chuyên môn (Hard Skills) <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.hardSkills.map(skill => (
                    <span key={skill} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded flex items-center gap-1">
                      {skill}
                      <button type="button" onClick={() => removeSkill('hard', skill)} className="hover:text-red-500">×</button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={hardSkillInput}
                  onChange={(e) => setHardSkillInput(e.target.value)}
                  onKeyDown={addHardSkill}
                  placeholder="Gõ kỹ năng và nhấn Enter..."
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Kỹ năng mềm (Soft Skills)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.softSkills.map(skill => (
                    <span key={skill} className="px-2 py-1 bg-teal-100 text-teal-700 text-xs font-bold rounded flex items-center gap-1">
                      {skill}
                      <button type="button" onClick={() => removeSkill('soft', skill)} className="hover:text-red-500">×</button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={softSkillInput}
                  onChange={(e) => setSoftSkillInput(e.target.value)}
                  onKeyDown={addSoftSkill}
                  placeholder="Gõ kỹ năng mềm và nhấn Enter..."
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Số năm kinh nghiệm tối thiểu</label>
                <input
                  type="number"
                  name="minExperienceYears"
                  value={formData.minExperienceYears}
                  onChange={handleChange}
                  min="0"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="col-span-1 md:col-span-2 mt-4 bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 w-full flex items-start gap-4">
                 <div className="pt-1">
                   <div 
                     className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors relative flex items-center ${formData.autoInviteMatches ? 'bg-indigo-600' : 'bg-slate-300'}`}
                     onClick={() => setFormData(p => ({ ...p, autoInviteMatches: !p.autoInviteMatches }))}
                   >
                     <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${formData.autoInviteMatches ? 'translate-x-6' : 'translate-x-0'}`} />
                   </div>
                 </div>
                 <div className="flex-1">
                   <p className="font-bold text-slate-800 text-sm flex items-center gap-2">
                     Bật Tính Năng Tự Động Mở Khoá & Mời <span className="bg-amber-100 text-amber-700 text-[10px] uppercase px-2 py-0.5 rounded-full">AI Tự Động</span>
                   </p>
                   <p className="text-xs text-slate-500 mt-1 max-w-xl">
                     Khi tính năng này được bật, AI Matching Engine sẽ quét liên tục. Nếu tìm thấy ứng viên đạt <strong>trên 70%</strong> mức độ phù hợp, hệ thống sẽ tự động trừ lượt Mở CV của tin này (hoặc trừ xu trong ví) để lấy liên hệ ứng viên, và <strong>tự động nhắn tin mời phỏng vấn</strong> ngay lập tức thay bạn.
                   </p>
                 </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Mô tả công việc</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              required
              className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 resize-none"
              placeholder="Chi tiết về các nhiệm vụ, trách nhiệm công việc..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Yêu cầu ứng viên</label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              rows={3}
              required
              className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 resize-none"
              placeholder="Các kỹ năng, bằng cấp cần thiết..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Quyền lợi</label>
            <textarea
              name="benefits"
              value={formData.benefits}
              onChange={handleChange}
              rows={3}
              className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 resize-none"
              placeholder="Mức lương thưởng, chế độ bảo hiểm, khám sức khỏe..."
            />
          </div>
        </div>

        <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-100">
          {editJobId && !hasChanges && (
            <p className="text-sm text-slate-400 italic mr-auto">Thay đổi thông tin để hiện nút lưu</p>
          )}
          {!isFormValid && (
            <p className="text-sm text-amber-600 flex items-center gap-1 mr-auto">
              <Info className="w-4 h-4" />
              Cần có: Tiêu đề, Mô tả, Yêu cầu, ít nhất 1 Hard Skill
            </p>
          )}
          {isFormValid && hasChanges && (
            <button
              type="submit"
              disabled={saving}
              className="h-11 px-8 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/20 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-70"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {saving ? 'Đang Lưu...' : (editJobId ? 'Lưu Thay Đổi' : 'Gửi Yêu Cầu')}
            </button>
          )}
        </div>
      </form>
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
