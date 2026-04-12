'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CvDropzone } from '@/components/onboarding/CvDropzone';
import { CvReviewForm } from '@/components/onboarding/CvReviewForm';
import { StepProgress } from '@/components/onboarding/StepProgress';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { OnboardingBackground } from '@/components/onboarding/OnboardingBackground';
import { useCvImport, Step } from '@/hooks/use-cv-import';

const ANIM = {
  scale: { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.05 } },
  slideX: { initial: { opacity: 0, x: 50 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -50 } }
};

export default function OnboardingImportCvPage() {
  const { step, isLoading, isSaving, parsedData, handleUpload, handleSaveProfile, goToUpload } = useCvImport();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8FAFC] via-slate-50 to-[#F1F5F9] py-12 px-4 relative flex flex-col items-center">
      <OnboardingBackground />

      {/* Unified container - wider for review step */}
      <div className={`w-full flex flex-col items-stretch z-10 transition-all duration-500 ${step === 'review' ? 'max-w-5xl' : 'max-w-3xl'}`}>
        
        <motion.div layout>
          <StepProgress currentStep={step} />
        </motion.div>

        {/* Dynamic Header */}
        <AnimatePresence mode="wait">
          <motion.div key={step === 'review' ? 'review-header' : 'normal-header'} layout>
            <OnboardingHeader step={step} onBack={goToUpload} />
          </motion.div>
        </AnimatePresence>

        {/* Content Area */}
        <main className="w-full">
          <AnimatePresence mode="wait" initial={false}>
            {step === 'upload' && (
              <motion.div key="content-upload" {...ANIM.scale}>
                <CvDropzone onUpload={handleUpload} isLoading={isLoading} />
              </motion.div>
            )}

            {step === 'review' && parsedData && (
              <motion.div key="content-review" {...ANIM.slideX}>
                <CvReviewForm initialData={parsedData} onSubmit={handleSaveProfile} isSaving={isSaving} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

      </div>
    </div>
  );
}