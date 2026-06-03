"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Plus, Trash2, Loader2, ChevronRight, Sparkles, ShieldCheck, Calendar, GraduationCap } from "lucide-react";
import toast from "react-hot-toast";
import { profileApi, type CandidateProfile } from "@/lib/profile-api";

const schema = z.object({
  degrees: z.array(z.object({
    name: z.string().min(1, "Vui lòng nhập loại bằng cấp (Ví dụ: Cử nhân, Kỹ sư)"),
    school: z.string().min(1, "Vui lòng nhập tên trường"),
    major: z.string().optional(),
    issueDate: z.string().optional(),
  })),
});

type FormData = z.infer<typeof schema>;

interface DegreesModalProps {
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

const inputCls = "w-full bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-2.5 text-[#111110] text-sm font-medium placeholder-[#93C5FD] focus:outline-none focus:border-blue-400/60 focus:bg-white transition-all";
const labelCls = "flex items-center gap-1.5 text-[10px] tracking-[0.2em] text-blue-500 uppercase font-semibold";

export function DegreesModal({ isOpen, onClose, initialData, onSuccess }: DegreesModalProps) {
  const { register, control, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      degrees: initialData.candidate?.degrees?.map((d: any) => ({
        name: d.name || "",
        school: d.school || "",
        major: d.major || "",
        issueDate: d.issueDate || "",
      })) || [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "degrees" });

  useEffect(() => {
    if (isOpen) {
      reset({
        degrees: initialData.candidate?.degrees?.map((d: any) => ({
          name: d.name || "",
          school: d.school || "",
          major: d.major || "",
          issueDate: d.issueDate || "",
        })) || [],
      });
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const updated = await profileApi.updateProfile({ degrees: data.degrees as any });
      toast.success("Bằng cấp học vấn đã được cập nhật!");
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi cập nhật.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
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
            {/* Blue top accent line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600" />

            {/* Header */}
            <header className="relative flex-shrink-0 px-8 pt-10 pb-7 border-b border-[#F3EEFF]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <p className="text-[10px] font-bold tracking-[0.3em] text-blue-600 uppercase">Học vấn & Trình độ</p>
                  </div>
                  <h2 className="text-3xl text-slate-900 leading-tight font-bold">
                    Bằng cấp & <span className="text-blue-600 italic">Học vị</span>
                  </h2>
                </div>
                <div className="flex items-center gap-2.5 mt-1">
                  <button type="button"
                    onClick={() => append({ name: "", school: "", major: "", issueDate: "" })}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-all">
                    <Plus className="w-3.5 h-3.5" /> Thêm
                  </button>
                  <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl border border-blue-100 text-blue-300 hover:text-blue-600 hover:border-blue-300 transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </header>

            {/* List */}
            <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
              <form id="deg-form" onSubmit={handleSubmit(onSubmit)} className="px-8 py-7 space-y-4">
                <AnimatePresence initial={false}>
                  {fields.map((field: any, index: number) => (
                    <motion.div key={field.id}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0, transition: { delay: index * 0.05 } }}
                      exit={{ opacity: 0, x: -16, transition: { duration: 0.15 } }}
                      layout
                      className="group relative bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md hover:border-blue-300 transition-all p-6"
                    >
                      {/* Blue left bar */}
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-blue-400 via-blue-500 to-blue-200" />

                      {/* Serial */}
                      <div className="absolute top-4 right-12 select-none pointer-events-none"
                        style={{ fontSize: "52px", lineHeight: 1, color: "#EFF6FF", fontWeight: 700 }}>
                        {String(index + 1).padStart(2, "0")}
                      </div>

                      <div className="pl-4 space-y-3.5">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className={labelCls}>Bằng cấp / Học vị</label>
                            <input {...register(`degrees.${index}.name`)} className={inputCls}
                              placeholder="Cử nhân, Kỹ sư, Thạc sĩ..." />
                          </div>
                          <div className="space-y-1.5">
                            <label className={labelCls}>Trường học / Viện đào tạo</label>
                            <input {...register(`degrees.${index}.school`)} className={inputCls}
                              placeholder="Đại học Bách Khoa" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className={labelCls}><GraduationCap className="w-3 h-3" />Chuyên ngành</label>
                            <input {...register(`degrees.${index}.major`)} className={inputCls}
                              placeholder="Khoa học Máy tính" />
                          </div>
                          <div className="space-y-1.5">
                            <label className={labelCls}><Calendar className="w-3 h-3" />Năm tốt nghiệp / Thời gian học</label>
                            <input {...register(`degrees.${index}.issueDate`)} className={inputCls}
                              placeholder="2019 - 2023 hoặc 2023" />
                          </div>
                        </div>
                      </div>

                      <button type="button" onClick={() => remove(index)}
                        className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg text-blue-300 hover:text-red-500 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {fields.length === 0 && (
                  <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-blue-200 flex items-center justify-center bg-white">
                      <GraduationCap className="w-7 h-7 text-blue-200" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-slate-900 mb-1">Chưa có thông tin học vấn</p>
                      <p className="text-sm text-slate-400 font-medium">Thêm bằng cấp để làm nổi bật hồ sơ của bạn</p>
                    </div>
                    <button type="button"
                      onClick={() => append({ name: "", school: "", major: "", issueDate: "" })}
                      className="px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-all">
                      + Thêm trình độ học vấn
                    </button>
                  </div>
                )}
                <div className="h-2" />
              </form>
            </div>

            {/* Footer */}
            <footer className="flex-shrink-0 px-8 py-5 border-t border-[#F3EEFF] bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span className="text-[10px] text-blue-400 uppercase tracking-widest font-semibold">{fields.length} trình độ học vấn</span>
              </div>
              <div className="flex items-center gap-4">
                <button type="button" onClick={onClose}
                  className="text-[11px] tracking-[0.2em] text-[#BEBDB5] hover:text-[#666660] uppercase font-semibold transition-colors">Hủy bỏ</button>
                <button type="submit" form="deg-form" disabled={isSubmitting}
                  className="group flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-xs tracking-[0.12em] uppercase text-white transition-all disabled:opacity-40 shadow-lg shadow-blue-100"
                  style={{ background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)" }}>
                  {isSubmitting
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang lưu...</>
                    : <><Sparkles className="w-3.5 h-3.5" /> Lưu học vấn <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" /></>}
                </button>
              </div>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
