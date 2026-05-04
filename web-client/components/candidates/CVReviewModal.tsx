"use client";

import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { profileApi } from "@/lib/profile-api";
import { motion, AnimatePresence } from "framer-motion";

import { cvSchema, CVFormData } from "./cv-review/cv-review.schema";
import { CVReviewHeader } from "./cv-review/CVReviewHeader";
import { CVReviewFooter } from "./cv-review/CVReviewFooter";
import { IdentitySection } from "./cv-review/IdentitySection";
import { SkillsSection } from "./cv-review/SkillsSection";
import { ExperienceSection } from "./cv-review/ExperienceSection";
import { EducationSection } from "./cv-review/EducationSection";
import { CertificationsSection } from "./cv-review/CertificationsSection";

interface CVReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: any;
  fileUrl: string;
  cvTitle: string;
  cvId?: string;
  onSuccess: (savedCv: any) => void;
}

export function CVReviewModal({ isOpen, onClose, initialData, fileUrl, cvTitle, cvId, onSuccess }: CVReviewModalProps) {
  const { register, control, handleSubmit, setValue, reset, watch, formState: { errors, isSubmitting } } = useForm<CVFormData>({
    resolver: zodResolver(cvSchema),
    defaultValues: {
      fullName: initialData?.personal_info?.full_name || initialData?.fullName || "",
      email: initialData?.personal_info?.email || initialData?.email || "",
      phone: initialData?.personal_info?.phone || initialData?.phone || "",
      skills: (() => {
        const s = initialData?.skills;
        if (Array.isArray(s)) return s;
        if (s && (s.hard_skills || s.soft_skills)) {
          return [...(s.hard_skills || []), ...(s.soft_skills || [])];
        }
        return [];
      })(),
      experience: initialData?.experience?.roles || initialData?.experience || [],
      education: (() => {
        const e = initialData?.education;
        if (Array.isArray(e)) return e;
        if (e && typeof e === 'object') {
          return [{ school: e.institution || '', degree: e.degree || '', major: e.major || '' }];
        }
        return [];
      })(),
      totalYearsExp: initialData?.experience?.total_months ? Math.round(initialData.experience.total_months / 12) : (initialData?.totalYearsExp || 0),
      summary: initialData?.summary || "",
      projects: initialData?.projects || [],
      desiredJob: initialData?.desired_job || initialData?.desiredJob || {},
      certifications: initialData?.certifications || [],
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

  const [skillInput, setSkillInput] = React.useState("");
  const [skills, setSkills] = React.useState<any[]>([]);

  // Initialize skills
  React.useEffect(() => {
    if (initialData?.skills) {
      const normalizedSkills = (() => {
        const s = initialData.skills;
        if (Array.isArray(s)) return s;
        if (s && (s.hard_skills || s.soft_skills)) {
          return [...(s.hard_skills || []), ...(s.soft_skills || [])];
        }
        return [];
      })();
      setSkills(normalizedSkills);
    }
  }, [initialData]);

  // Sync skills when they change
  React.useEffect(() => {
    setValue("skills", skills);
  }, [skills, setValue]);

  React.useEffect(() => {
    if (isOpen) {
      const normalizedSkills = (() => {
        const s = initialData?.skills;
        if (Array.isArray(s)) return s;
        if (s && (s.hard_skills || s.soft_skills)) {
          return [...(s.hard_skills || []), ...(s.soft_skills || [])];
        }
        return [];
      })();

      reset({
        fullName: initialData?.personal_info?.full_name || initialData?.fullName || "",
        email: initialData?.personal_info?.email || initialData?.email || "",
        phone: initialData?.personal_info?.phone || initialData?.phone || "",
        skills: normalizedSkills,
        experience: initialData?.experience?.roles || initialData?.experience || [],
        education: (() => {
          const e = initialData?.education;
          if (Array.isArray(e)) return e;
          if (e && typeof e === 'object') {
            return [{ school: e.institution || '', degree: e.degree || '', major: e.major || '' }];
          }
          return [];
        })(),
        totalYearsExp: initialData?.experience?.total_months ? Math.round(initialData.experience.total_months / 12) : (initialData?.totalYearsExp || 0),
        summary: initialData?.summary || "",
        projects: initialData?.projects || [],
        desiredJob: initialData?.desired_job || initialData?.desiredJob || {},
        certifications: initialData?.certifications || [],
      });
      setSkills(normalizedSkills);
    }
  }, [isOpen, initialData, reset]);

  if (!isOpen) return null;

  const onFormSubmit = async (data: CVFormData) => {
    const toastId = toast.loading("Đang đồng bộ hồ sơ...");
    try {
      await profileApi.updateProfile({
        fullName: data.fullName,
        phone: data.phone,
        summary: data.summary,
        desiredJob: data.desiredJob,
        skills: skills.map((s: any) => ({
          skillName: typeof s === "string" ? s : s.skillName,
          level: (typeof s === "string" ? "BEGINNER" : s.level) || "BEGINNER",
        })),
        experiences: data.experience.map((exp: any) => ({
          company: exp.company,
          role: exp.role,
          duration: exp.duration || `${exp.years || 0} năm`,
          description: exp.description || "",
        })),
        projects: data.projects.map((p: any) => ({
          projectName: p.projectName,
          role: p.role || "",
          description: p.description || "",
          technology: p.technology || "",
        })),
        university: data.education?.[0]?.school,
        major: data.education?.[0]?.major,
        gpa: Number(data.gpa || 0),
      });

      let response;
      if (cvId) {
        response = await api.patch(`/candidates/cv/${cvId}`, {
          cvTitle,
          fileUrl,
          isMain: true,
          parsedData: { ...data, skills },
        });
      } else {
        response = await api.post("/candidates/cv", {
          cvTitle,
          fileUrl,
          isMain: true,
          parsedData: { ...data, skills },
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

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput("");
    }
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
        className="bg-white w-full max-w-5xl max-h-[92vh] rounded-[2.5rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col relative z-10 border border-slate-200"
      >
        <CVReviewHeader onClose={onClose} />

        <div className="flex-1 overflow-y-auto p-10 bg-[#F8FAFC]">
          <form id="cv-review-form" onSubmit={handleSubmit(onFormSubmit as any, onFormError)} className="space-y-12">
            <IdentitySection register={register} errors={errors} />
            <SkillsSection 
              skills={skills} 
              setSkills={setSkills} 
              skillInput={skillInput} 
              setSkillInput={setSkillInput} 
              addSkill={addSkill} 
            />
            <ExperienceSection 
              fields={expFields} 
              register={register} 
              append={appendExp} 
              remove={removeExp} 
            />
            <EducationSection 
              fields={eduFields} 
              register={register} 
              append={appendEdu} 
              remove={removeEdu} 
            />
            <CertificationsSection 
              certifications={watch("certifications") || []} 
              setValue={setValue} 
            />
          </form>
        </div>
        <CVReviewFooter onClose={onClose} isSubmitting={isSubmitting} />
      </motion.div>
    </div>
  );
}
