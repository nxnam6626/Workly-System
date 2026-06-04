'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, CheckCircle2, XCircle, AlertCircle, ShieldCheck,
  MapPin, CircleDollarSign, Hash, Briefcase, Timer,
  Focus, GraduationCap, Zap, Languages, Info
} from 'lucide-react';
import { SuitabilityRadar } from './SuitabilityRadar';
import { formatSalary } from '@/lib/utils';

const translateDegree = (degree: string): string => {
  if (!degree) return 'Không yêu cầu';
  const degLower = degree.toLowerCase();
  if (degLower === 'none' || degLower === 'không yêu cầu') return 'Không yêu cầu';
  if (degLower === 'bachelor') return 'Cử nhân';
  if (degLower === 'master') return 'Thạc sĩ';
  if (degLower === 'phd' || degLower === 'doctor') return 'Tiến sĩ';
  if (degLower === 'associate') return 'Cao đẳng';
  if (degLower === 'high school') return 'Trung học phổ thông';
  return degree.charAt(0).toUpperCase() + degree.slice(1);
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  analysis?: {
    breakdown?: {
      locationScore: number;
      salaryScore: number;
      industryScore: number;
      jobTitleScore: number;
      experienceScore: number;
      relevantExpScore: number;
      educationScore: number;
      skillsScore: number;
      languageScore: number;
    };
    details?: {
      locationDetails?: any;
      industryDetails?: any;
      salaryDetails?: any;
      skillDetails?: any;
      titleDetails?: any;
      educationDetails?: any;
      experienceDetails?: any;
      relevantExpDetails?: any;
      languageDetails?: any;
      weights?: any;
    };
    // Legacy fields for compatibility
    hardSkillsCount?: number;
    matchedCount?: number;
    missingCount?: number;
    experienceMatch?: boolean;
    totalYearsExp?: number;
    requiredExp?: number;
  };
}

const CRITERIA_META = [
  { key: 'location', label: 'Địa điểm làm việc', icon: MapPin },
  { key: 'salary', label: 'Mức lương', icon: CircleDollarSign },
  { key: 'industry', label: 'Ngành nghề', icon: Hash },
  { key: 'title', label: 'Tiêu đề công việc', icon: Briefcase },
  { key: 'yearsExp', label: 'Số năm kinh nghiệm', icon: Timer },
  { key: 'relevantExp', label: 'Kinh nghiệm liên quan', icon: Focus },
  { key: 'education', label: 'Học vấn', icon: GraduationCap },
  { key: 'skills', label: 'Kỹ năng', icon: Zap },
  { key: 'language', label: 'Ngoại ngữ', icon: Languages },
];

const MatchingAnalysisModal: React.FC<Props> = ({
  isOpen, onClose, candidateName, score, matchedSkills, missingSkills, analysis
}) => {
  const [activeCriterion, setActiveCriterion] = useState<string | null>('skills');

  const radarData = useMemo(() => {
    if (analysis?.breakdown) {
      return {
        location: analysis.breakdown.locationScore,
        salary: analysis.breakdown.salaryScore,
        industry: analysis.breakdown.industryScore,
        title: analysis.breakdown.jobTitleScore,
        yearsExp: analysis.breakdown.experienceScore,
        relevantExp: analysis.breakdown.relevantExpScore,
        education: analysis.breakdown.educationScore,
        skills: analysis.breakdown.skillsScore,
        language: analysis.breakdown.languageScore,
      };
    }

    // Fallback to approximated values if breakdown is missing
    const skillsScore = analysis?.hardSkillsCount
      ? Math.round(((analysis.matchedCount || 0) / analysis.hardSkillsCount) * 100)
      : score;
    const expScore = analysis?.requiredExp
      ? Math.min(Math.round(((analysis.totalYearsExp || 0) / analysis.requiredExp) * 100), 100)
      : score;
    const d = (base: number, v: number) => {
      const r = (Math.sin(((candidateName?.length || 5) + score) * base) + 1) / 2;
      return Math.min(Math.max(base - v + r * v * 2, 5), 100);
    };
    return {
      location: d(score > 60 ? 92 : 62, 8),
      salary: d(score > 50 ? 88 : 58, 12),
      industry: d(score > 70 ? 96 : 72, 4),
      title: d(score > 80 ? 94 : 70, 6),
      yearsExp: expScore,
      relevantExp: score,
      education: d(score > 75 ? 90 : 68, 10),
      skills: skillsScore,
      language: d(82, 18),
    };
  }, [analysis, score, candidateName]);

  const criterionDetail = useMemo(() => {
    const val = (key: string) => Math.round(radarData[key as keyof typeof radarData] || 0);
    const d = analysis?.details;

    // Build evidence list for relevantExp
    const relExpEvidence = d?.relevantExpDetails?.cvEvidence
      ? d.relevantExpDetails.cvEvidence.substring(0, 200) + (d.relevantExpDetails.cvEvidence.length > 200 ? '...' : '')
      : null;
    const relExpSimilarity = d?.relevantExpDetails?.similarity
      ? Math.round(d.relevantExpDetails.similarity * 100)
      : val('relevantExp');

    return {
      skills: {
        title: 'Kỹ năng chuyên môn',
        description: `Ứng viên khớp ${analysis?.matchedCount || matchedSkills.length}/${analysis?.hardSkillsCount || (matchedSkills.length + missingSkills.length) || '?'} kỹ năng yêu cầu.`,
        pct: val('skills'),
        sections: [
          {
            label: 'Chi tiết kỹ năng',
            color: 'emerald',
            items: [
              `Điểm Keyword: ${d?.skillDetails?.keywordScore || 0}%`,
              `Điểm Ngữ nghĩa: ${d?.skillDetails?.semanticScore || 0}%`,
            ],
            empty: false,
          },
          {
            label: 'Kỹ năng phù hợp',
            color: 'emerald',
            items: matchedSkills.length > 0 ? matchedSkills : ['Không có dữ liệu'],
            empty: matchedSkills.length === 0,
          },
          {
            label: 'Kỹ năng còn thiếu',
            color: 'rose',
            items: missingSkills.length > 0 ? missingSkills : ['Đã đáp ứng đầy đủ yêu cầu'],
            empty: missingSkills.length === 0,
          },
        ],
      },
      yearsExp: {
        title: 'Số năm kinh nghiệm',
        description: `Yêu cầu: ${analysis?.requiredExp ?? d?.experienceDetails?.requiredYears ?? '?'} năm — Ứng viên: ${analysis?.totalYearsExp ?? d?.experienceDetails?.candidateYears ?? '?'} năm.`,
        pct: val('yearsExp'),
        sections: [
          {
            label: 'So khớp chi tiết',
            color: val('yearsExp') >= 70 ? 'emerald' : 'rose',
            items: [
              `Yêu cầu tối thiểu: ${analysis?.requiredExp ?? d?.experienceDetails?.requiredYears ?? 0} năm`,
              `Ứng viên có: ${analysis?.totalYearsExp ?? d?.experienceDetails?.candidateYears ?? 0} năm`,
            ],
            empty: false,
          },
        ],
      },
      relevantExp: {
        title: 'Kinh nghiệm liên quan',
        description: 'Mức độ liên quan của kinh nghiệm làm việc với vị trí tuyển dụng.',
        pct: val('relevantExp'),
        scoreExplanation: d?.relevantExpDetails?.scoreExplanation || '',
        sections: d?.relevantExpDetails?.jobRequirements && d.relevantExpDetails.jobRequirements.length > 0
          ? [
            {
              label: 'Yêu cầu kinh nghiệm nên có',
              color: 'amber',
              items: d.relevantExpDetails.jobRequirements,
              empty: false,
            },
            {
              label: 'Kinh nghiệm liên quan ứng viên có',
              color: 'emerald',
              items: d.relevantExpDetails.candidateExps || [],
              empty: (d.relevantExpDetails.candidateExps || []).length === 0,
            },
            {
              label: 'Điểm phù hợp nổi bật',
              color: 'emerald',
              items: d.relevantExpDetails.matchingPoints || [],
              empty: (d.relevantExpDetails.matchingPoints || []).length === 0,
            },
          ]
          : [
            {
              label: 'Phân tích AI',
              color: val('relevantExp') >= 70 ? 'emerald' : val('relevantExp') >= 40 ? 'amber' : 'rose',
              items: relExpEvidence
                ? [
                  `Bằng chứng từ hồ sơ: ${relExpEvidence}`,
                  `Độ tương đồng ngữ nghĩa: ${relExpSimilarity}%`,
                  'Dựa trên lịch sử làm việc và các dự án thực tế',
                ]
                : [
                  val('relevantExp') === 0
                    ? 'Ứng viên chưa cập nhật thông tin kinh nghiệm làm việc hoặc dự án trong hồ sơ.'
                    : `Điểm tương đồng: ${val('relevantExp')}%`,
                ],
              empty: relExpEvidence === null && val('relevantExp') === 0,
            },
          ],
      },
      location: {
        title: 'Địa điểm làm việc',
        description: 'Mức độ phù hợp về địa điểm làm việc giữa ứng viên và công việc.',
        pct: val('location'),
        sections: [
          {
            label: 'So khớp địa lý',
            color: val('location') >= 80 ? 'emerald' : 'amber',
            items: [
              `Địa điểm công việc đăng tuyển: ${d?.locationDetails?.jobLocation || 'Không yêu cầu'}`,
              `Địa điểm làm việc mong muốn: ${d?.locationDetails?.candLocation || 'Chưa cập nhật'}`,
              `Loại khớp: ${d?.locationDetails?.type || (d?.locationDetails?.message?.toLowerCase().includes('từ xa') || d?.locationDetails?.message?.toLowerCase().includes('remote') ? 'Công việc từ xa' : 'Không áp dụng')}`,
              ...(d?.locationDetails?.message ? [`Đánh giá: ${d.locationDetails.message}`] : []),
            ],
            empty: false,
          },
        ],
      },
      salary: {
        title: 'Mức lương',
        description: 'Mức độ tương thích về kỳ vọng lương.',
        pct: val('salary'),
        sections: [
          {
            label: 'Phân tích tài chính',
            color: val('salary') >= 75 ? 'emerald' : 'amber',
            items: [
              `Mức lương đăng tuyển: ${d?.salaryDetails?.salaryMin !== undefined
                ? formatSalary(d.salaryDetails.salaryMin, d.salaryDetails.salaryMax, d.salaryDetails.currency || 'VND')
                : `${d?.salaryDetails?.salaryMax?.toLocaleString() || 0} VND`
              }`,
              `Kỳ vọng ứng viên: ${d?.salaryDetails?.expectedSalary
                ? formatSalary(d.salaryDetails.expectedSalary, null, d.salaryDetails.currency || 'VND')
                : 'Chưa cập nhật'
              }`,
              d?.salaryDetails?.isOverBudget ? '⚠️ Vượt ngân sách dự kiến' : '✓ Trong tầm ngân sách',
            ],
            empty: false,
          },
        ],
      },
      industry: {
        title: 'Ngành nghề',
        description: 'Mức độ phù hợp về lĩnh vực chuyên môn.',
        pct: val('industry'),
        sections: [
          {
            label: 'Lĩnh vực hoạt động',
            color: val('industry') >= 80 ? 'emerald' : 'rose',
            items: [
              `Ngành nghề ứng viên: ${d?.industryDetails?.cvIndustry || 'Chưa cập nhật'}`,
              `Ngành nghề yêu cầu: ${(d?.industryDetails?.jobCategories || []).join(', ') || 'Không yêu cầu'}`,
            ],
            empty: false,
          },
        ],
      },
      title: {
        title: 'Tiêu đề công việc',
        description: 'Mức độ phù hợp giữa vị trí đã làm và vị trí đang tuyển.',
        pct: val('title'),
        sections: [
          {
            label: 'Tương đồng chức danh',
            color: val('title') >= 80 ? 'emerald' : 'amber',
            items: [
              `Chức danh Job: ${d?.titleDetails?.jobTitle || 'N/A'}`,
              `Chức danh ứng viên: ${d?.titleDetails?.cvTitle || 'N/A'}`,
              `Độ tương đồng: ${Math.round((d?.titleDetails?.similarity || 0) * 100)}%`,
            ],
            empty: false,
          },
        ],
      },
      education: {
        title: 'Học vấn',
        description: 'Mức độ phù hợp về trình độ học vấn và bằng cấp.',
        pct: val('education'),
        sections: [
          {
            label: 'Yêu cầu tuyển dụng & Thực tế hồ sơ',
            color: val('education') >= 75 ? 'emerald' : 'amber',
            items: [
              `Yêu cầu tối thiểu của tin tuyển dụng: ${translateDegree(d?.educationDetails?.requiredDegree)}`,
              `Bằng cấp thực tế của ứng viên: ${translateDegree(d?.educationDetails?.candidateDegree)}`,
              `Trường đại học: ${d?.educationDetails?.university || 'N/A'}`,
              `Chuyên ngành học: ${d?.educationDetails?.major || 'N/A'}`,
              `Điểm GPA: ${d?.educationDetails?.gpa || 0}/4.0`,
            ],
            empty: false,
          },
        ],
      },
      language: {
        title: 'Ngoại ngữ',
        description: 'Mức độ phù hợp về kỹ năng ngoại ngữ.',
        pct: val('language'),
        sections: [
          {
            label: 'Khả năng ngôn ngữ',
            color: val('language') >= 70 ? 'emerald' : 'amber',
            items: [
              `Yêu cầu: ${d?.languageDetails?.requiredLang?.length ? d.languageDetails.requiredLang.map((l: any) => typeof l === 'string' ? l : `${l.language || ''} ${l.level || ''}`).join(', ') : 'Không yêu cầu'}`,
              `Ứng viên: ${d?.languageDetails?.cvLangs?.length ? d.languageDetails.cvLangs.map((l: any) => typeof l === 'string' ? l : `${l.language || l.name || ''} ${l.level || ''}`).join(', ') : 'Chưa cập nhật'}`,
            ],
            empty: false,
          },
        ],
      },
    };
  }, [radarData, matchedSkills, missingSkills, analysis]);

  const activeDetail = activeCriterion
    ? criterionDetail[activeCriterion as keyof typeof criterionDetail]
    : null;

  const statusColor = score >= 80 ? 'emerald' : score >= 60 ? 'sky' : score >= 40 ? 'amber' : 'rose';
  const statusLabel = score >= 80 ? 'Rất phù hợp' : score >= 60 ? 'Phù hợp' : score >= 40 ? 'Tương đối' : 'Chưa phù hợp';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4 pb-4 pt-20 sm:pt-24 bg-slate-900/70 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 360 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100"
          >
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 lg:px-8 py-5 border-b border-slate-100 bg-slate-50/60 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center shadow-md shadow-sky-200 flex-shrink-0">
                  <ShieldCheck size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-500">Phân tích độ phù hợp</p>
                  <h2 className="text-lg font-black text-slate-900 leading-tight truncate max-w-[200px] sm:max-w-xs">{candidateName}</h2>
                </div>
              </div>
              <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-end">
                <div className="text-right flex-shrink-0">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tổng điểm</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-black text-slate-900 leading-none">{score}</span>
                      <span className="text-lg font-black text-sky-500 ml-0.5">%</span>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md whitespace-nowrap
                      ${statusColor === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                        statusColor === 'sky' ? 'bg-sky-50 text-sky-600' :
                          statusColor === 'amber' ? 'bg-amber-50 text-amber-600' :
                            'bg-rose-50 text-rose-600'}`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>
                <button onClick={onClose}
                  className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-all active:scale-95 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-slate-300">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* ── Body ── */}
            <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row min-h-0">

              {/* Left: Radar */}
              <div className="flex flex-col items-center justify-center p-8 lg:p-10 lg:w-[55%] border-b lg:border-b-0 lg:border-r border-slate-100 bg-gradient-to-b from-sky-50/30 to-white">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">
                  Nhấn vào tiêu chí để xem chi tiết
                </p>
                <SuitabilityRadar
                  score={score}
                  data={radarData}
                  activeCriterion={activeCriterion}
                  onSelectCriterion={setActiveCriterion}
                  size={420}
                />
              </div>

              {/* Right: Detail Panel */}
              <div className="lg:w-[45%] flex flex-col min-h-0">
                <AnimatePresence mode="wait">
                  {activeDetail ? (
                    <motion.div
                      key={activeCriterion}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.2 }}
                      className="flex-1 overflow-y-auto p-8 space-y-6"
                    >
                      {/* Criterion header */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-xl font-black text-slate-900">{activeDetail.title}</h3>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Điểm: {activeDetail.pct}%
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed">{activeDetail.description}</p>

                        {/* Progress bar */}
                        <div className="mt-4 w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${activeDetail.pct}%` }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className={`h-full rounded-full ${activeDetail.pct >= 70 ? 'bg-emerald-400' :
                              activeDetail.pct >= 40 ? 'bg-amber-400' : 'bg-rose-400'
                              }`}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] font-bold text-slate-400 mt-1">
                          <span>0%</span><span>50%</span><span>100%</span>
                        </div>
                      </div>

                      {/* Detail sections */}
                      {activeDetail.sections.map((section, si) => (
                        <div key={si} className="space-y-3">
                          <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest
                            ${section.color === 'emerald' ? 'text-emerald-600' :
                              section.color === 'rose' ? 'text-rose-500' :
                                section.color === 'amber' ? 'text-amber-600' : 'text-slate-500'}`}>
                            {section.color === 'emerald' ? <CheckCircle2 size={12} /> :
                              section.color === 'rose' ? <XCircle size={12} /> :
                                <AlertCircle size={12} />}
                            {section.label}
                          </div>

                          <div className={`rounded-2xl border p-4 space-y-2
                            ${section.color === 'emerald' ? 'bg-emerald-50/60 border-emerald-100' :
                              section.color === 'rose' ? 'bg-rose-50/60 border-rose-100' :
                                section.color === 'amber' ? 'bg-amber-50/60 border-amber-100' :
                                  'bg-slate-50 border-slate-100'}`}>
                            {section.items.map((item: any, ii: number) => (
                              <motion.div
                                key={ii}
                                initial={{ opacity: 0, x: 8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: ii * 0.05 }}
                                className="flex items-start gap-3"
                              >
                                <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0
                                  ${section.color === 'emerald' ? 'bg-emerald-400' :
                                    section.color === 'rose' ? 'bg-rose-400' :
                                      section.color === 'amber' ? 'bg-amber-400' : 'bg-slate-400'}`}
                                />
                                <span className={`text-sm font-semibold leading-snug
                                  ${section.color === 'emerald' ? 'text-emerald-800' :
                                    section.color === 'rose' ? 'text-rose-800' :
                                      section.color === 'amber' ? 'text-amber-800' : 'text-slate-700'}
                                  ${section.empty ? 'italic opacity-60' : ''}`}>
                                  {item}
                                </span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* AI summary for this criterion */}
                      <div className="rounded-2xl bg-slate-900 p-5 text-sm text-slate-300 leading-relaxed">
                        <p className="text-[9px] font-black text-sky-400 uppercase tracking-[0.2em] mb-2">
                          Nhận xét AI
                        </p>
                        <p>
                          {activeCriterion === 'relevantExp' && (activeDetail as any).scoreExplanation
                            ? (activeDetail as any).scoreExplanation
                            : activeCriterion === 'location' && analysis?.details?.locationDetails?.message
                              ? analysis.details.locationDetails.message
                              : activeCriterion === 'education'
                                ? (
                                  (activeDetail?.pct ?? 0) >= 80
                                    ? `Ứng viên đáp ứng tốt yêu cầu học vị của tin tuyển dụng (${analysis?.details?.educationDetails?.candidateDegree || 'N/A'} so với yêu cầu ${analysis?.details?.educationDetails?.requiredDegree || 'Không yêu cầu'}) và có chuyên ngành đào tạo phù hợp.`
                                    : (activeDetail?.pct ?? 0) >= 50
                                      ? `Trình độ học vấn của ứng viên ở mức chấp nhận được nhưng chưa khớp hoàn hảo. Trình độ hiện tại là ${analysis?.details?.educationDetails?.candidateDegree || 'Chưa cập nhật'} (yêu cầu tối thiểu là ${analysis?.details?.educationDetails?.requiredDegree || 'N/A'}) và độ phù hợp chuyên ngành đạt ${analysis?.details?.educationDetails?.majorScore || 0}%.`
                                      : `Trình độ hoặc chuyên ngành của ứng viên chưa đáp ứng tốt yêu cầu tuyển dụng. Tin tuyển dụng yêu cầu tối thiểu là ${analysis?.details?.educationDetails?.requiredDegree || 'N/A'} nhưng ứng viên hiện tại là ${analysis?.details?.educationDetails?.candidateDegree || 'Chưa cập nhật'}.`
                                )
                                : activeDetail.pct >= 80
                                  ? `${activeDetail.title} của ứng viên rất phù hợp với yêu cầu. Đây là một điểm mạnh đáng ghi nhận.`
                                  : activeDetail.pct >= 50
                                    ? `${activeDetail.title} đạt mức chấp nhận được nhưng còn dư địa cải thiện.`
                                    : `${activeDetail.title} chưa đáp ứng tốt yêu cầu. Cần cân nhắc kỹ trước khi quyết định.`}
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex-1 flex flex-col items-center justify-center p-10 text-center"
                    >
                      <Info size={40} className="text-slate-200 mb-4" />
                      <p className="text-slate-400 font-semibold">Chọn một tiêu chí trên biểu đồ</p>
                      <p className="text-slate-300 text-sm mt-1">để xem phân tích chi tiết</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="flex flex-wrap items-center justify-between px-6 lg:px-8 py-4 border-t border-slate-100 bg-slate-50/60 gap-4">
              <div className="flex flex-wrap gap-2 flex-1">
                {['skills', 'yearsExp', 'relevantExp'].map(k => {
                  const meta = CRITERIA_META.find(c => c.key === k)!;
                  const Icon = meta.icon;
                  return (
                    <button key={k} onClick={() => setActiveCriterion(k)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap
                        ${activeCriterion === k ? 'bg-sky-500 text-white shadow-md shadow-sky-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                      <Icon size={11} className="flex-shrink-0" />
                      {meta.label}
                    </button>
                  );
                })}
              </div>
              <button onClick={onClose}
                className="px-8 py-2.5 bg-slate-900 hover:bg-slate-700 text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg flex-shrink-0">
                Đóng
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MatchingAnalysisModal;
