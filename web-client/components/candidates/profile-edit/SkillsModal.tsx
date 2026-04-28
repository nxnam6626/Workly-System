"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Plus, Trash2, Loader2, ChevronRight, Sparkles, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { profileApi, type CandidateProfile } from "@/lib/profile-api";

const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: "Cơ bản",
  INTERMEDIATE: "Trung bình",
  ADVANCED: "Nâng cao",
};
const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  BEGINNER: { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE", dot: "#60A5FA" },
  INTERMEDIATE: { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A", dot: "#F59E0B" },
  ADVANCED: { bg: "#F0FDF4", text: "#059669", border: "#BBF7D0", dot: "#34D399" },
};

const schema = z.object({
  skills: z.array(z.object({
    skillName: z.string().min(1, "Tên kỹ năng không được trống"),
    level: z.enum(LEVELS),
    category: z.string().optional(),
  })),
});

type FormData = z.infer<typeof schema>;

interface SkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: CandidateProfile;
  onSuccess: (updated: CandidateProfile) => void;
}

const DRAWER_VARIANTS = {
  hidden: { x: "100%", opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: "spring" as const, damping: 30, stiffness: 240 } },
  exit: { x: "100%", opacity: 0, transition: { duration: 0.22, ease: "easeIn" as const } },
};

export function SkillsModal({ isOpen, onClose, initialData, onSuccess }: SkillsModalProps) {
  const [quickInput, setQuickInput] = useState("");
  const [quickLevel, setQuickLevel] = useState<"BEGINNER" | "INTERMEDIATE" | "ADVANCED">("INTERMEDIATE");

  const { register, control, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      skills: initialData.candidate?.skills?.map(s => ({
        skillName: s.skillName,
        level: s.level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
        category: s.category || "",
      })) || [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "skills" });

  useEffect(() => {
    if (isOpen) {
      reset({
        skills: initialData.candidate?.skills?.map(s => ({
          skillName: s.skillName,
          level: s.level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
          category: s.category || "",
        })) || [],
      });
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const updated = await profileApi.updateProfile({ skills: data.skills });
      toast.success("Kỹ năng đã được cập nhật!");
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi cập nhật.");
    }
  };

  const handleQuickAdd = () => {
    if (!quickInput.trim()) return;
    const names = quickInput.split(",").map(s => s.trim()).filter(Boolean);
    names.forEach(name => append({ skillName: name, level: quickLevel }));
    setQuickInput("");
  };

  const skills = watch("skills");

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex justify-end" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');`}</style>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-slate-800/30 backdrop-blur-[2px]" />

          <motion.aside variants={DRAWER_VARIANTS} initial="hidden" animate="visible" exit="exit"
            className="relative w-full max-w-[560px] h-full flex flex-col bg-white border-l border-[#DBEAFE] overflow-hidden z-10 shadow-2xl shadow-blue-50">

            {/* Blue top accent line */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#2563EB] via-[#60A5FA] to-transparent" />

            {/* Header */}
            <header className="relative flex-shrink-0 px-8 pt-10 pb-7 border-b border-[#EFF6FF]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
                      <Zap className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <p className="text-[10px] font-semibold tracking-[0.3em] text-blue-600 uppercase">Bộ kỹ năng</p>
                  </div>
                  <h2 style={{ fontFamily: "'DM Serif Display', serif" }} className="text-[28px] text-[#111110] leading-tight">
                    Kỹ năng & <em className="text-blue-600 not-italic">Chuyên môn</em>
                  </h2>
                </div>
                <button onClick={onClose} className="mt-1 w-9 h-9 flex items-center justify-center rounded-xl border border-[#DBEAFE] text-[#93C5FD] hover:text-[#111110] hover:border-blue-300 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Quick add */}
            <div className="flex-shrink-0 px-8 py-4 border-b border-[#EFF6FF] bg-[#F8FBFF]">
              <p className="text-[10px] tracking-[0.22em] text-[#93C5FD] uppercase font-semibold mb-2.5">Thêm nhanh — phân cách bằng dấu phẩy</p>
              <div className="flex gap-2.5">
                <input
                  value={quickInput}
                  onChange={e => setQuickInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleQuickAdd())}
                  className="flex-1 bg-white border border-[#DBEAFE] rounded-xl px-4 py-2.5 text-[#111110] text-sm placeholder-[#93C5FD] focus:outline-none focus:border-blue-400 transition-all"
                  placeholder="React, TypeScript, Node.js..."
                />
                {/* Level picker */}
                <div className="flex rounded-xl overflow-hidden border border-[#DBEAFE] bg-white">
                  {LEVELS.map((l, i) => {
                    const c = LEVEL_COLORS[l];
                    return (
                      <button key={l} type="button" onClick={() => setQuickLevel(l)}
                        className="px-3 py-2 text-[10px] font-bold uppercase tracking-wide transition-all"
                        style={{
                          background: quickLevel === l ? c.bg : "white",
                          color: quickLevel === l ? c.text : "#93C5FD",
                          borderRight: i < 2 ? "1px solid #DBEAFE" : "none",
                        }}>
                        {LEVEL_LABELS[l][0]}
                      </button>
                    );
                  })}
                </div>
                <button type="button" onClick={handleQuickAdd}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-100">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Skills list */}
            <div className="flex-1 overflow-y-auto bg-[#F8FBFF]">
              <form id="skills-form" onSubmit={handleSubmit(onSubmit)} className="px-8 py-6 space-y-2">
                <AnimatePresence initial={false}>
                  {fields.map((field, index) => {
                    const level = skills?.[index]?.level || "INTERMEDIATE";
                    const c = LEVEL_COLORS[level];
                    return (
                      <motion.div key={field.id}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0, transition: { delay: index * 0.03 } }}
                        exit={{ opacity: 0, x: -16, transition: { duration: 0.15 } }}
                        layout
                        className="group flex items-center gap-3.5 px-4 py-3 bg-white rounded-xl border border-[#DBEAFE] hover:border-blue-300 hover:shadow-sm transition-all"
                      >
                        {/* Color dot */}
                        <div className="flex-shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: c.dot }} />

                        <input {...register(`skills.${index}.skillName`)}
                          className="flex-1 bg-transparent text-[#111110] text-sm font-medium placeholder-[#93C5FD] focus:outline-none min-w-0"
                          placeholder="Tên kỹ năng" />

                        <div className="flex-shrink-0">
                          <select {...register(`skills.${index}.level`)}
                            className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1.5 rounded-lg border focus:outline-none cursor-pointer transition-all"
                            style={{ color: c.text, background: c.bg, borderColor: c.border }}>
                            {LEVELS.map(l => <option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
                          </select>
                        </div>

                        <button type="button" onClick={() => remove(index)}
                          className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-[#DBEAFE] hover:text-red-400 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {fields.length === 0 && (
                  <div className="py-14 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-blue-200 flex items-center justify-center bg-white">
                      <Zap className="w-6 h-6 text-blue-200" />
                    </div>
                    <p className="text-sm text-[#93C5FD]">Nhập kỹ năng vào ô phía trên để bắt đầu</p>
                  </div>
                )}
                <div className="h-2" />
              </form>
            </div>

            {/* Footer */}
            <footer className="flex-shrink-0 px-8 py-5 border-t border-[#EFF6FF] bg-white flex items-center justify-between">
              <div className="flex items-center gap-3 flex-wrap">
                {LEVELS.map(l => {
                  const count = skills?.filter(s => s.level === l).length || 0;
                  if (!count) return null;
                  const c = LEVEL_COLORS[l];
                  return (
                    <div key={l} className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: c.bg }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.dot }} />
                      <span className="text-[10px] font-bold" style={{ color: c.text }}>{count} {LEVEL_LABELS[l]}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4">
                <button type="button" onClick={onClose}
                  className="text-[11px] tracking-[0.2em] text-[#BEBDB5] hover:text-[#666660] uppercase font-semibold transition-colors">Hủy bỏ</button>
                <button type="submit" form="skills-form" disabled={isSubmitting}
                  className="group flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-xs tracking-[0.12em] uppercase text-white transition-all disabled:opacity-40 shadow-lg shadow-blue-100"
                  style={{ background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)" }}>
                  {isSubmitting
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang lưu...</>
                    : <><Sparkles className="w-3.5 h-3.5" /> Lưu kỹ năng <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" /></>}
                </button>
              </div>
            </footer>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
