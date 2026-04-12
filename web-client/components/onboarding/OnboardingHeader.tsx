'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { Step } from '@/hooks/use-cv-import';

const ANIM = {
  fadeUp: { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 20 } },
  scale: { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.05 } },
};

interface OnboardingHeaderProps {
  step: Step;
  onBack: () => void;
}

export function OnboardingHeader({ step, onBack }: OnboardingHeaderProps) {
  // Review step has its own integrated header in CvReviewForm
  if (step === 'review') return null;

  const headerContent = {
    upload: {
      title: "Chào mừng bạn đến với Workly!",
      desc: "Hãy bắt đầu bằng cách tải lên CV của bạn. AI của chúng tôi sẽ giúp bạn hoàn thiện hồ sơ trong nháy mắt."
    },
    success: {
      title: "Tuyệt vời!",
      desc: "Hồ sơ của bạn đã sẵn sàng. Đang chuyển hướng bạn đến Dashboard..."
    }
  };

  const content = headerContent[step as keyof typeof headerContent];
  if (!content) return null;

  return (
    <header className="text-center mb-6 space-y-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={`header-${step}`}
          {...(step === 'success' ? ANIM.scale : ANIM.fadeUp)}
          className="flex flex-col items-center space-y-4"
        >
          {step === 'success' && (
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 size={48} />
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{content.title}</h1>
          <p className="text-gray-500 text-sm sm:text-base max-w-2xl mx-auto px-4">{content.desc}</p>
        </motion.div>
      </AnimatePresence>
    </header>
  );
}
