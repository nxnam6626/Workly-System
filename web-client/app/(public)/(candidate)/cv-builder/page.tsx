"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  Trash2,
  Briefcase,
  GraduationCap,
  Award,
  ChevronRight,
  ChevronLeft,
  Save,
  CheckCircle2,
  Upload,
  Loader2,
  ArrowLeft,
  Sparkles,
  Download,
  Maximize,
  X
} from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { profileApi } from "@/lib/profile-api";
import { useAuthStore } from "@/stores/auth";
import CVPreviewTemplate from "@/components/candidates/CVPreviewTemplate";
import { useRef } from "react";

const cvSchema = z.object({
  fullName: z.string().min(2, "Họ tên quá ngắn"),
  avatar: z.string().optional(),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().min(10, "Số điện thoại không hợp lệ"),
  jobTitle: z.string().min(2, "Vui lòng nhập vị trí ứng tuyển"),
  skills: z.array(z.string()).min(1, "Vui lòng nhập ít nhất 1 kỹ năng"),
  experience: z.array(z.object({
    company: z.string().min(1, "Tên công ty không được để trống"),
    role: z.string().min(1, "Vị trí không được để trống"),
    years: z.number().min(0),
    description: z.string().optional(),
  })),
  education: z.array(z.object({
    school: z.string().min(1, "Tên trường không được để trống"),
    degree: z.string().min(1, "Bằng cấp không được để trống"),
    major: z.string().min(1, "Chuyên ngành không được để trống"),
  })),
  totalYearsExp: z.number().min(0, "Số năm kinh nghiệm không thể âm"),
  summary: z.string().optional(),
});

type CVFormData = z.infer<typeof cvSchema>;

const STEPS = [
  { id: "basic", title: "Thông tin cơ bản", icon: FileText },
  { id: "experience", title: "Kinh nghiệm", icon: Briefcase },
  { id: "education", title: "Học vấn", icon: GraduationCap },
  { id: "skills", title: "Kỹ năng & Tóm tắt", icon: Award },
  { id: "preview", title: "Xem trước & Xuất & Lưu", icon: Download },
];

export default function CVBuilderPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFullscreenView, setIsFullscreenView] = useState(false);
  const cvRef = useRef<HTMLDivElement>(null);
  const fullscreenCvRef = useRef<HTMLDivElement>(null);

  const { register, control, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<CVFormData>({
    resolver: zodResolver(cvSchema),
    defaultValues: {
      fullName: (user as any)?.fullName || (user as any)?.name || "",
      avatar: user?.avatar || "",
      email: user?.email || "",
      phone: "",
      jobTitle: "",
      skills: [],
      experience: [],
      education: [],
      totalYearsExp: 0,
      summary: "",
    },
  });

  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({
    control,
    name: "experience",
  });

  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({
    control,
    name: "education",
  });

  const [skillInput, setSkillInput] = useState("");
  const currentSkills = watch("skills") || [];

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/cv-builder");
    }
  }, [authLoading, isAuthenticated, router]);

  const onFormSubmit = async (data: CVFormData) => {
    try {
      const payload = {
        cvTitle: `CV_${data.fullName}_${new Date().toLocaleDateString('vi-VN')}`,
        isMain: true, // Thường CV vừa tạo sẽ làm CV chính
        parsedData: data,
        fileUrl: "", // Không có file vật lý vì đang tạo thủ công
      };

      await api.post("/candidates/cv", payload);
      toast.success("Tạo hồ sơ thành công!");
      router.push("/profile/cv-management");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi lưu hồ sơ.");
    }
  };

  const handleDownloadPDF = async () => {
    // 1. Phân giải đúng Target Element tùy theo ngữ cảnh (Modal vs Page)
    const targetElement = cvRef.current;
    if (!targetElement) return;

    try {
      setIsDownloading(true);
      // Đợi UI stabilize
      await new Promise(resolve => setTimeout(resolve, 300));

      // [ANTI-CROP HACK v8: The Fixed Camera Flash]
      // Lỗi trang trắng/bị cắt (cropped) là do thẻ cha có `overflow-x-auto` và màn hình sếp quá bé,
      // khiến trình duyệt tự động "cắt" mất phần đuôi CV trong Layout Engine.
      // Giải pháp: Clone CV ra 1 phiên bản độc lập hoàn toàn, dán đè lên màn hình với `position: fixed`
      // để đảm bảo nó hiển thị 100% khổ A4 mà không bị cắt bởi bất kỳ thẻ cha nào!
      const clone = targetElement.cloneNode(true) as HTMLElement;
      clone.style.position = 'fixed';
      clone.style.top = '0px';
      clone.style.left = '0px';
      clone.style.zIndex = '999999';
      clone.style.transform = 'none'; // Ensure no scale is actively applied
      clone.style.transformOrigin = 'top left';
      // Tạo hiệu ứng chớp nền để che giấu trang web bên dưới
      clone.style.boxShadow = '0 0 0 100vmax rgba(255,255,255,0.95)';
      document.body.appendChild(clone);

      const rawName = watch('fullName') || 'Workly';
      const rawJob = watch('jobTitle') || 'Candidate';
      
      const sanitizeString = (str: string) => {
         return str.normalize('NFD')
                   .replace(/[\u0300-\u036f]/g, '')
                   .replace(/đ/g, 'd').replace(/Đ/g, 'D')
                   .replace(/\s+/g, '')
                   .replace(/[^a-zA-Z0-9-]/g, '');
      };

      const finalFilename = `CV_${sanitizeString(rawName)}_${sanitizeString(rawJob)}.pdf`;

      const html2pdf = (await import('html2pdf.js')).default;
      const opt: any = {
        margin: 0,
        filename: finalFilename,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: {
          scale: 2,           // Render chất lượng cao
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: 800,         // Force exact dimensions to prevent layout recalculation cuts
          height: 1131,
          windowWidth: 800,
          windowHeight: 1131
        },
        jsPDF: { unit: 'px', format: [800, 1131], orientation: 'portrait' }
      };

      // Generate PDF directly from the unclipped fixed clone
      const pdfBlob = await html2pdf().set(opt).from(clone).output('blob');
      
      // Xóa bản Clone ngay lập tức sau khi chụp xong
      document.body.removeChild(clone);

      // 2. Map and trigger local physical download
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = opt.filename;
      link.click();
      URL.revokeObjectURL(blobUrl);

      // 3. Persist purely generated PDF physical payload into candidates DB and Supabase
      const file = new File([pdfBlob], opt.filename, { type: 'application/pdf' });
      const uploadRes = await profileApi.uploadCvOnly(file);

      if (uploadRes && uploadRes.cvId) {
        // Sync with actively parsed properties seamlessly
        await profileApi.updateCv(uploadRes.cvId, { parsedData: watch() });

        toast.success("Tải xuống và Cập nhật hồ sơ hệ thống thành công!");
        router.push("/profile/cv-management");
      }

    } catch (error: any) {
      console.error(error);
      toast.error('Lỗi khi tải PDF: ' + (error.message || ''));
    } finally {
      setIsDownloading(false);
    }
  };

  const addSkill = () => {
    if (skillInput && !currentSkills.includes(skillInput)) {
      setValue("skills", [...currentSkills, skillInput]);
      setSkillInput("");
    }
  };

  const removeSkill = (index: number) => {
    const newSkills = currentSkills.filter((_, i) => i !== index);
    setValue("skills", newSkills);
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-18 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors hidden sm:flex"
            >
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">Trình tạo CV thông minh</h1>
              <p className="text-sm text-slate-500 font-medium hidden sm:block">Xây dựng hồ sơ ấn tượng chỉ trong vài phút</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/onboarding/import-cv')}
              className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            >
              <Upload className="w-4 h-4" />
              Nhập CV từ PDF
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Stepper Side */}
          <aside className="lg:col-span-4 lg:sticky lg:top-32 h-fit">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <nav className="space-y-2">
                {STEPS.map((step, index) => (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(index)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${currentStep === index
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
                        : "text-slate-500 hover:bg-slate-50"
                      }`}
                  >
                    <div className={`p-2 rounded-xl ${currentStep === index ? "bg-white/20" : "bg-slate-100 text-slate-400"}`}>
                      <step.icon className="w-5 h-5 font-bold" />
                    </div>
                    <div className="text-left">
                      <div className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${currentStep === index ? "text-blue-100" : "text-slate-400"}`}>Bước {index + 1}</div>
                      <div className="text-sm font-bold">{step.title}</div>
                    </div>
                  </button>
                ))}
              </nav>

              <div className="mt-8 p-5 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-blue-100/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="text-sm font-bold text-blue-900 tracking-tight">AI Checklist</div>
                </div>
                <ul className="space-y-2.5">
                  <li className="flex items-center gap-2 text-xs font-medium text-blue-700/80">
                    <div className={`w-2 h-2 rounded-full ${watch("totalYearsExp") > 0 ? "bg-emerald-500" : "bg-slate-300"}`} />
                    Có kinh nghiệm làm việc
                  </li>
                  <li className="flex items-center gap-2 text-xs font-medium text-blue-700/80">
                    <div className={`w-2 h-2 rounded-full ${currentSkills.length >= 3 ? "bg-emerald-500" : "bg-slate-300"}`} />
                    Ít nhất 3 kỹ năng nổi bật
                  </li>
                </ul>
              </div>
            </div>
          </aside>

          {/* Form Side */}
          <section className="lg:col-span-8">
            <form id="cv-builder-form" onSubmit={handleSubmit(onFormSubmit)}>
              <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-xl shadow-slate-200/20 relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="relative z-10"
                  >
                    {/* BƯỚC 1: THÔNG TIN CƠ BẢN */}
                    {currentStep === 0 && (
                      <div className="space-y-8">
                        <div>
                          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Thông tin cá nhân</h2>
                          <p className="text-slate-500 font-medium">Nhà tuyển dụng sẽ sử dụng thông tin này để liên hệ với bạn.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Họ và tên</label>
                            <input
                              {...register("fullName")}
                              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-medium transition-all"
                              placeholder="VD: Nguyễn Văn A"
                            />
                            {errors.fullName && <p className="text-red-500 text-xs font-medium">{errors.fullName.message}</p>}
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Email liên hệ</label>
                            <input
                              {...register("email")}
                              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-medium transition-all"
                              placeholder="email@gmail.com"
                            />
                            {errors.email && <p className="text-red-500 text-xs font-medium">{errors.email.message}</p>}
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Số điện thoại</label>
                            <input
                              {...register("phone")}
                              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-medium transition-all"
                              placeholder="0987xxx..."
                            />
                            {errors.phone && <p className="text-red-500 text-xs font-medium">{errors.phone.message}</p>}
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Vị trí ứng tuyển (VD: Tester, Dev)</label>
                            <input
                              {...register("jobTitle")}
                              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-medium transition-all"
                              placeholder="VD: Frontend Developer"
                            />
                            {errors.jobTitle && <p className="text-red-500 text-xs font-medium">{errors.jobTitle.message}</p>}
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Số năm kinh nghiệm</label>
                            <input
                              type="number"
                              step="0.5"
                              {...register("totalYearsExp", { valueAsNumber: true })}
                              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-medium transition-all"
                              placeholder="VD: 2.5"
                            />
                            {errors.totalYearsExp && <p className="text-red-500 text-xs font-medium">{errors.totalYearsExp.message}</p>}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* BƯỚC 2: KINH NGHIỆM */}
                    {currentStep === 1 && (
                      <div className="space-y-8">
                        <div className="flex justify-between items-end">
                          <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Kinh nghiệm làm việc</h2>
                            <p className="text-slate-500 font-medium">Mô tả những công việc bạn đã từng làm qua.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => appendExp({ company: "", role: "", years: 0, description: "" })}
                            className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-colors"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="space-y-6">
                          {expFields.map((field, index) => (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              key={field.id}
                              className="p-6 bg-slate-50 border border-slate-200 rounded-3xl relative group"
                            >
                              <button
                                type="button"
                                onClick={() => removeExp(index)}
                                className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tên công ty</label>
                                  <input {...register(`experience.${index}.company`)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chức danh / Vị trí</label>
                                  <input {...register(`experience.${index}.role`)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian (Năm)</label>
                                  <input type="number" step="0.5" {...register(`experience.${index}.years`, { valueAsNumber: true })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mô tả công việc</label>
                                  <textarea {...register(`experience.${index}.description`)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]" />
                                </div>
                              </div>
                            </motion.div>
                          ))}
                          {expFields.length === 0 && (
                            <div className="py-12 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-slate-400">
                              <Briefcase className="w-10 h-10 mb-3 opacity-20" />
                              <p className="font-medium">Chưa có kinh nghiệm nào được thêm.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* BƯỚC 3: HỌC VẤN */}
                    {currentStep === 2 && (
                      <div className="space-y-8">
                        <div className="flex justify-between items-end">
                          <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Trình độ học vấn</h2>
                            <p className="text-slate-500 font-medium">Bằng cấp và các khóa học bạn đã hoàn thành.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => appendEdu({ school: "", degree: "", major: "" })}
                            className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-colors"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {eduFields.map((field, index) => (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              key={field.id}
                              className="p-6 bg-white border-2 border-slate-50 rounded-[2rem] shadow-sm relative group ring-1 ring-slate-100"
                            >
                              <button
                                type="button"
                                onClick={() => removeEdu(index)}
                                className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>

                              <div className="space-y-4">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Trường học / Cơ sở</label>
                                  <input {...register(`education.${index}.school`)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800" placeholder="VD: ĐH Bách Khoa HCM" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Bằng cấp</label>
                                    <input {...register(`education.${index}.degree`)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Cử nhân" />
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Chuyên ngành</label>
                                    <input {...register(`education.${index}.major`)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="CNTT" />
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* BƯỚC 4: KỸ NĂNG & TÓM TẮT */}
                    {currentStep === 3 && (
                      <div className="space-y-10">
                        {/* Summary */}
                        <div className="space-y-4">
                          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Tóm tắt sự nghiệp</h2>
                          <textarea
                            {...register("summary")}
                            placeholder="Giới thiệu đôi chút về bản thân và mục tiêu nghề nghiệp của bạn..."
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[2rem] focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 min-h-[140px] leading-relaxed transition-all"
                          />
                        </div>

                        {/* Skills */}
                        <div className="space-y-5">
                          <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-800">Kỹ năng nổi bật</h3>
                            <span className="text-xs font-bold text-slate-400 tracking-wider">Đã thêm: {currentSkills.length}</span>
                          </div>

                          <div className="flex flex-wrap gap-2.5 mb-4 p-5 bg-slate-50/50 border border-dashed border-slate-200 rounded-[2rem] min-h-[100px]">
                            {currentSkills.map((s, i) => (
                              <motion.span
                                layout
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                key={i}
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-full flex items-center gap-2.5 shadow-md shadow-blue-100"
                              >
                                {s}
                                <button type="button" onClick={() => removeSkill(i)} className="hover:text-blue-200 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </motion.span>
                            ))}
                            {currentSkills.length === 0 && (
                              <p className="text-slate-400 text-sm font-medium m-auto lowercase italic">Bạn chưa nhập kỹ năng nào...</p>
                            )}
                          </div>

                          <div className="flex gap-3">
                            <input
                              value={skillInput}
                              onChange={(e) => setSkillInput(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                              placeholder="Thêm kỹ năng (VD: React, NodeJS, Figma...)"
                              className="flex-1 px-6 py-3.5 bg-white border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm font-medium"
                            />
                            <button
                              type="button"
                              onClick={addSkill}
                              className="px-6 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-200"
                            >
                              <Plus className="w-5 h-5" />
                              <span>Thêm</span>
                            </button>
                          </div>

                          {/* Suggested Skills */}
                          <div className="pt-2">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Gợi ý kỹ năng (Click để thêm)</p>
                            <div className="flex flex-wrap gap-2">
                              {["React", "NodeJS", "TypeScript", "Python", "Java", "Figma", "UI/UX", "Tiếng Anh", "Giao Tiếp", "Quản lý thời gian", "Làm việc nhóm", "CI/CD", "AWS", "SQL", "MongoDB"]
                                .filter(skill => !currentSkills.map(s => s.toLowerCase()).includes(skill.toLowerCase()))
                                .map(skill => (
                                  <button
                                    key={skill}
                                    type="button"
                                    onClick={() => {
                                      setValue("skills", [...currentSkills, skill]);
                                    }}
                                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm"
                                  >
                                    + {skill}
                                  </button>
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* BƯỚC 5: XEM TRƯỚC VÀ XUẤT PDF */}
                    {currentStep === 4 && (
                      <div className="space-y-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                          <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Xem trước & Xuất bản</h2>
                            <p className="text-slate-500 font-medium hidden sm:block">Bạn có thể kiểm tra lại CV hoặc tải xuống dưới dạng PDF ngay lập tức.</p>
                          </div>
                          <div className="flex gap-3 w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={() => setIsFullscreenView(true)}
                              className="flex-1 sm:flex-none px-6 py-3 bg-white text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition flex items-center justify-center gap-2 border border-slate-200 shadow-sm whitespace-nowrap hidden md:flex"
                            >
                              <Maximize className="w-5 h-5" />
                              Phóng to
                            </button>
                            <button
                              type="button"
                              onClick={handleDownloadPDF}
                              disabled={isDownloading}
                              className="flex-1 sm:flex-none px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-xl shadow-indigo-200 whitespace-nowrap"
                            >
                              {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                              Tải PDF
                            </button>
                          </div>
                        </div>

                        <div className="w-full overflow-x-auto bg-slate-200/50 p-4 sm:p-8 rounded-[2rem] border border-slate-200">
                          <div className="min-w-[800px] w-[800px] mx-auto overflow-hidden rounded-lg shadow-2xl ring-1 ring-slate-900/5">
                            <CVPreviewTemplate ref={cvRef} data={watch()} />
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Navigation Buttons Inside Card (Sticky to bottom) */}
                <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between sticky bottom-0 bg-white/95 backdrop-blur-md pb-6 z-40 -mx-10 px-10 rounded-b-[2.5rem] shadow-[0_-15px_40px_rgba(0,0,0,0.03)]">
                  {currentStep > 0 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(s => s - 1)}
                      className="flex items-center gap-2 px-8 py-3.5 text-slate-500 font-bold hover:text-slate-800 transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      Quay lại
                    </button>
                  ) : <div></div>}

                  {currentStep < STEPS.length - 1 && (
                    <button
                      key="btn-next"
                      type="button"
                      onClick={() => setCurrentStep(s => s + 1)}
                      className="flex items-center gap-2 px-10 py-3.5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                    >
                      Tiếp tục
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}

                  {currentStep === STEPS.length - 1 && (
                    <button
                      key="btn-submit"
                      type="submit"
                      disabled={isSubmitting || isDownloading}
                      className="flex items-center gap-2 px-10 py-3.5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 disabled:opacity-50 uppercase tracking-wider"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      Lưu Hồ Sơ
                    </button>
                  )}
                </div>
              </div>
            </form>
          </section>
        </div>
      </main>

      {/* Fullscreen CV Preview Modal */}
      <AnimatePresence>
        {isFullscreenView && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-md overflow-y-auto p-4 sm:p-10 flex flex-col items-center custom-scrollbar"
          >
            <div className="w-full max-w-[800px] flex justify-between items-center mb-8 sticky top-0 z-10 py-4 bg-slate-900/80 backdrop-blur-lg px-6 rounded-2xl border border-white/10 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/50 bg-white/5">
                  <Maximize className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-white font-black text-lg tracking-wider uppercase">Chế độ xem trước toàn màn hình</h3>
                  <p className="text-slate-400 text-xs font-medium">Bản prview hiển thị đúng tỷ lệ 100% của tệp PDF khi xuất bản</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50 text-[13px]"
                >
                  {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Tải PDF ngay
                </button>
                <div className="w-px h-6 bg-white/20" />
                <button
                  onClick={() => setIsFullscreenView(false)}
                  className="w-10 h-10 bg-white/10 hover:bg-red-500/20 hover:text-red-400 border border-transparent hover:border-red-500/30 rounded-xl flex items-center justify-center text-slate-300 transition-all font-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="w-full flex justify-center pb-20 overflow-visible origin-top">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 30 }}
                className="w-[800px] origin-top scale-[0.45] sm:scale-[0.7] md:scale-[0.85] xl:scale-100 transition-transform rounded-xl shadow-[0_0_80px_rgba(37,99,235,0.15)] overflow-hidden ring-1 ring-white/10 bg-white"
              >
                {/* Reusing template solely for preview scale */}
                <CVPreviewTemplate ref={fullscreenCvRef} data={watch()} />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
