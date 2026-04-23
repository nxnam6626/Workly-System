"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  User,
  GraduationCap,
  Sparkles,
  Plus,
  X,
  Briefcase,
  Target,
  Rocket,
  Trash2,
  CheckCircle2,
  Info,
  Camera,
  Banknote,
  Languages,
  Heart,
  Wand2,
  Hash,
  MapPin
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { profileApi, type SkillInput, type ExperienceInput, type ProjectInput, type UpdateProfileDto } from "@/lib/profile-api";
import { useAuthStore } from "@/stores/auth";
import toast from "react-hot-toast";

// --- Design Tokens ---
const SKILL_LEVELS = [
  { value: "BEGINNER", label: "Cơ bản", color: "bg-amber-50 text-amber-600 border-amber-100", dot: "bg-amber-400" },
  { value: "INTERMEDIATE", label: "Trung bình", color: "bg-sky-50 text-sky-600 border-sky-100", dot: "bg-sky-500" },
  { value: "ADVANCED", label: "Nâng cao", color: "bg-emerald-50 text-emerald-600 border-emerald-100", dot: "bg-emerald-500" },
] as const;

const GENDERS = ["Nam", "Nữ", "Khác"];
const DEGREES = ["Trung cấp", "Cao đẳng", "Đại học", "Thạc sĩ", "Tiến sĩ", "Khác"];

// --- Sections Configuration ---
const SECTIONS = [
  { id: "personal", label: "Thông tin cá nhân", icon: User, color: "blue" },
  { id: "summary", label: "Giới thiệu bản thân", icon: Sparkles, color: "emerald" },
  { id: "education", label: "Học vấn & Bằng cấp", icon: GraduationCap, color: "indigo" },
  { id: "experience", label: "Kinh nghiệm làm việc", icon: Briefcase, color: "violet" },
  { id: "skills", label: "Kỹ năng & Chuyên môn", icon: Wand2, color: "cyan" },
  { id: "projects", label: "Dự án tiêu biểu", icon: Rocket, color: "pink" },
  { id: "goals", label: "Mục tiêu & Kỳ vọng", icon: Target, color: "orange" },
  { id: "interests", label: "Sở thích & Khác", icon: Heart, color: "rose" },
] as const;

export default function EditProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user: authUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("personal");

  // --- Form State ---
  const [formData, setFormData] = useState<any>({
    fullName: "",
    phone: "",
    university: "",
    major: "",
    gpa: "",
    summary: "",
    gender: "Nam",
    birthYear: new Date().getFullYear() - 22,
    currentSalary: "",
    degree: "Đại học",
    industries: [] as string[],
    skills: [] as SkillInput[],
    experiences: [] as ExperienceInput[],
    projects: [] as ProjectInput[],
    softSkills: [] as string[],
    interests: [] as string[],
    desiredJob: {
      jobTitle: "",
      expectedSalary: "",
      location: "",
      jobType: "FULLTIME",
    },
    languages: [] as { name: string; level: string }[],
  });

  // UI Local State
  const [newSkill, setNewSkill] = useState({ name: "", level: "BEGINNER" as SkillInput["level"] });
  const [newLanguage, setNewLanguage] = useState({ name: "", level: "Cơ bản" });
  const [newIndustry, setNewIndustry] = useState("");
  const [newSoftSkill, setNewSoftSkill] = useState("");
  const [newInterest, setNewInterest] = useState("");

  const sectionRefs: any = {
    personal: useRef(null),
    summary: useRef(null),
    education: useRef(null),
    experience: useRef(null),
    skills: useRef(null),
    projects: useRef(null),
    goals: useRef(null),
    interests: useRef(null),
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      profileApi.getMe().then((data) => {
        const c = data.candidate;
        setFormData({
          fullName: c?.fullName || "",
          phone: data.phoneNumber || "",
          university: c?.university || "",
          major: c?.major || "",
          gpa: c?.gpa ? c.gpa.toString() : "",
          summary: c?.summary || "",
          gender: c?.gender || "Nam",
          birthYear: c?.birthYear || (new Date().getFullYear() - 22),
          currentSalary: c?.currentSalary || "",
          degree: c?.degree || "Đại học",
          industries: c?.industries || [],
          skills: c?.skills?.map((s: any) => ({ skillName: s.skillName, level: s.level })) || [],
          experiences: c?.experiences || [],
          projects: c?.projects || [],
          softSkills: c?.softSkills || [],
          interests: c?.interests || [],
          languages: c?.languages || [],
          desiredJob: c?.desiredJob || {
            jobTitle: "",
            expectedSalary: "",
            location: "",
            jobType: "FULLTIME",
          }
        });
        setLoading(false);
      }).catch(() => {
        toast.error("Không thể tải hồ sơ.");
        setLoading(false);
      });
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -70% 0px",
      threshold: 0,
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);
    Object.values(sectionRefs).forEach((ref: any) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, [loading]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 120;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const handleSave = async () => {
    if (!formData.fullName.trim()) {
      toast.error("Họ và tên là bắt buộc.");
      scrollToSection("personal");
      return;
    }

    setSaving(true);
    try {
      const updateDto: UpdateProfileDto = {
        ...formData,
        gpa: formData.gpa ? parseFloat(formData.gpa) : undefined,
      };
      await profileApi.updateProfile(updateDto);
      toast.success("Hợp nhất dữ liệu thành công!");
      router.push("/profile");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi lưu.");
    } finally {
      setSaving(false);
    }
  };

  // Helper adding logic
  function addSkill() {
    if (!newSkill.name.trim()) return;
    if (formData.skills.some((s: any) => s.skillName.toLowerCase() === newSkill.name.trim().toLowerCase())) {
       toast.error("Kỹ năng đã có.");
       return;
    }
    setFormData({...formData, skills: [...formData.skills, { skillName: newSkill.name.trim(), level: newSkill.level }]});
    setNewSkill({...newSkill, name: ""});
  }

  function addSoftSkill() {
     if (!newSoftSkill.trim()) return;
     if (formData.softSkills.includes(newSoftSkill.trim())) return;
     setFormData({...formData, softSkills: [...formData.softSkills, newSoftSkill.trim()]});
     setNewSoftSkill("");
  }

  function addLanguage() {
     if (!newLanguage.name.trim()) return;
     setFormData({...formData, languages: [...formData.languages, { name: newLanguage.name.trim(), level: newLanguage.level.trim() || 'Cơ bản' }]});
     setNewLanguage({ name: "", level: "Cơ bản" });
  }

  function addIndustry() {
     if (!newIndustry.trim()) return;
     if (formData.industries.includes(newIndustry.trim())) return;
     setFormData({...formData, industries: [...formData.industries, newIndustry.trim()]});
     setNewIndustry("");
  }

  function addInterest() {
     if (!newInterest.trim()) return;
     if (formData.interests.includes(newInterest.trim())) return;
     setFormData({...formData, interests: [...formData.interests, newInterest.trim()]});
     setNewInterest("");
  }

  if (authLoading || loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-blue-100 selection:text-blue-900">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-100/30 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-24 relative z-10">
        <header className="mb-16">
          <Link href="/profile" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-xs uppercase tracking-widest mb-6 transition-all active:scale-95">
            <ArrowLeft className="w-4 h-4" /> Quay lại hồ sơ
          </Link>
          <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
            <div className="relative group">
              <div className="w-32 h-32 rounded-[40px] bg-white p-1 shadow-2xl shadow-blue-200/50 relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                <div className="w-full h-full rounded-[36px] bg-slate-100 flex items-center justify-center overflow-hidden uppercase font-black text-slate-400 text-3xl">
                   {authUser?.avatar ? <img src={authUser.avatar} alt="Avatar" className="w-full h-full object-cover" /> : authUser?.email?.[0] || 'A'}
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px] cursor-pointer">
                   <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm">
                <Sparkles className="w-3 h-3 text-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Profile Studio v2.0</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Thiết lập sự nghiệp</h1>
              <p className="text-slate-500 font-medium text-lg max-w-2xl">Mô tả bản thân một cách chi tiết để AI có thể kết nối bạn với những cơ hội phù hợp nhất.</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start pb-40">
          <aside className="lg:col-span-3 sticky top-32 hidden lg:block">
            <nav className="space-y-2 bg-white/50 backdrop-blur-xl p-4 rounded-[40px] border border-white shadow-2xl shadow-slate-200/40">
              <div className="px-5 py-3"><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Mục lục hồ sơ</p></div>
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-[24px] transition-all duration-300 group ${
                    activeSection === section.id ? "bg-slate-900 text-white shadow-2xl shadow-slate-400/20 translate-x-1" : "text-slate-500 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${activeSection === section.id ? "bg-white/10" : "bg-slate-50 group-hover:bg-slate-900 group-hover:text-white"}`}>
                    <section.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold tracking-tight">{section.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          <div className="lg:col-span-9 space-y-12">
            {/* Section Components implemented as inline for speed and consistency */}
            <SectionWrapper id="personal" sectionRef={sectionRefs.personal} title="Thông tin cá nhân" icon={User} color="blue">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-10">
                <PremiumInput label="Họ và tên" value={formData.fullName} onChange={(val: string) => setFormData({...formData, fullName: val})} required />
                <PremiumInput label="Số điện thoại" value={formData.phone} onChange={(val: string) => setFormData({...formData, phone: val})} type="tel" />
                <div className="space-y-3.5"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-3">Giới tính</label>
                  <div className="flex p-1.5 bg-slate-100 rounded-2xl gap-1">{GENDERS.map(g => (
                    <button key={g} onClick={() => setFormData({...formData, gender: g})} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${formData.gender === g ? "bg-white text-slate-900 shadow-xl" : "text-slate-400"}`}>{g}</button>
                  ))}</div>
                </div>
                <PremiumInput label="Năm sinh" value={formData.birthYear} onChange={(val: string) => setFormData({...formData, birthYear: parseInt(val) || 0})} type="number" />
                <PremiumInput label="Lương hiện tại" value={formData.currentSalary} onChange={(val: string) => setFormData({...formData, currentSalary: val})} placeholder="VD: 15 triệu" icon={Banknote} />
                <PremiumInput label="Vị trí hiện tại" value={formData.desiredJob.jobTitle} onChange={(val: string) => setFormData({...formData, desiredJob: {...formData.desiredJob, jobTitle: val}})} icon={Briefcase} />
              </div>
            </SectionWrapper>

            <SectionWrapper id="summary" sectionRef={sectionRefs.summary} title="Giới thiệu bản thân" icon={Sparkles} color="emerald">
              <div className="p-10 space-y-6">
                <textarea value={formData.summary} onChange={(e) => setFormData({...formData, summary: e.target.value})} className="w-full px-10 py-8 bg-slate-50 border border-slate-100 rounded-[40px] focus:bg-white focus:border-blue-600 outline-none transition-all font-medium min-h-[220px] text-lg leading-relaxed shadow-inner" placeholder="..." />
              </div>
            </SectionWrapper>

            <SectionWrapper id="education" sectionRef={sectionRefs.education} title="Học vấn & Bằng cấp" icon={GraduationCap} color="indigo">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-10">
                <PremiumInput label="Trường học" value={formData.university} onChange={(val: string) => setFormData({...formData, university: val})} />
                <PremiumInput label="Chuyên ngành" value={formData.major} onChange={(val: string) => setFormData({...formData, major: val})} />
                <div className="space-y-3.5"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-3">Bằng cấp</label>
                  <select value={formData.degree} onChange={(e) => setFormData({...formData, degree: e.target.value})} className="w-full px-8 py-4.5 bg-slate-50 border border-slate-100 rounded-[24px] focus:bg-white outline-none font-bold text-slate-800 h-[66px]">
                     {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <PremiumInput label="GPA (4.0)" value={formData.gpa} onChange={(val: string) => setFormData({...formData, gpa: val})} type="number" />
              </div>
            </SectionWrapper>

            <SectionWrapper id="experience" sectionRef={sectionRefs.experience} title="Kinh nghiệm làm việc" icon={Briefcase} color="violet" action={<button onClick={() => setFormData({...formData, experiences: [...formData.experiences, { company: "", role: "", duration: "", description: "" }]})} className="px-6 py-2.5 bg-violet-50 text-violet-600 rounded-full font-black text-xs hover:bg-violet-600 hover:text-white transition-all">+ THÊM</button>}>
              <div className="p-8 space-y-6">
                {formData.experiences.map((exp: any, idx: number) => (
                  <div key={idx} className="p-8 rounded-[36px] bg-slate-50/50 border border-slate-100 relative group">
                    <button onClick={() => setFormData({...formData, experiences: formData.experiences.filter((_: any, i: number) => i !== idx)})} className="absolute top-6 right-6 text-slate-300 hover:text-red-500"><Trash2 className="w-5 h-5"/></button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2"><PremiumInput label="Công ty" value={exp.company} onChange={(val: string) => { const n = [...formData.experiences]; n[idx].company = val; setFormData({...formData, experiences: n}); }} /></div>
                      <PremiumInput label="Chức danh" value={exp.role} onChange={(val: string) => { const n = [...formData.experiences]; n[idx].role = val; setFormData({...formData, experiences: n}); }} />
                      <PremiumInput label="Thời gian" value={exp.duration} onChange={(val: string) => { const n = [...formData.experiences]; n[idx].duration = val; setFormData({...formData, experiences: n}); }} />
                      <div className="md:col-span-2"><textarea value={exp.description} onChange={(e) => { const n = [...formData.experiences]; n[idx].description = e.target.value; setFormData({...formData, experiences: n}); }} className="w-full p-6 bg-white border border-slate-100 rounded-2xl outline-none" placeholder="Mô tả công việc..."/></div>
                    </div>
                  </div>
                ))}
                {formData.experiences.length === 0 && <EmptyState icon={Briefcase} label="Trống" />}
              </div>
            </SectionWrapper>

            <SectionWrapper id="skills" sectionRef={sectionRefs.skills} title="Kỹ năng chuyên môn" icon={Wand2} color="cyan">
               <div className="p-10 space-y-10">
                  <div className="flex flex-col sm:flex-row gap-4 p-4 bg-cyan-50 rounded-[32px]">
                    <input value={newSkill.name} onChange={(e) => setNewSkill({...newSkill, name: e.target.value})} className="flex-1 px-8 py-4 bg-white border-none rounded-[24px] outline-none font-bold" placeholder="VD: React, Node, SQL..." />
                    <select value={newSkill.level} onChange={(e) => setNewSkill({...newSkill, level: e.target.value as any})} className="px-6 py-4 bg-white border-none rounded-[24px] outline-none font-bold">
                       {SKILL_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                    <button onClick={addSkill} className="px-8 py-4 bg-cyan-600 text-white rounded-[24px] font-black">THÊM</button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {formData.skills.map((s: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 pl-5 pr-3 py-2.5 bg-white border border-slate-100 rounded-full shadow-sm">
                        <div className={`w-2 h-2 rounded-full ${SKILL_LEVELS.find(l => l.value === s.level)?.dot || 'bg-slate-300'}`} />
                        <span className="text-sm font-black text-slate-800">{s.skillName}</span>
                        <button onClick={() => setFormData({...formData, skills: formData.skills.filter((_: any, idx: number) => idx !== i)})}><X className="w-4 h-4 text-slate-300 hover:text-red-500"/></button>
                      </div>
                    ))}
                  </div>
                  <hr className="border-slate-50"/>
                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> Kỹ năng mềm</label>
                    <div className="flex flex-wrap gap-2">
                       {formData.softSkills.map((s: string, i: number) => (
                         <span key={i} className="px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100 flex items-center gap-2">{s} <X onClick={() => setFormData({...formData, softSkills: formData.softSkills.filter((_: any, idx: number) => idx !== i)})} className="w-3.5 h-3.5 cursor-pointer opacity-40 hover:opacity-100"/></span>
                       ))}
                       <input value={newSoftSkill} onChange={(e) => setNewSoftSkill(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSoftSkill()} placeholder="+ Thêm..." className="px-5 py-2.5 bg-slate-100 rounded-full text-xs font-bold w-32 outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all" />
                    </div>
                  </div>
               </div>
            </SectionWrapper>

            <SectionWrapper id="projects" sectionRef={sectionRefs.projects} title="Dự án tiêu biểu" icon={Rocket} color="pink" action={<button onClick={() => setFormData({...formData, projects: [...formData.projects, { projectName: "", description: "", role: "", technology: "" }]})} className="px-6 py-2.5 bg-pink-50 text-pink-600 rounded-full font-black text-xs hover:bg-pink-600 hover:text-white transition-all">+ THÊM</button>}>
               <div className="p-8 space-y-6">
                {formData.projects.map((p: any, idx: number) => (
                  <div key={idx} className="p-8 rounded-[36px] bg-slate-50 border border-slate-100 relative group">
                    <button onClick={() => setFormData({...formData, projects: formData.projects.filter((_: any, i: number) => i !== idx)})} className="absolute top-6 right-6 text-slate-300 hover:text-red-500"><Trash2 className="w-5 h-5"/></button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2"><PremiumInput label="Tên dự án" value={p.projectName} onChange={(val: string) => { const n = [...formData.projects]; n[idx].projectName = val; setFormData({...formData, projects: n}); }} /></div>
                      <PremiumInput label="Vai trò" value={p.role} onChange={(val: string) => { const n = [...formData.projects]; n[idx].role = val; setFormData({...formData, projects: n}); }} />
                      <PremiumInput label="Công nghệ" value={p.technology} onChange={(val: string) => { const n = [...formData.projects]; n[idx].technology = val; setFormData({...formData, projects: n}); }} />
                      <div className="md:col-span-2"><textarea value={p.description} onChange={(e) => { const n = [...formData.projects]; n[idx].description = e.target.value; setFormData({...formData, projects: n}); }} className="w-full p-6 bg-white border border-slate-100 rounded-2xl outline-none" placeholder="Mô tả dự án..."/></div>
                    </div>
                  </div>
                ))}
                {formData.projects.length === 0 && <EmptyState icon={Rocket} label="Chưa có dự án" />}
              </div>
            </SectionWrapper>

            <SectionWrapper id="goals" sectionRef={sectionRefs.goals} title="Mục tiêu & Kỳ vọng" icon={Target} color="orange">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-10">
                 <PremiumInput label="Vị trí mong muốn" value={formData.desiredJob.jobTitle} onChange={(val: string) => setFormData({...formData, desiredJob: {...formData.desiredJob, jobTitle: val}})} />
                 <PremiumInput label="Lương kỳ vọng" value={formData.desiredJob.expectedSalary} onChange={(val: string) => setFormData({...formData, desiredJob: {...formData.desiredJob, expectedSalary: val}})} icon={Banknote} />
                 <PremiumInput label="Khu vực" value={formData.desiredJob.location} onChange={(val: string) => setFormData({...formData, desiredJob: {...formData.desiredJob, location: val}})} icon={MapPin} />
                 <div className="space-y-3.5"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-3">Hình thức</label>
                    <div className="flex p-1.5 bg-slate-100 rounded-2xl gap-1">{["FULLTIME", "PARTTIME", "INTERNSHIP"].map(t => (
                      <button key={t} onClick={() => setFormData({...formData, desiredJob: {...formData.desiredJob, jobType: t}})} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${formData.desiredJob.jobType === t ? "bg-white text-slate-900 shadow-xl" : "text-slate-400"}`}>{t}</button>
                    ))}</div>
                 </div>
              </div>
            </SectionWrapper>

            <SectionWrapper id="interests" sectionRef={sectionRefs.interests} title="Sở thích & Khác" icon={Heart} color="rose">
               <div className="p-10 space-y-10">
                  <div className="space-y-4"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-3 flex items-center gap-2"><Heart className="w-4 h-4 text-rose-500"/> Sở thích</label>
                    <div className="flex flex-wrap gap-2">
                       {formData.interests.map((it: string, i: number) => (
                         <span key={i} className="px-5 py-2.5 bg-rose-50 text-rose-700 rounded-full text-xs font-bold border border-rose-100 flex items-center gap-2">{it} <X onClick={() => setFormData({...formData, interests: formData.interests.filter((_: any, idx: number) => idx !== i)})} className="w-3.5 h-3.5 cursor-pointer opacity-40 hover:opacity-100"/></span>
                       ))}
                       <input value={newInterest} onChange={(e) => setNewInterest(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addInterest()} placeholder="+ Thêm..." className="px-5 py-2.5 bg-slate-100 rounded-full text-xs font-bold w-32 outline-none focus:bg-white focus:ring-1 focus:ring-rose-500 transition-all" />
                    </div>
                  </div>
                  <div className="space-y-4"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-3 flex items-center gap-2"><Hash className="w-4 h-4 text-slate-400"/> Ngành nghề quan tâm</label>
                    <div className="flex flex-wrap gap-2">
                       {formData.industries.map((ind: string, i: number) => (
                         <span key={i} className="px-5 py-2.5 bg-slate-900 text-white rounded-full text-xs font-bold flex items-center gap-2">{ind} <X onClick={() => setFormData({...formData, industries: formData.industries.filter((_: any, idx: number) => idx !== i)})} className="w-3.5 h-3.5 cursor-pointer opacity-40 hover:opacity-100"/></span>
                       ))}
                       <input value={newIndustry} onChange={(e) => setNewIndustry(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addIndustry()} placeholder="+ Ngành Công nghệ..." className="px-8 py-3 bg-slate-100 rounded-full text-xs font-bold w-64 outline-none focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all" />
                    </div>
                  </div>
               </div>
            </SectionWrapper>
          </div>
        </div>

        {/* Floating Bar */}
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center bg-slate-900/90 backdrop-blur-3xl px-8 py-5 rounded-[40px] border border-white/20 shadow-2xl z-40 gap-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
           <div className="hidden md:flex flex-col border-r border-white/10 pr-8">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Tiến độ hồ sơ</p>
              <div className="flex items-center gap-3">
                 <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: "85%" }} className="h-full bg-blue-400" /></div>
                 <span className="text-white font-black text-sm">85%</span>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <button onClick={() => router.push('/profile')} className="px-6 py-4 text-white/50 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors">Hủy bỏ</button>
              <button onClick={handleSave} disabled={saving} className="px-10 py-4 bg-blue-600 text-white rounded-[24px] font-black text-sm uppercase tracking-wider flex items-center gap-3 hover:bg-blue-500 transition-all active:scale-95 disabled:grayscale">
                 {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> LƯU HỒ SƠ</>}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

// Support components
function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="relative"><div className="w-20 h-20 border-[3px] border-slate-100 rounded-[32px] animate-spin duration-[3000ms]" /><div className="absolute inset-0 flex items-center justify-center"><Rocket className="w-8 h-8 text-blue-600 animate-bounce" /></div></div>
      <p className="mt-8 text-slate-400 font-black animate-pulse uppercase tracking-[0.3em] text-[10px]">Loading Luminous Ether</p>
    </div>
  );
}

function SectionWrapper({ children, id, sectionRef, title, icon: Icon, color, action }: any) {
  const colorMap: any = { blue: "bg-blue-50 text-blue-600", emerald: "bg-emerald-50 text-emerald-600", indigo: "bg-indigo-50 text-indigo-600", violet: "bg-violet-50 text-violet-600", cyan: "bg-cyan-50 text-cyan-600", pink: "bg-pink-50 text-pink-600", orange: "bg-orange-50 text-orange-600", rose: "bg-rose-50 text-rose-600" };
  return (
    <motion.section id={id} ref={sectionRef} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} className="bg-white/80 backdrop-blur-2xl rounded-[48px] border border-white shadow-2xl shadow-slate-300/30 overflow-hidden group">
      <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between">
         <div className="flex items-center gap-5">
           <div className={`w-14 h-14 rounded-3xl flex items-center justify-center shrink-0 ${colorMap[color]}`}><Icon className="w-7 h-7" /></div>
           <div><p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Section</p><h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">{title}</h2></div>
         </div>
         {action}
      </div>
      {children}
    </motion.section>
  );
}

function PremiumInput({ label, value, onChange, placeholder, type = "text", required, icon: Icon }: any) {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <div className="space-y-3.5 group/input">
      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-3 flex items-center gap-1 group-focus-within/input:text-blue-600 transition-colors">{label} {required && <span className="text-red-500 font-bold">*</span>}</label>
      <div className={`relative flex items-center bg-slate-50 border border-slate-100 rounded-[28px] transition-all p-1.5 ${isFocused ? "bg-white border-blue-600 ring-[10px] ring-blue-500/5 shadow-xl shadow-blue-500/10" : "hover:border-slate-300"}`}>
        {Icon && <div className={`ml-4 shrink-0 ${isFocused ? "text-blue-600" : "text-slate-300"}`}><Icon className="w-5 h-5" /></div>}
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} className="w-full px-5 py-4 bg-transparent outline-none font-bold text-slate-800 placeholder:text-slate-300" placeholder={placeholder} required={required} />
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, label }: any) {
  return (
    <div className="py-20 flex flex-col items-center justify-center text-slate-200 border-2 border-dashed border-slate-50 rounded-[40px]"><Icon className="w-12 h-12 mb-4 opacity-10" /><p className="font-bold text-sm opacity-20">{label}</p></div>
  );
}
