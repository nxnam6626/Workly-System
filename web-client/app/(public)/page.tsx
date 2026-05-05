import { HeroSearch } from "@/components/landing/HeroSearch";
import { BannerSlider } from "@/components/landing/BannerSlider";
import { RecommendedJobsSection } from "@/components/jobs/RecommendedJobsSection";
import { UrgentJobsSection } from "@/components/jobs/UrgentJobsSection";
import { InternshipJobsSection as InternshipJobs } from "@/components/jobs/InternshipJobs";
import { JobCategories } from "@/components/jobs/JobCategories";
import { FeaturedJobs } from "@/components/jobs/FeaturedJobs";
import { TopEmployers } from "@/components/shared/TopEmployers";
import IndustryMegaMenu from "@/components/shared/IndustryMegaMenu";

export default function Home() {
   return (
      <div className="flex flex-col items-center w-full min-h-screen bg-[#F4F7FA]">
         <section className="w-full bg-workly-blue pt-10 pb-16">
            <div className="max-w-6xl mx-auto px-4 lg:px-6 flex flex-col gap-5">
               <HeroSearch hideFilters={true} />
               
               <div className="grid grid-cols-1 md:grid-cols-12 gap-5 relative">
                  {/* Left: Industry Menu */}
                  <div className="md:col-span-3">
                     <IndustryMegaMenu height="360px" variant="homepage" />
                  </div>

                  {/* Right: Hero Banner */}
                  <main className="md:col-span-9 h-[360px] rounded-2xl overflow-hidden shadow-sm">
                     <BannerSlider />
                  </main>
               </div>
            </div>
         </section>

         {/* 2. Main Page Content (White/Gray Sections) */}
         <div className="w-full flex flex-col items-center">
            <RecommendedJobsSection />
            <UrgentJobsSection />
            <FeaturedJobs />
            <JobCategories />
            <InternshipJobs />
            <div className="w-full space-y-24 mt-12 mb-24">
               <TopEmployers />
            </div>
         </div>
      </div>
   );
}
