import React from 'react';
import Link from 'next/link';
import { MapPin, DollarSign, Building2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export interface ChatJobCardProps {
  job: {
    id: string;
    title: string;
    companyName?: string;
    company_name?: string;
    location: string;
    salary: string;
    jobType?: string;
    percent?: number;
    why_match?: string;
  };
}

export default function ChatJobCard({ job }: ChatJobCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm my-2 w-full max-w-sm hover:border-indigo-200 transition-colors"
    >
      <div className="flex justify-between items-start gap-2 mb-2">
        <h4 className="font-bold text-slate-800 text-sm line-clamp-2 leading-tight">{job.title}</h4>
        
        {job.percent != null && (
          <div className="flex items-center justify-center shrink-0 w-10 h-10 rounded-full border-[3px] border-emerald-100 bg-emerald-50">
            <span className="text-xs font-black text-emerald-600">{job.percent}%</span>
          </div>
        )}
      </div>
      
      <div className="space-y-2 mt-1">
        <div className="flex items-center text-[13px] text-slate-600 gap-1.5 font-medium">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{job.companyName || job.company_name}</span>
        </div>
        <div className="flex items-center text-[13px] text-slate-600 gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{job.location}</span>
        </div>
        <div className="flex items-center text-[13px] font-bold text-emerald-600 gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>{job.salary}</span>
        </div>
      </div>

      {job.why_match && (
        <div className="mt-3 p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-lg">
          <p className="text-[11px] text-indigo-700 leading-relaxed font-medium">
            <span className="font-bold">✨ Lý do đề xuất:</span> {job.why_match}
          </p>
        </div>
      )}

      <div className="mt-3.5 pt-3 border-t border-slate-100">
        <Link 
          href={`/jobs/${job.id}`}
          target="_blank"
          className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
        >
          <span>Xem chi tiết công việc</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </motion.div>
  );
}
