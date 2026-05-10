"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { profileApi, type CandidateProfile } from "@/lib/profile-api";
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
        languages: (data.languages || []).map((l: any) => ({
          name: l.language,
          level: l.level || "BEGINNER"
        })),
        interests: data.interests || [],
        otherInfo: data.otherInfo || []
      });

      await profileApi.updateCv(cvId, {
        cvTitle: cvData.cvTitle,
        fileUrl: cvData.fileUrl,
        isMain: true,
        parsedData: { ...data },
      });

      toast.success("Hồ sơ đã được xác nhận và cập nhật thành công!", { id: toastId });
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
      {/* Header Page */}
      <header className="px-8 py-4 bg-slate-900 text-white sticky top-0 z-50 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        
        <div className="max-w-[1400px] mx-auto relative z-10 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-white/10 rounded-xl transition-all border border-white/5"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">AI Review Dashboard</span>
              </div>
              <h1 className="text-xl font-black tracking-tighter">Xác nhận thông tin hồ sơ</h1>
            </div>
            <p className="hidden lg:block text-slate-500 font-medium text-[11px] max-w-sm leading-snug border-l border-slate-800 pl-6">
              Vui lòng tinh chỉnh các thông tin mà AI đã nhận diện từ bản CV của bạn để đảm bảo độ chính xác cao nhất.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">File: {cvData?.cvTitle}</span>
             </div>
          </div>
        </div>
      </header>

      {/* Navigation Tab Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-[72px] z-40">
        <div className="max-w-[1400px] mx-auto px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'profile' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <User size={14} />
              Thông tin cá nhân
            </button>
            <button
              onClick={() => setActiveTab('experience')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'experience' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Briefcase size={14} />
              Kinh nghiệm & Dự án
            </button>
            <button
              onClick={() => setActiveTab('other')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'other' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <PlusCircle size={14} />
              Thông tin khác
            </button>
          </div>
          
          <div className="flex gap-4">
             <button 
                onClick={() => router.back()}
                className="px-6 py-2.5 bg-slate-50 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all active:scale-95 border border-slate-200"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                form="cv-review-form"
                disabled={methods.formState.isSubmitting}
                className="px-8 py-2.5 bg-blue-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all shadow-xl shadow-blue-100 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
              >
                {methods.formState.isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang đồng bộ...
                  </>
                ) : (
                  <>
                    Xác nhận & Đồng bộ Profile
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
          </div>
        </div>
      </div>

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
