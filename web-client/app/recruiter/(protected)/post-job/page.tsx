'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { Briefcase, Loader2, Save, MapPin, DollarSign, Calendar, Users, Clock, ChevronDown, Plus, Crown, X as CloseIcon } from 'lucide-react';
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
  locationCity: '',
  deadline: '',
  hardSkills: [] as string[],
  softSkills: [] as string[],
  minExperienceYears: 0,
  jobTier: 'BASIC',
};

function PostJobForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editJobId = searchParams.get('jobId');
  const [formData, setFormData] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(!!editJobId);
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  const [hardSkillInput, setHardSkillInput] = useState('');
  const [softSkillInput, setSoftSkillInput] = useState('');
  const { accessToken } = useAuthStore();

  const allLocations = ["Làm việc từ xa (Remote)", "Hà Nội", "Hồ Chí Minh", "Đà Nẵng", ...LOCATIONS.filter((l: string) => !['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng'].includes(l))];
  const selectedLocations = formData.locationCity.split(',').map(s => s.trim()).filter(Boolean);

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
            locationCity: data.locationCity || '',
            deadline: data.deadline ? new Date(data.deadline).toISOString().split('T')[0] : '',
            hardSkills: data.structuredRequirements?.hardSkills || [],
            softSkills: data.structuredRequirements?.softSkills || [],
            minExperienceYears: data.structuredRequirements?.minExperienceYears || 0,
            jobTier: data.jobTier || 'BASIC',
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

  const handleLocationToggle = (loc: string) => {
    let updated = [...selectedLocations];
    if (updated.includes(loc)) {
      updated = updated.filter(l => l !== loc);
    } else {
      updated.push(loc);
    }
    setFormData(prev => ({ ...prev, locationCity: updated.join(', ') }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'minExperienceYears' ? Number(value) : value }));
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
        deadline: formData.deadline ? new Date(formData.deadline).getTime() : null,
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
      <div className="border-b border-indigo-100 pb-5">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
          <Briefcase className="h-8 w-8 text-indigo-600" />
          {editJobId ? 'Chỉnh Sửa Tin Tuyển Dụng' : 'Gửi Yêu Cầu Tuyển Dụng'}
        </h1>
        <p className="text-slate-500 mt-2 text-lg">
          {editJobId ? 'Cập nhật lại thông tin tuyển dụng, chức danh và yêu cầu.' : 'Điền thông tin chi tiết và gửi yêu cầu để Admin phê duyệt trước khi tin được hiển thị.'}
        </p>
      </div>

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
                <option value="CONTRACT">Hợp đồng (Contract)</option>
                <option value="REMOTE">Làm việc từ xa (Remote)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" /> Gói Hiển Thị Nhắm Mục Tiêu
              </label>
              <select
                name="jobTier"
                value={formData.jobTier}
                onChange={handleChange}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white transition-all duration-200"
              >
                <option value="BASIC">Thường - BASIC (100 xu)</option>
                <option value="PROFESSIONAL">⭐️ Nổi bật - VIP PROFESSIONAL (250 xu)</option>
                <option value="URGENT">🔥 Tuyển gấp - URGENT (450 xu)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" /> Địa điểm khu vực
              </label>
              <div className="relative">
                <div
                  className="w-full min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 cursor-pointer flex flex-wrap gap-2 items-center bg-white transition-all duration-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500 relative pr-10"
                  onClick={() => setLocationMenuOpen(!locationMenuOpen)}
                >
                  {selectedLocations.length === 0 ? (
                    <span className="text-slate-400">VD: Hà Nội, Hồ Chí Minh...</span>
                  ) : (
                    selectedLocations.map(loc => (
                      <span key={loc} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-md border border-indigo-100 flex items-center gap-1">
                        {loc}
                      </span>
                    ))
                  )}
                  <ChevronDown className={`w-5 h-5 text-slate-400 absolute right-3 transition-transform ${locationMenuOpen ? 'rotate-180' : ''}`} />
                </div>

                {locationMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setLocationMenuOpen(false)}
                    />
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-72 overflow-y-auto z-20 p-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
                      {allLocations.map(loc => (
                        <label key={loc} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                            checked={selectedLocations.includes(loc)}
                            onChange={() => handleLocationToggle(loc)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="text-sm text-slate-700 font-medium group-hover:text-indigo-700">{loc}</span>
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
                <Calendar className="w-4 h-4 text-slate-400" /> Hạn nộp hồ sơ
              </label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
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

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="h-11 px-8 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/20 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-70"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'Đang Lưu...' : (editJobId ? 'Lưu Thay Đổi' : 'Gửi Yêu Cầu')}
          </button>
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
