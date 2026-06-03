'use client';

import { useState } from "react";
import { Company } from "@/types/company";
import { ProfileHeader } from "./ProfileHeader";
import { JobListSection } from "./JobListSection";
import { AboutSection } from "./AboutSection";
import { SidebarInfo } from "./SidebarInfo";
import { motion, AnimatePresence } from "framer-motion";
import ReviewSection from "./ReviewSection";

interface CompanyProfileViewProps {
  company: Company;
  isPreview?: boolean;
}

type TabType = 'about' | 'jobs' | 'reviews';

export default function CompanyProfileView({ company, isPreview = false }: CompanyProfileViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('about');

  const tabs = [
    { id: 'about', label: 'Giới thiệu' },
    { id: 'jobs', label: `Tin tuyển dụng (${company.jobPostingsCount || company.jobPostings?.length || 0})` },
    { id: 'reviews', label: 'Đánh giá' },
  ];

  return (
    <div className={`min-h-screen ${isPreview ? '' : 'bg-[#f1f5f9] pb-20'} font-sans text-slate-900`}>
      <ProfileHeader company={company} isPreview={isPreview} />

      {/* Tab Navigation Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-3 text-[11px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-mariner' : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-mariner rounded-t-full"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Content based on Tab */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {activeTab === 'about' && <AboutSection company={company} />}
              {activeTab === 'jobs' && <JobListSection company={company} isPreview={isPreview} />}
              {activeTab === 'reviews' && (
                <ReviewSection companyId={company.companyId} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Column: Sidebar (Always visible) */}
        <div className="space-y-6">
          <SidebarInfo 
            company={company} 
            isPreview={isPreview} 
            onReviewClick={() => setActiveTab('reviews')}
          />
        </div>
      </section>

      {!isPreview && (
        <style jsx global>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fadeIn 0.6s ease-out forwards;
          }
        `}</style>
      )}
    </div>
  );
}
