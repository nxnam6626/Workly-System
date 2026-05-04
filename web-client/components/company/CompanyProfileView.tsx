'use client';

import { Company } from "@/types/company";
import { ProfileHeader } from "./ProfileHeader";
import { JobListSection } from "./JobListSection";
import { AboutSection } from "./AboutSection";
import { SidebarInfo } from "./SidebarInfo";

interface CompanyProfileViewProps {
  company: Company;
  isPreview?: boolean;
}

export default function CompanyProfileView({ company, isPreview = false }: CompanyProfileViewProps) {
  return (
    <div className={`min-h-screen ${isPreview ? '' : 'bg-[#f1f5f9] pb-20'} font-sans text-slate-900`}>
      <ProfileHeader company={company} isPreview={isPreview} />

      {/* Main Content Area */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Jobs & About */}
        <div className="lg:col-span-2 space-y-8">
          <JobListSection company={company} isPreview={isPreview} />
          <AboutSection company={company} />
        </div>

        {/* Right Column: Sidebar */}
        <SidebarInfo company={company} isPreview={isPreview} />
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
