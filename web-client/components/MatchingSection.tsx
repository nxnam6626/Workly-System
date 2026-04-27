"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, ArrowRight, Target, Bot, Zap, Search, UserCheck, Building2, MapPin, Briefcase } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { JobCard, Job } from "@/components/JobCard";
import { JobCardSkeleton } from "@/components/jobs/JobCardSkeleton";
import { useAuthStore } from "@/stores/auth";
import { motion, AnimatePresence } from "framer-motion";

interface MatchItem {
  id: string; // jobPostingId or candidateId
  title: string;
  subtitle: string;
  score: number;
  tags: string[];
  avatar?: string;
  jobTitle?: string; // For recruiters
  type: "JOB" | "CANDIDATE";
  raw?: any;
}

export function MatchingSection() {
  const [items, setItems] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useAuthStore();

  const isCandidate = user?.roles?.includes("CANDIDATE");
  const isRecruiter = user?.roles?.includes("RECRUITER");

  useEffect(() => {
    const fetchMatches = async () => {
      if (!isAuthenticated) return;
      setLoading(true);
      try {
        if (isCandidate) {
          const res = await api.get("/candidates/recommended-jobs");
          const items = res.data.items || [];
          if (items.length > 0) {
            const mapped: MatchItem[] = items.slice(0, 4).map((j: any) => ({
              id: j.jobPostingId,
              title: j.title,
              subtitle: j.company.companyName,
              score: j.score || 95,
              tags: j.matchedSkills || (j.requirements ? j.requirements.split(',').slice(0, 3) : []),
              type: "JOB",
              raw: j
            }));
            setItems(mapped);
          } else {
            setItems([]);
          }
        } else if (isRecruiter) {
          const res = await api.get("/recruiters/top-matches");
          if (res.data && res.data.length > 0) {
            const mapped: MatchItem[] = res.data.slice(0, 4).map((c: any) => ({
              id: c.candidateId,
              title: c.fullName,
              subtitle: `Phù h?p cho v? trí: ${c.jobTitle}`,
              score: c.score,
              tags: c.skills || [],
              avatar: c.avatar,
              type: "CANDIDATE",
              raw: c
            }));
            setItems(mapped);
          } else {
            setItems([]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch matches for homepage, using fallback", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [isAuthenticated, isCandidate, isRecruiter]);

const MOCK_MATCHES: MatchItem[] = [
  {
    id: "m1",
    title: "Senior Frontend Developer",
    subtitle: "Công Ty C? Ph?n VINHOMES",
    score: 98,
    tags: ["React", "TypeScript", "Next.js"],
    type: "JOB",
    raw: {
      jobPostingId: "m1",
      title: "Senior Frontend Developer",
      company: { companyName: "Công Ty C? Ph?n VINHOMES", logo: "/logos/workly-gau-logo.png" },
      locationCity: "Hà N?i",
      salaryMin: 30000000,
      salaryMax: 50000000,
      currency: "VND",
      createdAt: new Date().toISOString(),
      jobTier: "URGENT"
    } as any
  },
  {
    id: "m2",
    title: "Product Designer (UI/UX)",
    subtitle: "VNG Corporation",
    score: 95,
    tags: ["Figma", "Design System", "Mobile"],
    type: "JOB",
    raw: {
      jobPostingId: "m2",
      title: "Product Designer (UI/UX)",
      company: { companyName: "VNG Corporation", logo: "/logos/workly-gau-logo-2.png" },
      locationCity: "H? Chí Minh",
      salaryMin: 20000000,
      salaryMax: 40000000,
      currency: "VND",
      createdAt: new Date().toISOString(),
      jobTier: "PROFESSIONAL"
    } as any
  }
];


  if (!isAuthenticated) return null;

  const title = isCandidate ? "Vi?c làm Phù h?p nh?t" : "?ng viên Ti?m nang nh?t";
  const subtitle = isCandidate ? "D?a trên k? nang trong CV c?a b?n." : "Phù h?p v?i các v? trí b?n dang tuy?n.";
  const linkLabel = isCandidate ? "Xem t?t c? d? xu?t" : "Qu?n lý tuy?n d?ng";
  const linkHref = isCandidate ? "/profile/jobs/matching" : "/recruiter/dashboard";

  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-20 bg-white border-y border-slate-50">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12 border-l-4 border-mariner pl-6">
        <div className="space-y-3">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#111827] tracking-tight leading-tight uppercase">
            {title}
          </h2>
          <p className="text-slate-500 font-medium text-lg">{subtitle}</p>
        </div>
        <Link
          href={linkHref}
          className="group inline-flex items-center gap-2 px-8 py-3.5 bg-white border-2 border-mariner text-mariner rounded-lg font-bold hover:bg-mariner hover:text-white transition-all active:scale-95 shadow-sm"
        >
          {linkLabel} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <JobCardSkeleton key={i} />
          ))
        ) : items.length > 0 ? (
          <AnimatePresence>
            {items.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="h-full"
              >
                {item.type === "JOB" ? (
                  <JobCard job={(item as any).raw} />
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-100 p-6 h-full flex flex-col hover:shadow-xl transition-all duration-300 relative shadow-md shadow-slate-200/30">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 bg-blue-50 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 border border-blue-100">
                        {item.avatar ? (
                          <img src={item.avatar} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <UserCheck className="w-7 h-7 text-blue-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 text-[15px] truncate">{item.title}</h3>
                        <p className="text-blue-600 text-xs font-black uppercase tracking-tighter">{item.score}% MATCH</p>
                      </div>
                    </div>

                    <p className="text-slate-500 text-xs mb-4 line-clamp-2 min-h-[32px] font-medium leading-relaxed">
                      {item.subtitle}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {item.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-lg border border-slate-100">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-50">
                      <Link
                        href={`/recruiter/candidates/${item.id}`}
                        className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-slate-900 transition-colors shadow-lg shadow-blue-100"
                      >
                        Xem h? so <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 space-y-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
              <Search className="text-slate-300 w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-800">Chua tìm th?y d? li?u phù h?p</h3>
              <p className="text-slate-500 max-w-sm mx-auto">
                {isCandidate ? "Hãy d?m b?o b?n dã thi?t l?p CV m?c d?nh." : "Hãy dang thêm Job d? nh?n d? xu?t ?ng viên."}
              </p>
            </div>
            <Link href={isCandidate ? "/profile/cv-management" : "/recruiter/job-postings/create"} className="text-blue-600 font-bold hover:underline">
              {isCandidate ? "C?p nh?t CV ngay" : "T?o Job ngay"} &rarr;
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
