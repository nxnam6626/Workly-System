import React from 'react';
import Link from 'next/link';
import { MapPin, DollarSign, Building2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export interface ChatJobCardProps {
  job: {
    id: string;
    title: string;
    companyName: string;
    location: string;
    salary: string;
    jobType?: string;
  };
}

export default function ChatJobCard({ job }: ChatJobCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm my-2 w-full max-w-sm"
    >
      <h4 className="font-semibold text-slate-800 text-sm line-clamp-2 mb-1.5">{job.title}</h4>
      
      <div className="space-y-1.5">
        <div className="flex items-center text-xs text-slate-600 gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{job.companyName}</span>
        </div>
        <div className="flex items-center text-xs text-slate-600 gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{job.location}</span>
        </div>
        <div className="flex items-center text-xs font-medium text-emerald-600 gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>{job.salary}</span>
        </div>
      </div>

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
