"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { profileApi, type CandidateProfile } from "@/lib/profile-api";
import { useAuthStore } from "@/stores/auth";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, User, Briefcase, PlusCircle, ChevronRight, ArrowLeft } from "lucide-react";

import { formSchema, FormValues } from "@/lib/schemas/cv-onboarding";
import { BasicInfoSection as IdentitySection } from "@/components/onboarding/cv-review/BasicInfoSection";
import { DesiredJobSection } from "@/components/onboarding/cv-review/DesiredJobSection";
import { SummarySection } from "@/components/onboarding/cv-review/SummarySection";
import { SkillsSection as SkillsSectionOnboarding } from "@/components/onboarding/cv-review/SkillsSection";
import { ExperienceSection as ExperienceSectionOnboarding } from "@/components/onboarding/cv-review/ExperienceSection";
import { ProjectsSection } from "@/components/onboarding/cv-review/ProjectsSection";
import { EducationSection as EducationSectionOnboarding } from "@/components/onboarding/cv-review/EducationSection";
import { AdditionalInfoSection } from "@/components/onboarding/cv-review/AdditionalInfoSection";

export default function CVReviewPage() {
  const params = useParams();
  const router = useRouter();
  const cvId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [cvData, setCvData] = useState<any>(null);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'experience' | 'other'>('profile');

  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const me = await profileApi.getMe();
        setProfile(me);
        
        const cv = me.candidate?.cvs?.find(c => c.cvId === cvId);
        if (!cv) {
          toast.error("Không tìm thấy CV yêu cầu.");
          router.push("/profile/cv-management");
          return;
        }
        
        setCvData(cv);
        const initialData = cv.parsedData || {};
        
        methods.reset({
          fullName: initialData.personal_info?.full_name || initialData.fullName || me.candidate?.fullName || "",
          email: initialData.personal_info?.email || initialData.email || me.email || "",
          phone: initialData.personal_info?.phone || initialData.phone || me.phoneNumber || "",
          skills: (() => {
            const skillsObj = initialData.skills;
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
          experience: (initialData.experience?.roles || initialData.experience || []).map((exp: any) => ({
            company: exp.company_or_project || exp.company || '',
            role: exp.job_title || exp.role || '',
            duration: exp.duration || '',
            description: exp.description || ''
          })),
          education: (() => {
            const edu = initialData.education;
            const educationArray = Array.isArray(edu) ? edu : (edu && typeof edu === 'object' ? [edu] : []);
            return educationArray.map((e: any) => ({
              school: e.institution || e.school || '',
              degree: e.degree || '',
              major: e.major || '',
              duration: e.duration || '',
              description: e.description || ''
            }));
          })(),
          totalYearsExp: initialData.experience?.total_months ? Math.round(initialData.experience.total_months / 12) : (initialData.totalYearsExp || 0),
          summary: initialData.summary || "",
          projects: (initialData.projects || []).map((p: any) => ({
            projectName: p.projectName || p.project_name || '',
            role: p.role || '',
            description: p.description || '',
            technology: p.technology || '',
          })),
          desiredJob: {
            jobTitle: initialData.desired_job?.jobTitle || initialData.desiredJob?.jobTitle || '',
            expectedSalary: initialData.desired_job?.expectedSalary || initialData.desiredJob?.expectedSalary || '',
            location: initialData.desired_job?.location || initialData.desiredJob?.location || '',
            jobType: initialData.desired_job?.jobType || initialData.desiredJob?.jobType || 'FULLTIME'
          },
          languages: (initialData.languages || []).map((l: any) => ({
            language: l.language || l.name || '',
            level: l.level || ''
          })),
          interests: initialData.interests || [],
          industries: (initialData.categories || initialData.industries || []).join(', '),
          otherInfo: (initialData.other_info || initialData.otherInfo || []).map((o: any) => ({
            header: o.header || '',
            content: o.content || ''
          })),
          gpa: initialData.personal_info?.gpa || initialData.gpa || 0,
        });
      } catch (error) {
        console.error("Failed to fetch data", error);
        toast.error("Không thể tải thông tin CV.");
        router.push("/profile/cv-management");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [cvId, methods, router]);

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
        gpa: Number(data.gpa || 0),
        totalYearsExp: Number(data.totalYearsExp || 0),
        languages: (data.languages || []).map((l: any) => ({
          name: l.language,
          level: l.level || "BEGINNER"
        })),
        interests: data.interests || [],
        industries: data.industries ? data.industries.split(',').map((i: string) => i.trim()).filter(Boolean) : [],
        otherInfo: data.otherInfo || []
      });

      await profileApi.updateCv(cvId, {
        cvTitle: cvData.cvTitle,
        fileUrl: cvData.fileUrl,
        isMain: true,
        parsedData: { ...data },
      });

      toast.success("Hồ sơ đã được xác nhận và cập nhật thành công!", { id: toastId });
      
      // ĐỒNG BỘ STATE MỚI NHẤT LÊN THANH NAVBAR/HEADER NGAY LẬP TỨC
      await useAuthStore.getState().checkAuth();
      
      router.push("/profile");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi lưu hồ sơ.", { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Đang chuẩn bị dữ liệu review...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Simplified Unified Light Header - Positioned below global navbar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-16 z-40 shadow-sm backdrop-blur-md bg-white/90">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-3 flex flex-row items-center justify-between gap-4">
          
          {/* Left: Identity & Context */}
          <div className="flex items-center gap-3 min-w-0">
            <button 
              onClick={() => router.back()}
              className="hidden sm:flex p-2 hover:bg-slate-100 text-slate-500 rounded-xl transition-all border border-slate-100 shrink-0"
              title="Quay lại"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-3 min-w-0">
              <h1 className="text-[15px] sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5 whitespace-nowrap shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-blue-500 fill-blue-100 shrink-0" />
                Xác nhận hồ sơ
              </h1>
              <div className="hidden md:flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-md border border-slate-100 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-[10px] font-medium text-slate-500 truncate max-w-[120px]">
                  {cvData?.cvTitle}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Navigation Tabs */}
          <div className="flex items-center gap-0.5 p-0.5 bg-slate-100/70 rounded-lg border border-slate-200/50">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-md text-[12px] font-medium transition-all whitespace-nowrap ${
                activeTab === 'profile' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User size={13} />
              <span className="hidden sm:inline">Cá nhân</span>
            </button>
            <button
              onClick={() => setActiveTab('experience')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-md text-[12px] font-medium transition-all whitespace-nowrap ${
                activeTab === 'experience' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Briefcase size={13} />
              <span className="hidden sm:inline">Kinh nghiệm</span>
            </button>
            <button
              onClick={() => setActiveTab('other')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-md text-[12px] font-medium transition-all whitespace-nowrap ${
                activeTab === 'other' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <PlusCircle size={13} />
              <span className="hidden lg:inline">Thông tin khác</span>
              <span className="inline lg:hidden">Khác</span>
            </button>
          </div>
          
          {/* Right: Action CTA */}
          <div className="flex items-center gap-2 shrink-0">
             <button 
                onClick={() => router.back()}
                className="hidden sm:block px-3 py-1.5 text-slate-500 font-semibold text-[12px] rounded-lg hover:bg-slate-100 hover:text-slate-800 transition-all whitespace-nowrap"
              >
                Hủy
              </button>
              <button
                type="submit"
                form="cv-review-form"
                disabled={methods.formState.isSubmitting}
                className="px-4 py-2 bg-slate-900 text-white font-semibold text-[12px] rounded-lg hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-100 transition-all shadow-sm disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {methods.formState.isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang lưu</span>
                  </>
                ) : (
                  <>
                    <span>Đồng bộ hồ sơ</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full p-8">
        <FormProvider {...methods}>
          <form id="cv-review-form" onSubmit={methods.handleSubmit(onFormSubmit)}>
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <IdentitySection currentProfile={profile} />
                    <DesiredJobSection />
                  </div>
                  <SummarySection />
                  <SkillsSectionOnboarding />
                </motion.div>
              )}

              {activeTab === 'experience' && (
                <motion.div
                  key="experience"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                >
                  <ExperienceSectionOnboarding />
                  <ProjectsSection />
                </motion.div>
              )}

              {activeTab === 'other' && (
                <motion.div
                  key="other"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="max-w-5xl mx-auto space-y-8"
                >
                  <EducationSectionOnboarding />
                  <AdditionalInfoSection />
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </FormProvider>
      </main>
      
      {/* Scroll to Top / Helper elements can go here */}
    </div>
  );
}
