'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Heart, ArrowRight, Loader2, Bookmark, MapPin, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { useFavoriteStore } from '@/stores/favorites';
import { formatSalary } from '@/lib/utils';

export function SavedJobsDropdown() {
  const { isAuthenticated } = useAuthStore();
  const { favorites, isLoading, fetchFavorites } = useFavoriteStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const totalCount = favorites.length;
  const displayedJobs = favorites.slice(0, 5);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchFavorites();
    }
  }, [isOpen, isAuthenticated, fetchFavorites]);

  // Initial fetch for count
  useEffect(() => {
    if (isAuthenticated) {
      fetchFavorites();
    }
  }, [isAuthenticated, fetchFavorites]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all shadow-sm hover:scale-110 active:scale-95 duration-200"
        title="Đăng nhập để xem việc làm đã lưu"
      >
        <Heart className="w-5 h-5" />
      </Link>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm hover:scale-110 active:scale-95 z-10 relative ${
          isOpen 
            ? 'bg-rose-500 text-white border-rose-500' 
            : 'bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200'
        }`}
        title="Việc làm đã lưu"
      >
        <Heart className={`w-5 h-5 ${isOpen ? 'fill-current' : ''}`} />
        {totalCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            {totalCount > 9 ? '9+' : totalCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute right-0 mt-3 w-85 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 z-50 overflow-hidden ring-1 ring-black/5"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between bg-gradient-to-r from-slate-50/80 to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
                  <Bookmark className="w-4 h-4 text-rose-500" />
                </div>
                <h3 className="font-bold text-slate-800 text-[15px] tracking-tight">
                  Tin đăng đã lưu
                </h3>
              </div>
              <Link 
                href="/saved-jobs" 
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-blue-50"
                >
                Xem tất cả
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* List */}
            <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="p-12 flex flex-col items-center justify-center space-y-4">
                  <div className="w-10 h-10 border-2 border-slate-100 border-t-rose-500 rounded-full animate-spin" />
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Đang tải dữ liệu</p>
                </div>
              ) : displayedJobs.length > 0 ? (
                <div className="divide-y divide-slate-50 p-2">
                  {displayedJobs.map((job) => (
                    <Link
                      key={job.jobPostingId}
                      href={`/jobs/${job.jobPostingId}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-start gap-3.5 p-3 hover:bg-slate-50 rounded-xl transition-all duration-200 group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm group-hover:border-rose-100 transition-colors">
                        {job.company.logo ? (
                          <img src={job.company.logo} alt={job.company.companyName} className="w-full h-full object-contain p-1.5" />
                        ) : (
                          <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300 font-bold text-xs uppercase">
                            {job.company.companyName.substring(0, 2)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[14px] font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors leading-tight">
                          {job.title}
                        </h4>
                        <p className="text-[12px] text-slate-500 truncate mt-0.5 font-medium">
                          {job.company.companyName}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1 text-emerald-600 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md">
                            <Briefcase className="w-3 h-3" />
                            {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
                          </div>
                          <div className="flex items-center gap-1 text-slate-400 font-medium text-[11px]">
                            <MapPin className="w-3 h-3" />
                            {job.locationCity || 'Toán quốc'}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                    <Heart className="w-8 h-8" />
                  </div>
                  <div className="space-y-1.5 px-6">
                    <p className="text-sm font-bold text-slate-700">Danh sách trống</p>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">Bắt đầu lưu những công việc bạn quan tâm để xem lại sau nhé!</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {favorites.length > 0 && (
              <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                <Link
                  href="/jobs"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-2.5 flex items-center justify-center gap-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-sm transition-all duration-300 active:scale-[0.98]"
                >
                  Khám phá thêm việc làm
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
