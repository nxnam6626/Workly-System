import React from 'react';
import { Briefcase, Info, Save, Crown, Eye, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  setCurrentStep: (step: number) => void;
  isDirectEdit?: boolean;
}

export const StepIndicator = ({ currentStep, totalSteps, setCurrentStep, isDirectEdit }: StepIndicatorProps) => {
  const steps = [
    { step: 1, label: 'Cơ bản', icon: Briefcase },
    { step: 2, label: 'Kỹ năng', icon: Info },
    { step: 3, label: 'Nội dung', icon: Save },
    { step: 4, label: 'Thiết lập', icon: Crown },
    { step: 5, label: 'Preview', icon: Eye }
  ];

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-8 sticky top-4 z-40">
      <div className="max-w-3xl mx-auto relative px-2">
        {/* Background Line */}
        <div className="absolute top-5 left-10 right-10 h-1 bg-slate-100 rounded-full -translate-y-1/2 z-0" />
        
        {/* Progress Line */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `calc(((currentStep - 1) / (totalSteps - 1)) * 100%)` }}
          className="absolute top-5 left-10 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full -translate-y-1/2 z-0"
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />

        {/* Steps Container */}
        <div className="flex items-center justify-between relative z-10">
          {steps.map((item) => {
            const isActive = currentStep === item.step;
            const isCompleted = currentStep > item.step;
            
            return (
              <div key={item.step} className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={() => (isDirectEdit || isCompleted) && setCurrentStep(item.step)}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-500 relative group ${
                    isActive 
                      ? 'bg-slate-900 text-white shadow-2xl scale-110 -translate-y-1' 
                      : isCompleted
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'bg-white text-slate-300 border-2 border-slate-100 hover:border-indigo-200'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <item.icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
                  )}
                  
                  {/* Tooltip for label on mobile or hover */}
                  <span className={`absolute -top-12 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl ${
                    isActive ? 'opacity-100 translate-y-0' : 'translate-y-2'
                  }`}>
                    Bước {item.step}: {item.label}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
                  </span>
                </button>
                
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] transition-colors duration-500 hidden sm:block ${
                  isActive ? 'text-slate-900' : isCompleted ? 'text-indigo-600' : 'text-slate-300'
                }`}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
