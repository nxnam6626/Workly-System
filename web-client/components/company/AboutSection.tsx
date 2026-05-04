'use client';

import { useState } from "react";
import { 
  History, 
  Star, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Zap, 
  Target, 
  Rocket, 
  Sparkles,
  CheckCircle2,
  Trophy,
  Users2
} from "lucide-react";
import { Company } from "@/types/company";
import { motion, AnimatePresence } from "framer-motion";

interface AboutSectionProps {
  company: Partial<Company>;
}

export function AboutSection({ company }: AboutSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const description = company.description || "Thông tin giới thiệu về công ty đang được cập nhật.";
  
  const shouldTruncate = description.length > 300;
  const displayDescription = (!isExpanded && shouldTruncate) 
    ? description.substring(0, 300) + "..." 
    : description;

  // Stagger variants for motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="relative group">
      {/* Background Decor */}
      <div className="absolute -inset-1 bg-gradient-to-r from-mariner/20 to-blue-600/10 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
      
      <div className="relative bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100/80 p-8 md:p-12 overflow-hidden">
        {/* Decorative Mesh Background */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-mariner/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl" />

        <div className="space-y-12">
          {/* Main Description */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-1.5 bg-gradient-to-b from-mariner to-blue-400 rounded-full" />
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">
                Giới thiệu <span className="text-mariner">{company.companyName}</span>
              </h2>
            </div>
            
            <div className="relative">
              <p className="text-slate-600 text-lg leading-relaxed font-medium whitespace-pre-wrap">
                {displayDescription}
              </p>
              
              {shouldTruncate && (
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-4 flex items-center gap-2 px-6 py-2 rounded-full bg-slate-50 text-mariner font-black text-sm hover:bg-mariner hover:text-white transition-all duration-300 shadow-sm active:scale-95 border border-slate-100"
                >
                  {isExpanded ? (
                    <>Thu gọn <ChevronUp className="w-4 h-4" /></>
                  ) : (
                    <>Xem thêm <ChevronDown className="w-4 h-4" /></>
                  )}
                </button>
              )}
            </div>
          </motion.div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="space-y-12"
              >
                {/* Dynamic Sections with Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {company.sections?.map((section) => (
                    <motion.div 
                      key={section.id} 
                      variants={itemVariants}
                      className="group/item relative p-6 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-xl hover:border-mariner/20 transition-all duration-500"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-white shadow-sm text-mariner group-hover/item:scale-110 group-hover/item:bg-mariner group-hover/item:text-white transition-all duration-500">
                          <Zap className="w-6 h-6" />
                        </div>
                        <div className="space-y-3">
                          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                            {section.title}
                          </h3>
                          <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                            {section.content}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* History Timeline - Redesigned */}
                {company.history && company.history.length > 0 && (
                  <motion.div variants={itemVariants} className="space-y-8 pt-8 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      <History className="w-8 h-8 text-amber-500" />
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Hành trình phát triển</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {company.history.map((item, idx) => (
                        <div key={item.id} className="relative p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-lg transition-all group/year overflow-hidden">
                           <div className="absolute top-0 right-0 p-2 opacity-5 text-mariner transform translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-700">
                              <Trophy className="w-16 h-16" />
                           </div>
                           <span className="block text-3xl font-black text-mariner/20 group-hover:text-mariner/100 transition-colors duration-500 mb-2">{item.year}</span>
                           <p className="text-slate-700 font-bold text-sm leading-snug">{item.event}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Benefits - Modern Icon Grid */}
                {company.benefits && company.benefits.length > 0 && (
                  <motion.div variants={itemVariants} className="space-y-8 pt-8 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-8 h-8 text-mariner" />
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Đặc quyền & Văn hóa</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                      {company.benefits.map((benefit) => (
                        <div 
                          key={benefit.id} 
                          className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-100 group/benefit hover:shadow-xl hover:shadow-mariner/5 hover:border-mariner/30 transition-all duration-500"
                        >
                          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-md text-mariner group-hover/benefit:rotate-12 transition-transform duration-500">
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                          <span className="font-black text-slate-800 text-sm uppercase tracking-tight leading-tight">{benefit.title}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Culture CTA */}
                <motion.div 
                  variants={itemVariants}
                  className="mt-12 p-8 rounded-3xl bg-mariner text-white relative overflow-hidden group/cta"
                >
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 text-center md:text-left">
                       <h4 className="text-2xl font-black uppercase tracking-tight italic">Bạn có muốn đồng hành cùng chúng tôi?</h4>
                       <p className="text-blue-100 font-medium">Khám phá cơ hội nghề nghiệp tại môi trường làm việc tốt nhất Châu Á</p>
                    </div>
                    <button className="px-10 py-4 bg-white text-mariner font-black rounded-xl shadow-2xl hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-sm">
                      Ứng tuyển ngay
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
