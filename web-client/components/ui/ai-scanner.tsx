'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';

interface AIScannerProps {
  className?: string; // Additional classes for the container
}

export function AIScanner({ className = '' }: AIScannerProps) {
  return (
    <div className={`relative w-16 h-16 flex items-center justify-center shrink-0 ${className}`}>
      {/* Pulsing background rings */}
      <motion.div
        animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0.1, 0.6] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-1.5 bg-sky-100 rounded-full"
      />
      <motion.div
        animate={{ scale: [1, 1.7, 1], opacity: [0.3, 0, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
        className="absolute inset-1.5 bg-blue-50 rounded-full"
      />
      
      {/* Rotating dash ring */}
      <motion.div 
         className="absolute inset-0 rounded-full border-[1.5px] border-dashed border-sky-300/60"
         animate={{ rotate: 360 }}
         transition={{ duration: 10, ease: "linear", repeat: Infinity }}
      />

      {/* Bouncing core icon */}
      <motion.div
        animate={{ y: [-2, 2, -2] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 p-2.5 bg-white/95 backdrop-blur-md rounded-full shadow-[0_4px_15px_rgba(14,165,233,0.3)] border border-sky-100"
      >
        <Bot className="w-5 h-5 text-sky-500" strokeWidth={2} />
      </motion.div>

      {/* Orbiting sparkles */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[-4px] z-20 pointer-events-none"
      >
        <Sparkles className="absolute top-1 right-1 w-3 h-3 text-amber-400 drop-shadow-sm" strokeWidth={2.5} />
        <Sparkles className="absolute bottom-1 left-1 w-2 h-2 text-sky-400 drop-shadow-sm" />
      </motion.div>

      {/* Scanning laser line */}
      <motion.div
         animate={{ y: [-20, 20, -20], opacity: [0, 1, 1, 0, 0] }}
         transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
         className="absolute w-14 left-1/2 -translate-x-1/2 h-[2px] bg-gradient-to-r from-transparent via-sky-400 to-transparent z-30 shadow-[0_0_8px_rgba(56,189,248,0.8)]"
      />
    </div>
  );
}
