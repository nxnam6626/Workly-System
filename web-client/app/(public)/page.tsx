import { HeroSearch } from "@/components/HeroSearch";
import { BannerSlider } from "@/components/BannerSlider";
import { RecommendedJobsSection } from "@/components/RecommendedJobsSection";
import { UrgentJobsSection } from "@/components/UrgentJobsSection";
import { InternshipJobsSection as InternshipJobs } from "@/components/InternshipJobs";
import { JobCategories } from "@/components/JobCategories";
import { FeaturedJobs } from "@/components/FeaturedJobs";
import { TopEmployers } from "@/components/TopEmployers";
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
            <UrgentJobsSection />
            <RecommendedJobsSection />
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
