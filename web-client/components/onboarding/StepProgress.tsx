'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudUpload, UserCheck, Rocket, Check } from 'lucide-react';
import { Step } from '@/hooks/use-cv-import';
import { cn } from '@/lib/utils';

interface StepProgressProps {
  currentStep: Step;
}

const STEPS = [
  { id: 'upload', label: 'Tải CV', icon: CloudUpload },
  { id: 'review', label: 'Xác nhận', icon: UserCheck },
  { id: 'success', label: 'Hoàn tất', icon: Rocket }
] as const;

export function StepProgress({ currentStep }: StepProgressProps) {
  const getStepStatus = (stepId: typeof STEPS[number]['id']) => {
    const stepIndex = STEPS.findIndex(s => s.id === stepId);
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'upcoming';
  };

  const currentIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 px-4">
      <div className="relative flex items-start justify-between">
        {/* Background Line */}
        <div className="absolute top-[1.25rem] sm:top-[1.5rem] left-[10%] right-[10%] h-0.5 bg-slate-200 -z-10 rounded-full" />

        {/* Foreground Progress Lines */}
        <div className="absolute top-[1.25rem] sm:top-[1.5rem] left-[10%] right-[10%] h-0.5 -z-10 rounded-full flex overflow-hidden">
          {STEPS.map((_, idx) => {
            if (idx === STEPS.length - 1) return null;
            const isCompleted = idx < currentIndex;
            return (
              <div key={idx} className="flex-1 h-full">
                <motion.div
                  className="h-full bg-emerald-500 origin-left"
                  initial={false}
                  animate={{ scaleX: isCompleted ? 1 : 0 }}
                  transition={{ duration: 0.4, delay: 0.1, ease: 'easeInOut' }}
                />
              </div>
            );
          })}
        </div>

        {STEPS.map((step) => {
          const status = getStepStatus(step.id);
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex flex-col items-center relative z-10 w-20 sm:w-24">
              <motion.div
                initial={false}
                animate={{
                  scale: status === 'active' ? 1.05 : 1,
                  y: status === 'active' ? -2 : 0,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={cn(
                  "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300",
                  status === 'completed' && "bg-emerald-500 text-white shadow-md shadow-emerald-500/20",
                  status === 'active' && "bg-white border-2 border-sky-500 text-sky-600 shadow-lg shadow-sky-500/30 ring-4 ring-sky-50",
                  status === 'upcoming' && "bg-slate-100 text-slate-400 border border-slate-200"
                )}
              >
                {status === 'completed' ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Check className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={3} />
                  </motion.div>
                ) : (
                  <Icon
                    className={cn(
                      "w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300",
                      status === 'active' && "animate-pulse"
                    )}
                    strokeWidth={status === 'active' ? 2.5 : 2}
                  />
                )}
              </motion.div>

              <motion.span
                animate={{
                  scale: status === 'active' ? 1.05 : 1,
                  y: status === 'active' ? 2 : 0,
                }}
                className={cn(
                  "mt-2 text-[11px] sm:text-sm transition-colors duration-300 text-center whitespace-nowrap",
                  status === 'completed' && "text-emerald-700 font-semibold",
                  status === 'active' && "text-sky-700 font-bold",
                  status === 'upcoming' && "text-slate-400 font-medium",
                )}
              >
                {step.label}
              </motion.span>
            </div>
          );
        })}
      </div>
      {/* Optional AI helper text */}
      <AnimatePresence>
        {currentStep === 'upload' && (
          <motion.div
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
            className="text-center mt-6 text-sm text-sky-600/80 font-medium tracking-wide flex items-center justify-center gap-2"
          >

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
