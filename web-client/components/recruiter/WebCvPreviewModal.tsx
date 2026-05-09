'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, FileText, Briefcase, GraduationCap, Award } from 'lucide-react';

interface WebCvPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: any;
  onUnlock: (candidateId: string, cvId: string, fullName: string) => void;
  wallet: any;
  subscription: any;
  isUnlocking: boolean;
}

export function WebCvPreviewModal({
  isOpen,
  onClose,
  candidate,
  onUnlock,
  wallet,
  subscription,
  isUnlocking,
}: WebCvPreviewModalProps) {
  if (!candidate) return null;

  const parsedData = candidate.parsedData || {};
  const experiences = parsedData.experience || [];
  const education = parsedData.education || [];
  const skills = parsedData.skills || candidate.skills || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="relative w-full max-w-3xl max-h-[90vh] bg-slate-50 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header / CTA Banner */}
            <div className="bg-white border-b border-slate-200 px-6 sm:px-8 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sticky top-0 z-10">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 truncate">
                  <FileText className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                  <span className="truncate">{candidate.fullName}</span>
                </h2>
                <p className="text-sm text-slate-500 mt-1 truncate">
                  Đã ẩn thông tin liên hệ và PDF gốc để bảo mật.
                </p>
              </div>

              <div className="flex items-start gap-3 sm:gap-4 flex-shrink-0 w-full sm:w-auto justify-end mt-2 sm:mt-0">
                {!candidate.isUnlocked && (
                  <div className="flex flex-col items-end gap-1.5 flex-1 sm:flex-none">
                    <button
                      onClick={() => onUnlock(candidate.candidateId, candidate.cvId, candidate.fullName)}
                      disabled={isUnlocking}
                      className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 text-white rounded-xl text-sm font-semibold shadow-sm flex items-center justify-center gap-2 px-6 py-3 transition-colors"
                    >
                      {isUnlocking ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Lock className="w-4 h-4 flex-shrink-0" />
                          <span>Mở khóa ({(wallet?.cvUnlockQuota ?? 0) > 0 ? '1 Lượt' : (subscription && new Date() <= new Date(subscription.expiryDate) ? '30 Xu' : '50 Xu')})</span>
                        </>
                      )}
                    </button>
                    <span className="text-[10px] text-slate-500 font-medium text-right bg-slate-100 px-2 py-0.5 rounded">
                      {(wallet?.cvUnlockQuota ?? 0) > 0 
                        ? `Còn ${wallet.cvUnlockQuota} lượt miễn phí` 
                        : `Sẽ trừ trực tiếp vào số dư Xu`}
                    </span>
                  </div>
                )}

                <button
                  onClick={onClose}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Profile Summary */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-xl font-bold border-2 border-white shadow-sm overflow-hidden">
                    {candidate.avatar ? (
                      <img src={candidate.avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      candidate.fullName.charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{candidate.fullName}</h3>
                    <div className="flex flex-col gap-1 mt-1 text-sm text-slate-500">
                      <p className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-slate-400" /> {candidate.email}
                      </p>
                      <p className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-slate-400" /> {candidate.phone}
                      </p>
                    </div>
                  </div>
                </div>
                
                {parsedData.summary && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {parsedData.summary}
                    </p>
                  </div>
                )}
              </div>

              {/* Experience */}
              {experiences.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-500" />
                    Kinh nghiệm làm việc
                  </h4>
                  <div className="space-y-4">
                    {experiences.map((exp: any, idx: number) => (
                      <div key={idx} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-colors">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-100 group-hover:bg-blue-500 transition-colors" />
                        <h5 className="font-bold text-slate-900">{exp.role || exp.title}</h5>
                        <p className="text-sm text-slate-600 font-medium mb-2">{exp.company}</p>
                        <p className="text-xs text-slate-400 mb-3 bg-slate-50 inline-block px-2 py-1 rounded">
                          {exp.duration || `${exp.startDate || ''} ${exp.startDate && exp.endDate ? '-' : ''} ${exp.endDate || (exp.startDate ? 'Hiện tại' : '')}`}
                        </p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {exp.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {education.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-emerald-500" />
                    Học vấn
                  </h4>
                  <div className="space-y-4">
                    {education.map((edu: any, idx: number) => (
                      <div key={idx} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-start gap-4 hover:border-emerald-200 transition-colors">
                        <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <GraduationCap className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-900">{edu.degree || edu.major}</h5>
                          <p className="text-sm text-slate-600 mt-1">{edu.institution || edu.school}</p>
                          <p className="text-xs text-slate-400 mt-1">{edu.duration || `${edu.startDate || ''} ${edu.startDate && edu.endDate ? '-' : ''} ${edu.endDate || ''}`}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {skills.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-500" />
                    Kỹ năng
                  </h4>
                  <div className="flex flex-wrap gap-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    {skills.map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
