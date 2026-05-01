'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function BannerSlider() {
  const [current, setCurrent] = useState(0);
  const images = [
    "/job-search-banner.png",
  ];

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="relative w-full h-full min-h-[200px] rounded-3xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.1)] group">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-0 w-full h-full"
        >
          <img
            src={images[current]}
            alt="Tuyển dụng Workly"
            className="w-full h-full object-cover transform transition-transform duration-[5s] group-hover:scale-105"
          />
          {/* Enhanced Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 p-8 pt-20 pointer-events-none">
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
               className="text-white"
             >
                <div className="w-12 h-1 bg-safety-orange mb-3 rounded-full" />
                <h3 className="text-2xl font-black drop-shadow-lg uppercase tracking-tight">KẾT NỐI TƯƠNG LAI CÙNG WORKLY</h3>
             </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Modern Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((prev) => (prev - 1 + images.length) % images.length)}
            className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/30 hover:scale-110 active:scale-95"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5px]" />
          </button>
          <button
            onClick={() => setCurrent((prev) => (prev + 1) % images.length)}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/30 hover:scale-110 active:scale-95"
          >
            <ChevronRight className="w-6 h-6 stroke-[2.5px]" />
          </button>
        </>
      )}

      {/* Floating Indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-6 right-8 flex gap-3 z-20">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`h-1.5 rounded-full transition-all duration-500 ${current === idx ? "w-8 bg-safety-orange" : "w-4 bg-white/40 hover:bg-white/60"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
