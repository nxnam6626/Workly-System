'use client';

import { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { Loader2, ArrowLeft, ArrowRight, Save } from 'lucide-react';

import { usePostJob } from '@/hooks/usePostJob';
import { PostJobHeader } from '@/components/recruiter/post-job/PostJobHeader';
import { StepIndicator } from '@/components/recruiter/post-job/StepIndicator';
import dynamic from 'next/dynamic';

const AiAdvisorModal = dynamic(
  () => import('@/components/recruiter/post-job/AiAdvisorModal').then((mod) => mod.AiAdvisorModal),
  { ssr: false }
);

import { Step1_BasicInfo } from '@/components/recruiter/post-job/Step1_BasicInfo';
import { Step2_JobDetails } from '@/components/recruiter/post-job/Step2_JobDetails';
import { Step3_Content } from '@/components/recruiter/post-job/Step3_Content';
import { Step4_JobTier } from '@/components/recruiter/post-job/Step4_JobTier';
import { Step5_Preview } from '@/components/recruiter/post-job/Step5_Preview';
import { ProcessingModal } from '@/components/recruiter/post-job/ProcessingModal';

export function PostJobForm({ jobId: propJobId, isDirectEdit = false }: { jobId?: string; isDirectEdit?: boolean }) {
  const searchParams = useSearchParams();
  const editJobId = propJobId || searchParams.get('jobId');

  const {
    formData, setFormData, saving, loadingData, currentStep, setCurrentStep, totalSteps,
    hardSkillInput, setHardSkillInput, softSkillInput, setSoftSkillInput, languageInput, setLanguageInput,
    aiModalOpen, setAiModalOpen, aiPrompt, setAiPrompt, aiGenerating,
    confirmPayModalOpen, setConfirmPayModalOpen, executeSubmit,
    suggestedCategories, isSuggesting, allIndustries, branches, companyProfile, modResult, isChecking,
    toggleCategory, handleBranchToggle, handleChange, addSkill, removeSkill,
    handleSubmit, handleAiGenerate, handlePreCheck, handleNextStep, handlePrevStep,
    userPlan, processingState, setProcessingState
  } = usePostJob(editJobId);

  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-[60vh] text-slate-500 flex-col gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        Đang tải thông tin...
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto space-y-6 pb-12"
    >
      <PostJobHeader
        editJobId={editJobId}
        userPlan={userPlan}
        setAiModalOpen={setAiModalOpen}
      />

      <StepIndicator
        currentStep={currentStep}
        totalSteps={totalSteps}
        setCurrentStep={setCurrentStep}
        isDirectEdit={isDirectEdit}
      />

      <div className="relative">
        <form onSubmit={handleSubmit} className="w-full bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 p-6 md:p-10 space-y-10 min-h-[600px] flex flex-col relative overflow-hidden">
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <Step1_BasicInfo
                  key="step1"
                  formData={formData}
                  handleChange={handleChange}
                  suggestedCategories={suggestedCategories}
                  isSuggesting={isSuggesting}
                  toggleCategory={toggleCategory}
                  allIndustries={allIndustries}
                  branches={branches}
                  handleBranchToggle={handleBranchToggle}
                />
              )}
              {currentStep === 2 && (
                  <Step2_JobDetails
                    key="step2"
                    formData={formData}
                    handleChange={handleChange}
                    hardSkillInput={hardSkillInput}
                    setHardSkillInput={setHardSkillInput}
                    softSkillInput={softSkillInput}
                    setSoftSkillInput={setSoftSkillInput}
                    languageInput={languageInput}
                    setLanguageInput={setLanguageInput}
                    addSkill={addSkill}
                    removeSkill={removeSkill}
                  />
              )}
              {currentStep === 3 && (
                <Step3_Content
                  key="step3"
                  formData={formData}
                  setFormData={setFormData}
                  handlePreCheck={handlePreCheck}
                  isChecking={isChecking}
                  modResult={modResult}
                />
              )}
              {currentStep === 4 && (
                <Step4_JobTier
                  key="step4"
                  formData={formData}
                  setFormData={setFormData}
                  handleChange={handleChange}
                  userPlan={userPlan}
                />
              )}
              {currentStep === 5 && (
                <Step5_Preview
                  key="step5"
                  formData={formData}
                  companyProfile={companyProfile}
                  branches={branches}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          <div className="pt-10 border-t border-slate-50 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevStep}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all ${
                currentStep === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ArrowLeft className="w-5 h-5" /> Quay lại
            </button>

            <div className="flex items-center gap-4">
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="group flex items-center gap-4 px-10 py-4.5 bg-slate-900 text-white rounded-[1.75rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 hover:scale-[1.03] active:scale-[0.97] transition-all"
                >
                  Tiếp theo <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex items-center gap-4 px-12 py-4.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-[1.75rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 hover:scale-[1.03] active:scale-[0.97] transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {editJobId ? 'Cập nhật tin' : 'Đăng tin ngay'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {aiModalOpen && (
        <AiAdvisorModal
          setAiModalOpen={setAiModalOpen}
          aiPrompt={aiPrompt}
          setAiPrompt={setAiPrompt}
          aiGenerating={aiGenerating}
          handleAiGenerate={handleAiGenerate}
          userPlan={userPlan}
        />
      )}

      <AnimatePresence>
        {confirmPayModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-orange-500" />
              <h3 className="text-xl font-bold text-slate-800 mb-3">Tài khoản hết lượt đăng tin miễn phí</h3>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Gói đăng ký của bạn đã hết lượt đăng tin <strong>BASIC</strong> miễn phí. Bạn sẽ bị trừ <strong className="text-orange-500">100 Credits</strong> trong ví để tiếp tục đăng tin này.
                <br /><br />
                Bạn có đồng ý thanh toán không?
              </p>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setConfirmPayModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmPayModalOpen(false);
                    executeSubmit();
                  }}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all hover:-translate-y-0.5"
                >
                  Đồng ý (100 Credits)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function PostJobPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    }>
      <PostJobForm />
    </Suspense>
  );
}
