'use client';

import { AnimatePresence, motion } from 'framer-motion';

import { useCvImport } from '@/hooks/use-cv-import';
import { CvDropzone } from '@/components/onboarding/CvDropzone';
import { CvReviewForm } from '@/components/onboarding/CvReviewForm';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { OnboardingBackground } from '@/components/onboarding/OnboardingBackground';
import { StepProgress } from '@/components/onboarding/StepProgress';

export default function ImportCvPage() {
  const {
    step,
    isLoading,
    isSaving,
    parsedData,
    handleUpload,
    handleSaveProfile,
    handleManualEntry,
    goToUpload,
  } = useCvImport();

  return (
    <div className="min-h-screen relative bg-[#F7F8FC] font-sans overflow-x-hidden">
      <OnboardingBackground />

      <div className="relative z-10 min-h-screen flex flex-col items-center px-4 pt-8 pb-20">
        {/* Header — hides itself when step === 'review' */}
        <OnboardingHeader step={step} onBack={goToUpload} />

        {/* Step progress indicator */}
        <StepProgress currentStep={step} />

        {/* Main content area */}
        <div className="w-full max-w-3xl">
          <AnimatePresence mode="wait">
            {/* STEP 1: Upload */}
            {step === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <CvDropzone onUpload={handleUpload} onManualEntry={handleManualEntry} isLoading={isLoading} />
              </motion.div>
            )}

            {/* STEP 2: Review extracted data */}
            {step === 'review' && parsedData && (
              <motion.div
                key="review"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <CvReviewForm
                  initialData={parsedData}
                  onSubmit={handleSaveProfile}
                  isSaving={isSaving}
                />
              </motion.div>
            )}

            {/* STEP 3: Success — handled by OnboardingHeader */}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-40"
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
