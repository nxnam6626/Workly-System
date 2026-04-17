'use client';

import { Building2, Search, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export function CTABanner() {
  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-10">
      <div className="relative w-full bg-mariner rounded-3xl overflow-hidden shadow-2xl">
        {/* Background Decorative Circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-safety-orange/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 items-center gap-10 p-8 lg:p-14">
          {/* Left: Content */}
          <div className="space-y-6 text-white text-center lg:text-left">
             <motion.div 
               initial={{ opacity: 0, y: 10 }}
               whileInView={{ opacity: 1, y: 0 }}
               className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/20"
             >
               <Building2 className="w-4 h-4 text-amber-300" />
               <span className="text-xs font-bold uppercase tracking-widest">Dành cho Nhà Tuyển Dụng</span>
             </motion.div>
             
             <h2 className="text-3xl lg:text-4xl font-black leading-tight tracking-tight">
               Tìm kiếm nhân tài <br />
               <span className="text-amber-400 italic">nhanh chóng & hiệu quả</span> cùng Workly
             </h2>
             
             <p className="text-blue-100 text-lg max-w-lg font-medium">
               Tiếp cận mạng lưới hơn 1.000.000 ứng viên tiềm năng và tối ưu quy trình tuyển dụng bằng công nghệ AI tiên tiến.
             </p>

             <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
               <Link
                 href="/recruiter/jobs/create"
                 className="w-full sm:w-auto px-8 py-4 bg-safety-orange hover:bg-[#e85a00] text-white font-black rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 group"
               >
                 <span>ĐĂNG TIN MIỄN PHÍ</span>
                 <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
               </Link>
               
               <Link
                 href="/recruiter/search-candidates"
                 className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-mariner font-black rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
               >
                 <Search className="w-5 h-5" />
                 <span>TÌM ỨNG VIÊN</span>
               </Link>
             </div>
          </div>

          {/* Right: Illustration Placeholder (We can generate an image later or use a stylized card) */}
          <div className="hidden lg:flex justify-center items-center">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               whileInView={{ scale: 1, opacity: 1 }}
               className="relative"
             >
               <div className="absolute -inset-4 bg-white/10 blur-xl rounded-full" />
               <img 
                 src="/assets/recruiter-illustration.png" 
                 alt="Employer CTA" 
                 className="relative z-10 w-[450px] drop-shadow-2xl"
               />
             </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
