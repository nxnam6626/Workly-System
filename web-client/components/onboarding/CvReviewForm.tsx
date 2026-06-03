'use client';

import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Loader2, User, Briefcase, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import { formSchema, FormValues } from '@/lib/schemas/cv-onboarding';
import { BasicInfoSection } from './cv-review/BasicInfoSection';
import { SkillsSection } from './cv-review/SkillsSection';
import { ExperienceSection } from './cv-review/ExperienceSection';
import { ProjectsSection } from './cv-review/ProjectsSection';
import { SummarySection } from './cv-review/SummarySection';
import { DesiredJobSection } from './cv-review/DesiredJobSection';
import { AdditionalInfoSection } from './cv-review/AdditionalInfoSection';
import { CertificationsSection } from './cv-review/CertificationsSection';
import { LOCATIONS } from '@/lib/constants';

interface CvReviewFormProps {
  initialData: any;
  currentProfile?: any;
  onSubmit: (data: FormValues) => void;
  isSaving: boolean;
}

export const CvReviewForm: React.FC<CvReviewFormProps> = ({ initialData, currentProfile, onSubmit: onSubmitProp, isSaving }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'experience' | 'other'>('profile');

  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: initialData?.personal_info?.full_name || initialData?.fullName || '',
      email: initialData?.personal_info?.email || initialData?.email || '',
      phone: initialData?.personal_info?.phone || initialData?.phone || '',
      gpa: initialData?.personal_info?.gpa || initialData?.gpa || 0,
      skills: (() => {
        const skillsObj = initialData?.skills;
        const rawSkills = Array.isArray(skillsObj) 
          ? skillsObj 
          : (skillsObj && typeof skillsObj === 'object' ? [
              ...(skillsObj.hard_skills || []),
              ...(skillsObj.soft_skills || [])
            ] : []);
        
        const validLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
        
        return rawSkills.map((s: any) => {
          if (typeof s === 'string') return { skillName: s, level: 'BEGINNER' };
          
          let level = (s.level || 'BEGINNER').toUpperCase();
          if (!validLevels.includes(level)) {
            if (level.includes('ADVANCED') || level.includes('GIỎI') || level.includes('EXPERT') || level.includes('PRO')) level = 'ADVANCED';
            else if (level.includes('INTERMEDIATE') || level.includes('KHÁ') || level.includes('MID')) level = 'INTERMEDIATE';
            else level = 'BEGINNER';
          }
          
          return {
            skillName: s.skillName || s.name || s.skill || '',
            level
          };
        });
      })(),
      experience: (initialData?.experience?.roles || initialData?.experience || []).map((exp: any) => ({
        company: exp.company_or_project || exp.company || '',
        role: exp.job_title || exp.role || '',
        duration: exp.duration || '',
        description: exp.description || ''
      })),
      education: (() => {
        const edu = initialData?.education;
        const educationArray = Array.isArray(edu) ? edu : (edu && typeof edu === 'object' ? [edu] : []);
        return educationArray.map((e: any) => ({
          school: e.institution || e.school || '',
          degree: e.degree || '',
          major: e.major || '',
          duration: e.duration || '',
          description: e.description || ''
        }));
      })(),
      projects: (initialData?.projects || []).map((p: any) => ({
        projectName: p.projectName || p.project_name || '',
        role: p.role || '',
        description: p.description || '',
        technology: p.technology || '',
      })),
      desiredJob: {
        jobTitle: initialData?.desired_job?.jobTitle || initialData?.desiredJob?.jobTitle || '',
        expectedSalary: initialData?.desired_job?.expectedSalary || initialData?.desiredJob?.expectedSalary || '',
        location: (() => {
          const rawLoc = initialData?.desired_job?.location || initialData?.desiredJob?.location;
          if (!rawLoc) return '';
          const cleanLoc = String(rawLoc).toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s]/g, "")
            .replace(/\s+/g, ' ').trim();
          
          if (cleanLoc.includes('ho chi minh') || cleanLoc.includes('hcm') || cleanLoc.includes('sai gon')) {
            return 'Hồ Chí Minh';
          }
          if (cleanLoc.includes('ha noi') || cleanLoc.includes('hn')) {
            return 'Hà Nội';
          }
          if (cleanLoc.includes('da nang') || cleanLoc.includes('dn')) {
            return 'Đà Nẵng';
          }
          if (cleanLoc.includes('hai phong') || cleanLoc.includes('hp')) {
            return 'Hải Phòng';
          }
          if (cleanLoc.includes('can tho') || cleanLoc.includes('ct')) {
            return 'Cần Thơ';
          }
          if (cleanLoc.includes('binh duong') || cleanLoc.includes('bd')) {
            return 'Bình Dương';
          }
          if (cleanLoc.includes('dong nai') || cleanLoc.includes('dn')) {
            return 'Đồng Nai';
          }
          
          const found = LOCATIONS.find(loc => {
            const normalizedLoc = loc.toLowerCase()
              .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
              .replace(/[^a-z0-9\s]/g, "");
            return cleanLoc.includes(normalizedLoc) || normalizedLoc.includes(cleanLoc);
          });
          
          return found || '';
        })(),
        jobType: (() => {
          const rawType = initialData?.desired_job?.jobType || initialData?.desiredJob?.jobType;
          if (!rawType) return 'FULLTIME';
          const t = String(rawType).toUpperCase().replace(/_/g, '').trim();
          if (t === 'FULLTIME' || t.includes('TOÀN THỜI GIAN') || t.includes('TOANTHOIGIAN') || t === 'FULL_TIME') return 'FULLTIME';
          if (t === 'PARTTIME' || t.includes('BÁN THỜI GIAN') || t.includes('BANTHOIGIAN') || t === 'PART_TIME') return 'PARTTIME';
          if (t === 'REMOTE' || t.includes('TỪ XA') || t.includes('TUXA') || t.includes('LÀM VIỆC TỪ XA') || t.includes('LAMVIECTUXA')) return 'REMOTE';
          return 'FULLTIME';
        })(),
        jobLevel: (() => {
          const rawLevel = initialData?.desired_job?.jobLevel || initialData?.desiredJob?.jobLevel;
          if (!rawLevel) return '';
          const l = String(rawLevel).toUpperCase().replace(/_/g, '').trim();
          if (l === 'INTERN' || l.includes('THỰC TẬP') || l.includes('THUCTAP')) return 'INTERN';
          if (l === 'STAFF' || l.includes('NHÂN VIÊN') || l.includes('NHANVIEN') || l.includes('CHUYÊN VIÊN') || l.includes('CHUYENVIEN')) return 'STAFF';
          if (l === 'MANAGER' || l.includes('TRƯỞNG NHÓM') || l.includes('TRUONGNHOM') || l.includes('TRƯỞNG PHÒNG') || l.includes('TRUONGPHONG') || l.includes('QUẢN LÝ') || l.includes('QUANLY')) return 'MANAGER';
          if (l === 'DIRECTOR' || l.includes('GIÁM ĐỐC') || l.includes('GIAMDOCK') || l.includes('CẤP CAO') || l.includes('CAPCAO')) return 'DIRECTOR';
          return '';
        })()
      },
      totalYearsExp: initialData?.experience?.total_months ? Math.round(initialData.experience.total_months / 12) : (initialData?.totalYearsExp || 0),
      summary: initialData?.summary || '',
      languages: (initialData?.languages || []).map((l: any) => ({
        language: l.language || '',
        level: l.level || ''
      })),
      interests: initialData?.interests || [],
      certifications: Array.isArray(initialData?.certifications)
        ? initialData.certifications.map((c: any) => ({
            name: typeof c === 'string' ? c : c.name || '',
            organization: typeof c === 'string' ? '' : c.organization || c.issuer || '',
            issueDate: typeof c === 'string' ? '' : c.issueDate || '',
          }))
        : [],
      otherInfo: (initialData?.other_info || []).map((o: any) => ({
        header: o.header || '',
        content: o.content || ''
      })),
    }
  });

  const onSubmit = (data: FormValues) => {
    onSubmitProp(data);
  };

  const onError = (errors: any) => {
    console.error('Validation Errors:', errors);

    const fieldLabels: Record<string, string> = {
      fullName: 'Họ và tên',
      email: 'Email',
      phone: 'Số điện thoại',
      skills: 'Kỹ năng',
      experience: 'Kinh nghiệm làm việc',
      education: 'Lịch sử học vấn',
      projects: 'Dự án',
      desiredJob: 'Công việc mong muốn',
      summary: 'Giới thiệu bản thân'
    };

    // Lấy danh sách các trường bị lỗi
    const errorFields = Object.keys(errors);
    
    if (errorFields.length > 0) {
      // Hiển thị thông báo chi tiết cho từng nhóm lỗi chính
      errorFields.forEach((field) => {
        const label = fieldLabels[field] || field;
        const error = errors[field];
        
        if (error.message) {
          // Lỗi ở trường cấp 1 (fullName, email...)
          toast.error(`${label}: ${error.message}`, { id: `error-${field}` });
        } else if (Array.isArray(error) || typeof error === 'object') {
          // Lỗi ở các mảng (education, experience...) hoặc object (desiredJob)
          toast.error(`Vui lòng kiểm tra lại mục: ${label}`, { id: `error-${field}` });
        }
      });
    }
  };

  return (
    <FormProvider {...methods}>
      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={methods.handleSubmit(onSubmit, onError)}
        className="w-full pb-8 space-y-4"
      >
        {/* Compact toolbar: title left + tabs right */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 bg-white/60 backdrop-blur-md p-3 rounded-[1.25rem] border border-white shadow-sm">
          <div className="pl-2">
            <h2 className="text-base font-bold text-gray-900">Kiểm tra thông tin</h2>
            <p className="text-[11px] text-gray-400">AI đã trích xuất, vui lòng kiểm tra lại</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {/* Tab pills */}
            <div className="flex items-center gap-1 p-1 bg-gray-100/80 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${activeTab === 'profile'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                <User size={13} />
                Hồ sơ
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('experience')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${activeTab === 'experience'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                <Briefcase size={13} />
                Kinh nghiệm
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('other')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${activeTab === 'other'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                <PlusCircle size={13} />
                Khác
              </button>
            </div>

            {/* Quick Top Save Button (Optional/Secondary) */}
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-xs shadow-md shadow-sky-500/20 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 shrink-0"
              title="Lưu nhanh"
            >
              {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
              <span className="hidden sm:inline">Lưu</span>
            </button>
          </div>
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === 'profile' ? (
            <motion.div
              key="tab-profile"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <BasicInfoSection currentProfile={currentProfile} />
                <DesiredJobSection currentProfile={currentProfile} />
              </div>
              <SummarySection />
              <SkillsSection />
            </motion.div>
          ) : activeTab === 'experience' ? (
            <motion.div
              key="tab-experience"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-4"
            >
              <ExperienceSection />
              <ProjectsSection />
            </motion.div>
          ) : activeTab === 'other' ? (
            <motion.div
              key="tab-other"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              <CertificationsSection />
              <AdditionalInfoSection />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Main Form Action Box */}
        <div className="mt-8 pt-4 pb-12">
          <div className="bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Bạn đã kiểm tra xong?</h3>
              <p className="text-xs text-gray-500 mt-1">Hồ sơ này sẽ được lưu và sử dụng cho các lần ứng tuyển sau.</p>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-sky-500/25 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 shrink-0"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Hoàn tất & Lưu hồ sơ
            </button>
          </div>
        </div>
      </motion.form>
    </FormProvider>
  );
};
