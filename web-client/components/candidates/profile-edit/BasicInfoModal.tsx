"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Loader2, ChevronRight, Sparkles, User, GraduationCap, Target } from "lucide-react";
import toast from "react-hot-toast";
import { profileApi, type CandidateProfile } from "@/lib/profile-api";

const schema = z.object({
  fullName: z.string().min(2, "Tên cần ít nhất 2 ký tự"),
  phone: z.string().optional(),
  university: z.string().optional(),
  major: z.string().optional(),
  gpa: z.string().optional(),
  summary: z.string().optional(),
  desiredJobTitle: z.string().optional(),
  desiredJobSalary: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface BasicInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: CandidateProfile;
  onSuccess: (updated: CandidateProfile) => void;
}

const DRAWER_VARIANTS = {
  hidden: { x: "100%", opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: "spring" as const, damping: 30, stiffness: 240, mass: 0.8 } },
  exit: { x: "100%", opacity: 0, transition: { duration: 0.22, ease: "easeIn" as const } },
};

const inputCls = "w-full bg-[#F7F7F5] border border-[#E8E8E2] rounded-xl px-4 py-3 text-[#111110] text-sm font-medium placeholder-[#C0BFB8] focus:outline-none focus:border-[#D97706]/60 focus:bg-white transition-all";
const labelCls = "text-[10px] tracking-[0.22em] text-[#999890] uppercase font-semibold";

export function BasicInfoModal({ isOpen, onClose, initialData, onSuccess }: BasicInfoModalProps) {
  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: initialData.candidate?.fullName || "",
      phone: initialData.phoneNumber || "",
      university: initialData.candidate?.university || "",
      major: initialData.candidate?.major || "",
      gpa: initialData.candidate?.gpa != null ? String(initialData.candidate.gpa) : "",
      summary: initialData.candidate?.summary || "",
      desiredJobTitle: initialData.candidate?.desiredJob?.title || "",
      desiredJobSalary: initialData.candidate?.desiredJob?.salary || "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        fullName: initialData.candidate?.fullName || "",
        phone: initialData.phoneNumber || "",
        university: initialData.candidate?.university || "",
        major: initialData.candidate?.major || "",
        gpa: initialData.candidate?.gpa != null ? String(initialData.candidate.gpa) : "",
        summary: initialData.candidate?.summary || "",
        desiredJobTitle: initialData.candidate?.desiredJob?.title || "",
        desiredJobSalary: initialData.candidate?.desiredJob?.salary || "",
      });
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const gpaNum = data.gpa ? parseFloat(data.gpa) : undefined;
      const updated = await profileApi.updateProfile({
        fullName: data.fullName,
        phone: data.phone,
        university: data.university,
        major: data.major,
        gpa: gpaNum,
        summary: data.summary,
        desiredJob: {
          ...(initialData.candidate?.desiredJob || {}),
          title: data.desiredJobTitle,
          salary: data.desiredJobSalary,
        },
      });
      toast.success("Hồ sơ đã được cập nhật!");
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi cập nhật.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex justify-end" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');`}</style>

          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-800/30 backdrop-blur-[2px]"
          />

          {/* Drawer */}
          <motion.aside
            variants={DRAWER_VARIANTS} initial="hidden" animate="visible" exit="exit"
            className="relative w-full max-w-[560px] h-full flex flex-col bg-white border-l border-[#E8E8E2] overflow-hidden z-10 shadow-2xl shadow-slate-200"
          >
            {/* Subtle top accent line */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-transparent" />

            {/* Header */}
            <header className="relative flex-shrink-0 px-8 pt-10 pb-7 border-b border-[#F0EFE8]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.3em] text-[#D97706] uppercase mb-2.5">Cập nhật hồ sơ</p>
                  <h2 style={{ fontFamily: "'DM Serif Display', serif" }} className="text-[28px] text-[#111110] leading-tight">
                    Thông tin <em className="text-[#D97706] not-italic">cá nhân</em>
                  </h2>
                  <p className="text-[12px] text-[#999890] mt-1.5">Thông tin hiển thị trên hồ sơ của bạn</p>
                </div>
                <button onClick={onClose}
                  className="mt-1 w-9 h-9 flex items-center justify-center rounded-xl border border-[#E8E8E2] text-[#BEBDB5] hover:text-[#111110] hover:border-[#D0CFCA] transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Scrollable form */}
            <div className="flex-1 overflow-y-auto">
              <form id="basic-info-form" onSubmit={handleSubmit(onSubmit)} className="px-8 py-8 space-y-9">

                {/* 01 — Danh tính */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span style={{ fontFamily: "'DM Serif Display', serif" }} className="text-[42px] leading-none text-[#F0EFE8] font-bold select-none">01</span>
                    <div className="flex-1 border-t border-[#F0EFE8]" />
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-[#D97706]" />
                      <span className="text-[10px] tracking-[0.22em] text-[#D97706] uppercase font-semibold">Danh tính</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className={labelCls}>Họ và tên *</label>
                      <input {...register("fullName")} className={inputCls} placeholder="Nguyễn Văn A" />
                      {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelCls}>Số điện thoại</label>
                      <input {...register("phone")} className={inputCls} placeholder="0987 xxx xxx" />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelCls}>Giới thiệu bản thân</label>
                      <textarea {...register("summary")} rows={3} className={`${inputCls} resize-none leading-relaxed`}
                        placeholder="Một vài câu ngắn gọn về bản thân và định hướng của bạn..." />
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-[#F0EFE8]" />

                {/* 02 — Học vấn */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span style={{ fontFamily: "'DM Serif Display', serif" }} className="text-[42px] leading-none text-[#F0EFE8] font-bold select-none">02</span>
                    <div className="flex-1 border-t border-[#F0EFE8]" />
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-3.5 h-3.5 text-[#D97706]" />
                      <span className="text-[10px] tracking-[0.22em] text-[#D97706] uppercase font-semibold">Học vấn</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1.5">
                      <label className={labelCls}>Trường đại học</label>
                      <input {...register("university")} className={inputCls} placeholder="Đại học Bách Khoa TP.HCM" />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelCls}>Chuyên ngành</label>
                      <input {...register("major")} className={inputCls} placeholder="Kỹ thuật phần mềm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelCls}>GPA (/ 4.0)</label>
                      <input {...register("gpa")} type="number" step="0.01" min="0" max="4" className={inputCls} placeholder="3.50" />
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-[#F0EFE8]" />

                {/* 03 — Mục tiêu */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span style={{ fontFamily: "'DM Serif Display', serif" }} className="text-[42px] leading-none text-[#F0EFE8] font-bold select-none">03</span>
                    <div className="flex-1 border-t border-[#F0EFE8]" />
                    <div className="flex items-center gap-2">
                      <Target className="w-3.5 h-3.5 text-[#D97706]" />
                      <span className="text-[10px] tracking-[0.22em] text-[#D97706] uppercase font-semibold">Mục tiêu</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className={labelCls}>Vị trí mong muốn</label>
                      <input {...register("desiredJobTitle")} className={inputCls} placeholder="Frontend Developer" />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelCls}>Mức lương kỳ vọng</label>
                      <input {...register("desiredJobSalary")} className={inputCls} placeholder="20 – 30 triệu" />
                    </div>
                  </div>
                </div>

                <div className="h-2" />
              </form>
            </div>

            {/* Footer */}
            <footer className="flex-shrink-0 px-8 py-5 border-t border-[#F0EFE8] bg-[#FAFAF8] flex items-center justify-between">
              <button type="button" onClick={onClose}
                className="text-[11px] tracking-[0.2em] text-[#BEBDB5] hover:text-[#666660] uppercase font-semibold transition-colors">
                Hủy bỏ
              </button>
              <button type="submit" form="basic-info-form" disabled={isSubmitting}
                className="group flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-xs tracking-[0.12em] uppercase text-white transition-all disabled:opacity-40 shadow-lg shadow-amber-100"
                style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}>
                {isSubmitting
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang lưu...</>
                  : <><Sparkles className="w-3.5 h-3.5" /> Lưu thay đổi <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" /></>}
              </button>
            </footer>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
