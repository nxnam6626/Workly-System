"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Plus, Trash2, Loader2, ChevronRight, Sparkles, Globe } from "lucide-react";
import toast from "react-hot-toast";
import { profileApi, type CandidateProfile } from "@/lib/profile-api";

const CERTIFICATES = [
  "Tự đánh giá",
  "TOEIC",
  "IELTS",
  "TOEFL",
  "VSTEP",
  "JLPT",
  "HSK",
  "TOPIK",
  "DELF/DALF",
  "Goethe",
] as const;

const getCertificateStyles = (cert: string) => {
  if (!cert || cert === "Tự đánh giá") {
    return { bg: "#F1F5F9", text: "#64748B", border: "#E2E8F0", dot: "#94A3B8" };
  }
  return { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0", dot: "#34D399" };
};

const schema = z.object({
  languages: z.array(z.object({
    name: z.string().min(1, "Ngôn ngữ không được trống"),
    certificate: z.string().min(1, "Chứng chỉ không được trống"),
    score: z.string().optional().default(""),
  })),
});

type FormData = z.infer<typeof schema>;

interface LanguagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: CandidateProfile;
  onSuccess: (updated: CandidateProfile) => void;
}

const MODAL_VARIANTS: Variants = {
  hidden: { scale: 0.95, opacity: 0, y: 20 },
  visible: { 
    scale: 1, 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring", 
      damping: 25, 
      stiffness: 300,
      mass: 0.5 
    } 
  },
  exit: { 
    scale: 0.95, 
    opacity: 0, 
    y: 20, 
    transition: { 
      duration: 0.2, 
      ease: "easeOut" 
    } 
  },
};

export function LanguagesModal({ isOpen, onClose, initialData, onSuccess }: LanguagesModalProps) {
  const [quickInput, setQuickInput] = useState("");

  const { register, control, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      languages: initialData.candidate?.languages?.map((l: any) => {
        const rawScore = l.score || l.level || "";
        const isLegacyLevel = ["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(rawScore);
        return {
          name: l.name || l.language || "",
          certificate: l.certificate || "Tự đánh giá",
          score: isLegacyLevel ? "" : rawScore,
        };
      }) || [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "languages" });

  useEffect(() => {
    if (isOpen) {
      reset({
        languages: initialData.candidate?.languages?.map((l: any) => {
          const rawScore = l.score || l.level || "";
          const isLegacyLevel = ["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(rawScore);
          return {
            name: l.name || l.language || "",
            certificate: l.certificate || "Tự đánh giá",
            score: isLegacyLevel ? "" : rawScore,
          };
        }) || [],
      });
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const formattedLanguages = data.languages.map((l: any) => ({
        name: l.name,
        language: l.name,
        certificate: l.certificate,
        score: l.score,
        level: l.certificate && l.certificate !== "Tự đánh giá" ? `${l.certificate} ${l.score}` : l.score,
      }));
      const updated = await profileApi.updateProfile({ languages: formattedLanguages });
      toast.success("Ngoại ngữ đã được cập nhật!");
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi cập nhật.");
    }
  };

  const handleQuickAdd = () => {
    if (!quickInput.trim()) return;
    const names = quickInput.split(",").map(s => s.trim()).filter(Boolean);
    names.forEach(name => append({ name, certificate: "Tự đánh giá", score: "" }));
    setQuickInput("");
  };

  const languages = watch("languages");

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          `}</style>

          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose} 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" 
          />

          <motion.div 
            variants={MODAL_VARIANTS} 
            initial="hidden" 
            animate="visible" 
            exit="exit"
            className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white/95 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden z-10 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] border border-white/20"
          >
            {/* Emerald top accent line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600" />

            {/* Header */}
            <header className="relative flex-shrink-0 px-8 pt-10 pb-7 border-b border-[#ECFDF5]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                      <Globe className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <p className="text-[10px] font-bold tracking-[0.3em] text-emerald-600 uppercase">Ngôn ngữ</p>
                  </div>
                  <h2 className="text-3xl text-slate-900 leading-tight font-bold" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Ngoại <span className="text-emerald-600 italic">ngữ</span>
                  </h2>
                </div>
                <button onClick={onClose} className="mt-1 w-9 h-9 flex items-center justify-center rounded-xl border border-[#A7F3D0] text-[#6EE7B7] hover:text-[#111110] hover:border-emerald-300 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Quick add */}
            <div className="flex-shrink-0 px-8 py-4 border-b border-[#ECFDF5] bg-[#F8FAFC]">
              <p className="text-[10px] tracking-[0.22em] text-[#6EE7B7] uppercase font-semibold mb-2.5">Thêm nhanh — phân cách bằng dấu phẩy</p>
              <div className="flex gap-2.5">
                <input
                  value={quickInput}
                  onChange={e => setQuickInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleQuickAdd())}
                  className="flex-1 bg-white border border-[#A7F3D0] rounded-xl px-4 py-2.5 text-[#111110] text-sm placeholder-[#6EE7B7] focus:outline-none focus:border-emerald-400 transition-all"
                  placeholder="Vd: Tiếng Anh, Tiếng Nhật, Tiếng Trung..."
                />
                <button type="button" onClick={handleQuickAdd}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-100">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Languages list */}
            <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
              <form id="languages-form" onSubmit={handleSubmit(onSubmit)} className="px-8 py-6 space-y-2">
                <AnimatePresence initial={false}>
                  {fields.map((field, index) => {
                    const cert = languages?.[index]?.certificate || "Tự đánh giá";
                    const c = getCertificateStyles(cert);
                    return (
                      <motion.div key={field.id}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0, transition: { delay: index * 0.03 } }}
                        exit={{ opacity: 0, x: -16, transition: { duration: 0.15 } }}
                        layout
                        className="group flex flex-col md:flex-row items-stretch md:items-center gap-3.5 px-4 py-3 bg-white rounded-xl border border-[#A7F3D0] hover:border-emerald-300 hover:shadow-sm transition-all"
                      >
                        {/* Color dot & Name input */}
                        <div className="flex-1 flex items-center gap-3.5 min-w-0">
                          <div className="flex-shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: c.dot }} />
                          <input {...register(`languages.${index}.name`)}
                            className="w-full bg-transparent text-[#111110] text-sm font-medium placeholder-[#6EE7B7] focus:outline-none min-w-0"
                            placeholder="Tên ngoại ngữ (Vd: Tiếng Anh)" />
                        </div>

                        {/* Certificate Select */}
                        <div className="flex-shrink-0">
                          <select {...register(`languages.${index}.certificate`)}
                            className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1.5 rounded-lg border focus:outline-none cursor-pointer transition-all w-full md:w-auto"
                            style={{ color: c.text, background: c.bg, borderColor: c.border }}>
                            {CERTIFICATES.map(item => <option key={item} value={item}>{item}</option>)}
                          </select>
                        </div>

                        {/* Score/Level input */}
                        <div className="flex-shrink-0 w-full md:w-32">
                          <input {...register(`languages.${index}.score`)}
                            className="w-full text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-[#A7F3D0] focus:outline-none focus:border-emerald-400 placeholder-[#6EE7B7] transition-all"
                            placeholder={cert === "Tự đánh giá" ? "Trình độ (tùy chọn)" : "Vd: 7.0 / 750"} />
                        </div>

                        <button type="button" onClick={() => remove(index)}
                          className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-[#A7F3D0] hover:text-red-400 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 self-end md:self-auto">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {fields.length === 0 && (
                  <div className="py-14 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-emerald-200 flex items-center justify-center bg-white">
                      <Globe className="w-6 h-6 text-emerald-200" />
                    </div>
                    <p className="text-sm text-[#6EE7B7]">Nhập ngoại ngữ vào ô phía trên để bắt đầu</p>
                  </div>
                )}
                <div className="h-2" />
              </form>
            </div>

            {/* Footer */}
            <footer className="flex-shrink-0 px-8 py-5 border-t border-[#ECFDF5] bg-white flex items-center justify-between">
              <div className="flex items-center gap-3 flex-wrap">
                {(() => {
                  const certifiedCount = languages?.filter(s => s.certificate && s.certificate !== "Tự đánh giá").length || 0;
                  const selfCount = languages?.filter(s => !s.certificate || s.certificate === "Tự đánh giá").length || 0;
                  return (
                    <>
                      {certifiedCount > 0 && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#ECFDF5] text-[#059669]">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                          <span className="text-[10px] font-bold">{certifiedCount} Chứng chỉ</span>
                        </div>
                      )}
                      {selfCount > 0 && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#F1F5F9] text-[#64748B]">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />
                          <span className="text-[10px] font-bold">{selfCount} Tự đánh giá</span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              <div className="flex items-center gap-4">
                <button type="button" onClick={onClose}
                  className="text-[11px] tracking-[0.2em] text-[#BEBDB5] hover:text-[#666660] uppercase font-semibold transition-colors">Hủy bỏ</button>
                <button type="submit" form="languages-form" disabled={isSubmitting}
                  className="group flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-xs tracking-[0.12em] uppercase text-white transition-all disabled:opacity-40 shadow-lg shadow-emerald-100"
                  style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)" }}>
                  {isSubmitting
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang lưu...</>
                    : <><Sparkles className="w-3.5 h-3.5" /> Lưu ngoại ngữ <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" /></>}
                </button>
              </div>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
