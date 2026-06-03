"use client";

import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { profileApi } from "@/lib/profile-api";
import { motion, AnimatePresence } from "framer-motion";

import { formSchema, FormValues } from "@/lib/schemas/cv-onboarding";
import { CVReviewHeader } from "./cv-review/CVReviewHeader";
import { CVReviewFooter } from "./cv-review/CVReviewFooter";
import { LOCATIONS } from "@/lib/constants";

import { User as IdentitySectionIcon, Briefcase as ExperienceSectionIcon, PlusCircle as OtherSectionIcon, Sparkles } from "lucide-react";
import { BasicInfoSection as IdentitySection } from "@/components/onboarding/cv-review/BasicInfoSection";
import { DesiredJobSection } from "@/components/onboarding/cv-review/DesiredJobSection";
import { SummarySection } from "@/components/onboarding/cv-review/SummarySection";
import { SkillsSection as SkillsSectionOnboarding } from "@/components/onboarding/cv-review/SkillsSection";
import { ExperienceSection as ExperienceSectionOnboarding } from "@/components/onboarding/cv-review/ExperienceSection";
import { ProjectsSection } from "@/components/onboarding/cv-review/ProjectsSection";
import { EducationSection as EducationSectionOnboarding } from "@/components/onboarding/cv-review/EducationSection";
import { AdditionalInfoSection } from "@/components/onboarding/cv-review/AdditionalInfoSection";
import { CertificationsSection } from "@/components/onboarding/cv-review/CertificationsSection";

interface CVReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: any;
  fileUrl: string;
  cvTitle: string;
  cvId?: string;
  onSuccess: (savedCv: any) => void;
  currentProfile?: any;
}

export function CVReviewModal({ isOpen, onClose, initialData, fileUrl, cvTitle, cvId, onSuccess, currentProfile }: CVReviewModalProps) {
  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: initialData?.personal_info?.full_name || initialData?.fullName || "",
      email: initialData?.personal_info?.email || initialData?.email || "",
      phone: initialData?.personal_info?.phone || initialData?.phone || "",
      skills: (() => {
        const skillsObj = initialData?.skills;
        const rawSkills = Array.isArray(skillsObj) 
          ? skillsObj 
          : (skillsObj && typeof skillsObj === 'object' ? [
              ...(skillsObj.hard_skills || []),
              ...(skillsObj.soft_skills || [])
            ] : []);
        
        return rawSkills.map((s: any) => {
          if (typeof s === 'string') return { skillName: s, level: 'BEGINNER' };
          return {
            skillName: s.skillName || s.name || s.skill || '',
            level: s.level || 'BEGINNER'
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
      totalYearsExp: initialData?.experience?.total_months ? Math.round(initialData.experience.total_months / 12) : (initialData?.totalYearsExp || 0),
      summary: initialData?.summary || "",
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
      languages: (initialData?.languages || []).map((l: any) => ({
        language: l.language || l.name || '',
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
      otherInfo: (initialData?.other_info || initialData?.otherInfo || []).map((o: any) => ({
        header: o.header || '',
        content: o.content || ''
      })),
      gpa: initialData?.personal_info?.gpa || initialData?.gpa || 0,
    },
  });

  const [activeTab, setActiveTab] = React.useState<'profile' | 'experience' | 'other'>('profile');

  React.useEffect(() => {
    if (isOpen) {
      methods.reset({
        fullName: initialData?.personal_info?.full_name || initialData?.fullName || "",
        email: initialData?.personal_info?.email || initialData?.email || "",
        phone: initialData?.personal_info?.phone || initialData?.phone || "",
        skills: (() => {
          const skillsObj = initialData?.skills;
          const rawSkills = Array.isArray(skillsObj) 
            ? skillsObj 
            : (skillsObj && typeof skillsObj === 'object' ? [
                ...(skillsObj.hard_skills || []),
                ...(skillsObj.soft_skills || [])
              ] : []);
          
          return rawSkills.map((s: any) => {
            if (typeof s === 'string') return { skillName: s, level: 'BEGINNER' };
            return {
              skillName: s.skillName || s.name || s.skill || '',
              level: s.level || 'BEGINNER'
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
        totalYearsExp: initialData?.experience?.total_months ? Math.round(initialData.experience.total_months / 12) : (initialData?.totalYearsExp || 0),
        summary: initialData?.summary || "",
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
        languages: (initialData?.languages || []).map((l: any) => ({
          language: l.language || l.name || '',
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
        otherInfo: (initialData?.other_info || initialData?.otherInfo || []).map((o: any) => ({
          header: o.header || '',
          content: o.content || ''
        })),
        gpa: initialData?.personal_info?.gpa || initialData?.gpa || 0,
      });
    }
  }, [isOpen, initialData, methods.reset]);

  if (!isOpen) return null;

  const onFormSubmit = async (data: FormValues) => {
    const toastId = toast.loading("Đang đồng bộ hồ sơ...");
    try {
      await profileApi.updateProfile({
        fullName: data.fullName,
        phone: data.phone,
        summary: data.summary,
        desiredJob: data.desiredJob,
        skills: data.skills,
        experiences: data.experience,
        projects: data.projects,
        university: data.education?.[0]?.school,
        major: data.education?.[0]?.major,
        degrees: (data.education || []).map((edu: any) => ({
          name: edu.degree || "Cử nhân",
          school: edu.school,
          major: edu.major,
          issueDate: edu.duration,
        })),
        gpa: Number(data.gpa || 0),
        languages: (data.languages || []).map((l: any) => ({
          name: l.language,
          level: l.level || "BEGINNER"
        })),
        interests: data.interests || [],
        certifications: (data.certifications || []).map((c: any) => ({
          name: c.name,
          organization: c.organization || undefined,
          issueDate: c.issueDate || undefined,
        })),
        otherInfo: data.otherInfo || []
      });

      let response;
      if (cvId) {
        response = await api.patch(`/candidates/cv/${cvId}`, {
          cvTitle,
          fileUrl,
          isMain: true,
          parsedData: { ...data },
        });
      } else {
        response = await api.post("/candidates/cv", {
          cvTitle,
          fileUrl,
          isMain: true,
          parsedData: { ...data },
        });
      }

      toast.success("Hồ sơ đã được xác nhận và cập nhật thành công!", { id: toastId });
      onSuccess(response.data);
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi lưu hồ sơ.", { id: toastId });
    }
  };

  const onFormError = (errors: any) => {
    console.error("Validation Errors:", errors);
    toast.error("Vui lòng kiểm tra lại thông tin. Một số trường chưa hợp lệ.");
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-[98vw] max-h-[98vh] flex flex-col bg-white/95 backdrop-blur-2xl rounded-3xl overflow-hidden z-10 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] border border-white/20"
      >
        {/* Top Accent Gradient */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-400 to-cyan-500" />
        <CVReviewHeader onClose={onClose} />

        {/* Tab Selection Bar */}
        <div className="px-8 py-2 bg-white/50 border-b border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === 'profile' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <IdentitySectionIcon size={12} />
                Hồ sơ
              </button>
              <button
                onClick={() => setActiveTab('experience')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === 'experience' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <ExperienceSectionIcon size={12} />
                Kinh nghiệm
              </button>
              <button
                onClick={() => setActiveTab('other')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === 'other' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <OtherSectionIcon size={12} />
                Khác
              </button>
           </div>

           <div className="hidden md:flex items-center gap-3 text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest italic">AI đã sẵn sàng phân tích</span>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC]">
          <FormProvider {...methods}>
            <form id="cv-review-form" onSubmit={methods.handleSubmit(onFormSubmit as any, onFormError)}>
               <AnimatePresence mode="wait">
                  {activeTab === 'profile' && (
                    <motion.div
                      key="profile"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <IdentitySection currentProfile={currentProfile} />
                        <DesiredJobSection />
                      </div>
                      <SummarySection />
                      <SkillsSectionOnboarding />
                    </motion.div>
                  )}

                  {activeTab === 'experience' && (
                    <motion.div
                      key="experience"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                    >
                      <ExperienceSectionOnboarding />
                      <ProjectsSection />
                    </motion.div>
                  )}

                  {activeTab === 'other' && (
                    <motion.div
                      key="other"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="max-w-4xl mx-auto space-y-6"
                    >
                      <EducationSectionOnboarding />
                      <CertificationsSection />
                      <AdditionalInfoSection />
                    </motion.div>
                  )}
               </AnimatePresence>
            </form>
          </FormProvider>
        </div>
        <CVReviewFooter onClose={onClose} isSubmitting={methods.formState.isSubmitting} />
      </motion.div>
    </div>
  );
}
