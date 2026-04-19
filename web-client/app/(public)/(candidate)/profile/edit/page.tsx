'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Loader2,
  User,
  GraduationCap,
  Sparkles,
  Plus,
  X,
  ChevronDown,
  Briefcase,
  FileText,
  Target,
  Rocket,
  Trash2,
} from 'lucide-react';
import { profileApi, type CandidateProfile, type SkillInput, type ExperienceInput, type ProjectInput } from '@/lib/profile-api';
import { useAuthStore } from '@/stores/auth';
import toast from 'react-hot-toast';

const SKILL_LEVELS = [
  { value: 'BEGINNER', label: 'Cơ bản', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
  { value: 'INTERMEDIATE', label: 'Trung bình', color: 'bg-sky-100 text-sky-700 border-sky-200', dot: 'bg-sky-500' },
  { value: 'ADVANCED', label: 'Nâng cao', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
] as const;

function getLevelMeta(level: string) {
  return SKILL_LEVELS.find((l) => l.value === level) || SKILL_LEVELS[0];
}

export default function EditProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [university, setUniversity] = useState('');
  const [major, setMajor] = useState('');
  const [gpa, setGpa] = useState('');
  const [summary, setSummary] = useState('');
  const [skills, setSkills] = useState<SkillInput[]>([]);
  const [experiences, setExperiences] = useState<ExperienceInput[]>([]);
  const [projects, setProjects] = useState<ProjectInput[]>([]);
  const [desiredJob, setDesiredJob] = useState({
    jobTitle: '',
    expectedSalary: '',
    location: '',
    jobType: 'FULLTIME'
  });

  // Skill input state
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillInput['level']>('BEGINNER');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (isAuthenticated) {
      profileApi
        .getMe()
        .then((data) => {
          const c = data.candidate;
          setFullName(c?.fullName || '');
          setPhone(data.phoneNumber || '');
          setUniversity(c?.university || '');
          setMajor(c?.major || '');
          setGpa(c?.gpa?.toString() || '');
          setSummary(c?.summary || '');
          setSkills(
            c?.skills?.map((s) => ({
              skillName: s.skillName,
              level: (s.level as SkillInput['level']) || 'BEGINNER',
            })) || [],
          );
          setExperiences(c?.experiences || []);
          setProjects(c?.projects?.map(p => ({
            projectName: p.projectName,
            description: p.description || '',
            role: p.role,
            technology: p.technology
          })) || []);
          setDesiredJob(c?.desiredJob || {
            jobTitle: '',
            expectedSalary: '',
            location: '',
            jobType: 'FULLTIME'
          });
        })
        .catch(() => toast.error('Không thể tải hồ sơ.'))
        .finally(() => setLoading(false));
    }
  }, [authLoading, isAuthenticated, router]);

  const handleAddSkill = () => {
    const trimmed = newSkillName.trim();
    if (!trimmed) return;
    if (skills.some((s) => s.skillName.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Kỹ năng này đã tồn tại.');
      return;
    }
    setSkills([...skills, { skillName: trimmed, level: newSkillLevel }]);
    setNewSkillName('');
    setNewSkillLevel('BEGINNER');
  };

  const handleRemoveSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleChangeSkillLevel = (index: number, level: SkillInput['level']) => {
    setSkills(skills.map((s, i) => (i === index ? { ...s, level } : s)));
  };

  const handleAddExperience = () => {
    setExperiences([...experiences, { company: '', role: '', duration: '', description: '' }]);
  };

  const handleRemoveExperience = (idx: number) => {
    setExperiences(experiences.filter((_, i) => i !== idx));
  };

  const handleAddProject = () => {
    setProjects([...projects, { projectName: '', description: '', role: '', technology: '' }]);
  };

  const handleRemoveProject = (idx: number) => {
    setProjects(projects.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Họ và tên không được để trống.');
      return;
    }

    setSaving(true);
    try {
      await profileApi.updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        university: university.trim() || undefined,
        major: major.trim() || undefined,
        gpa: gpa ? parseFloat(gpa) : undefined,
        summary,
        skills,
        experiences,
        projects,
        desiredJob
      });
      toast.success('Cập nhật hồ sơ thành công!');
      router.push('/profile');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/profile"
            className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại hồ sơ
          </Link>
          <h1 className="text-xl font-bold text-slate-900">Cập nhật hồ sơ</h1>
        </div>

        {/* Section: Thông tin cá nhân */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Thông tin cá nhân</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Họ và tên *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Nguyễn Văn A"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Số điện thoại</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="0901 234 567"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
                <FileText size={14} className="text-slate-400" />
                Giới thiệu bản thân
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[120px]"
                placeholder="Viết một đoạn ngắn giới thiệu về bản thân, kỹ năng nổi bật và mục tiêu nghề nghiệp..."
              />
            </div>
          </div>
        </section>

        {/* Section: Mục tiêu sự nghiệp */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <Target className="w-4 h-4 text-orange-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Mục tiêu nghề nghiệp</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Vị trí mong muốn</label>
              <input
                type="text"
                value={desiredJob.jobTitle}
                onChange={(e) => setDesiredJob({ ...desiredJob, jobTitle: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Ví dụ: Frontend Developer"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Địa điểm mong muốn</label>
              <input
                type="text"
                value={desiredJob.location}
                onChange={(e) => setDesiredJob({ ...desiredJob, location: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Ví dụ: TP. Hồ Chí Minh"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mức lương kì vọng</label>
              <input
                type="text"
                value={desiredJob.expectedSalary}
                onChange={(e) => setDesiredJob({ ...desiredJob, expectedSalary: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Ví dụ: 15 - 20 triệu"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Hình thức làm việc</label>
              <select
                value={desiredJob.jobType}
                onChange={(e) => setDesiredJob({ ...desiredJob, jobType: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              >
                <option value="FULLTIME">Toàn thời gian</option>
                <option value="PARTTIME">Bán thời gian</option>
                <option value="INTERNSHIP">Thực tập</option>
              </select>
            </div>
          </div>
        </section>

        {/* Section: Học vấn */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Học vấn</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Trường học</label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm"
                placeholder="Đại học Khoa học Tự nhiên"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Chuyên ngành</label>
              <input
                type="text"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm"
                placeholder="Kỹ thuật Phần mềm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">GPA (thang 4.0)</label>
              <input
                type="number"
                step="0.01"
                value={gpa}
                onChange={(e) => setGpa(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm"
                placeholder="3.50"
              />
            </div>
          </div>
        </section>

        {/* Section: Kinh nghiệm làm việc */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-indigo-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Kinh nghiệm làm việc</h2>
            </div>
            <button
              type="button"
              onClick={handleAddExperience}
              className="p-2 border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="space-y-6">
            {experiences.map((exp, idx) => (
              <div key={idx} className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl relative group">
                <button
                  type="button"
                  onClick={() => handleRemoveExperience(idx)}
                  className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-opacity opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tên công ty</label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => {
                        const newExp = [...experiences];
                        newExp[idx].company = e.target.value;
                        setExperiences(newExp);
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vị trí / Chức vụ</label>
                    <input
                      type="text"
                      value={exp.role}
                      onChange={(e) => {
                        const newExp = [...experiences];
                        newExp[idx].role = e.target.value;
                        setExperiences(newExp);
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Thời gian</label>
                    <input
                      type="text"
                      value={exp.duration}
                      onChange={(e) => {
                        const newExp = [...experiences];
                        newExp[idx].duration = e.target.value;
                        setExperiences(newExp);
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mô tả công việc</label>
                    <textarea
                      value={exp.description}
                      onChange={(e) => {
                        const newExp = [...experiences];
                        newExp[idx].description = e.target.value;
                        setExperiences(newExp);
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm min-h-[80px]"
                    />
                  </div>
                </div>
              </div>
            ))}
            {experiences.length === 0 && (
              <p className="text-center py-4 text-slate-400 text-sm italic">Nhấn dấu cộng để thêm kinh nghiệm.</p>
            )}
          </div>
        </section>

        {/* Section: Dự án tiêu biểu */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center">
                <Rocket className="w-4 h-4 text-pink-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Dự án tiêu biểu</h2>
            </div>
            <button
              type="button"
              onClick={handleAddProject}
              className="p-2 border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="space-y-6">
            {projects.map((p, idx) => (
              <div key={idx} className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl relative group">
                <button
                  type="button"
                  onClick={() => handleRemoveProject(idx)}
                  className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tên dự án</label>
                    <input
                      type="text"
                      value={p.projectName}
                      onChange={(e) => {
                        const newP = [...projects];
                        newP[idx].projectName = e.target.value;
                        setProjects(newP);
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vai trò</label>
                    <input
                      type="text"
                      value={p.role}
                      onChange={(e) => {
                        const newP = [...projects];
                        newP[idx].role = e.target.value;
                        setProjects(newP);
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Công nghệ sử dụng</label>
                    <input
                      type="text"
                      value={p.technology}
                      onChange={(e) => {
                        const newP = [...projects];
                        newP[idx].technology = e.target.value;
                        setProjects(newP);
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                      placeholder="React, AWS, Node.js..."
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mô tả dự án</label>
                    <textarea
                      value={p.description}
                      onChange={(e) => {
                        const newP = [...projects];
                        newP[idx].description = e.target.value;
                        setProjects(newP);
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm min-h-[80px]"
                    />
                  </div>
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <p className="text-center py-4 text-slate-400 text-sm italic">Nhấn dấu cộng để thêm dự án.</p>
            )}
          </div>
        </section>

        {/* Section: Kỹ năng */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Kỹ năng</h2>
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm"
              placeholder="Nhập tên kỹ năng..."
            />
            <select
              value={newSkillLevel}
              onChange={(e) => setNewSkillLevel(e.target.value as SkillInput['level'])}
              className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white"
            >
              {SKILL_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
            >
              Thêm
            </button>
          </div>

          <div className="space-y-2">
            {skills.map((skill, idx) => {
              const meta = getLevelMeta(skill.level);
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
                    <span className="font-medium text-sm text-slate-800">{skill.skillName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={skill.level}
                      onChange={(e) =>
                        handleChangeSkillLevel(idx, e.target.value as SkillInput['level'])
                      }
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${meta.color}`}
                    >
                      {SKILL_LEVELS.map((l) => (
                        <option key={l.value} value={l.value}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-6 pb-20">
          <Link
            href="/profile"
            className="px-8 py-3 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition"
          >
            Hủy
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Lưu thay đổi hồ sơ
          </button>
        </div>
      </form>
    </div>
  );
}
