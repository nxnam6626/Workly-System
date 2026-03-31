'use client';

import { motion } from 'framer-motion';
import { Hammer, Wrench, Settings } from 'lucide-react';

export default function RapidJobsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-slate-50/50 rounded-2xl border border-dashed border-slate-300">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center"
      >
        <div className="relative w-24 h-24 mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 flex items-center justify-center text-indigo-200"
          >
            <Settings className="w-24 h-24" />
          </motion.div>
          <div className="absolute inset-0 flex items-center justify-center gap-2">
            <Hammer className="w-8 h-8 text-indigo-600 rounded-full" />
            <Wrench className="w-8 h-8 text-amber-500 rounded-full" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-slate-800 mb-3 text-center">Tính Năng Đang Phát Triển</h1>
        <p className="text-slate-500 max-w-md text-center leading-relaxed">
          Hệ thống cấu hình Crawler API nguồn cấp dữ liệu việc làm tự động đang được đội ngũ kỹ sư của chúng tôi hoàn thiện. Vui lòng quay lại sau!
        </p>
      </motion.div>
    </div>
  );
}
