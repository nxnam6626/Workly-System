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
} from 'lucide-react';
import { profileApi, type CandidateProfile, type SkillInput } from '@/lib/profile-api';
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
  const [skills, setSkills] = useState<SkillInput[]>([]);

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
          setFullName(data.candidate?.fullName || '');
          setPhone(data.phoneNumber || '');
          setUniversity(data.candidate?.university || '');
          setMajor(data.candidate?.major || '');
          setGpa(data.candidate?.gpa?.toString() || '');
          setSkills(
            data.candidate?.skills?.map((s) => ({
              skillName: s.skillName,
              level: (s.level as SkillInput['level']) || 'BEGINNER',
            })) || [],
          );
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
        skills,
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
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
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
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                placeholder="Nguyễn Văn A"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                placeholder="0901 234 567"
              />
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
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                placeholder="Đại học Khoa học Tự nhiên"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Chuyên ngành</label>
              <input
                type="text"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                placeholder="Kỹ thuật Phần mềm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">GPA (thang 4.0)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="4"
                value={gpa}
                onChange={(e) => setGpa(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                placeholder="3.50"
              />
            </div>
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

          {/* Add skill form */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              placeholder="Nhập tên kỹ năng (VD: React, Python...)"
            />
            <div className="relative">
              <select
                value={newSkillLevel}
                onChange={(e) => setNewSkillLevel(e.target.value as SkillInput['level'])}
                className="appearance-none pl-3 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer transition-all"
              >
                {SKILL_LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Thêm
            </button>
          </div>

          {/* Skills list */}
          {skills.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              Chưa có kỹ năng nào. Hãy thêm kỹ năng để nhà tuyển dụng tìm thấy bạn!
            </div>
          ) : (
            <div className="space-y-2">
              {skills.map((skill, idx) => {
                const meta = getLevelMeta(skill.level);
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-slate-200 transition-colors"
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
                        className={`appearance-none text-xs font-bold px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${meta.color}`}
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
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2 pb-8">
          <Link
            href="/profile"
            className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Hủy
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm shadow-blue-500/20"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Lưu thay đổi
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
