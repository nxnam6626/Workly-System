import { HeroSearch } from "@/components/HeroSearch";
import { CategorySidebar } from "@/components/CategorySidebar";
import { BannerSlider } from "@/components/BannerSlider";
import { RightHeroWidgets } from "@/components/RightHeroWidgets";
import { MatchingSection } from "@/components/MatchingSection";
import { UrgentJobsSection } from "@/components/UrgentJobsSection";
import { StatsSection } from "@/components/StatsSection";
import { TopEmployers } from "@/components/TopEmployers";
import { CareerTools } from "@/components/CareerTools";
import { CTABanner } from "@/components/CTABanner";

export default function Home() {
   return (
      <div className="flex flex-col items-center w-full bg-[#f4f7fa] pb-20">
         {/* 1. Hero Search Bar */}
         <HeroSearch />

         {/* 2. Main Hero Grid (Categories, Banner, Widgets) */}
         <div className="w-full max-w-7xl mx-auto px-4 lg:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Sidebar */}
            <aside className="lg:col-span-3 hidden lg:block h-[450px]">
               <CategorySidebar />
            </aside>

            {/* Center Banner */}
            <main className="lg:col-span-6 h-[250px] lg:h-[450px]">
               <BannerSlider />
            </main>

            {/* Right Side Hub */}
            <aside className="lg:col-span-3 hidden lg:block h-[450px]">
               <RightHeroWidgets />
            </aside>
         </div>
 
         {/* 3. Matching Jobs Section */}
         <MatchingSection />
 
         {/* 4. Urgent Jobs Section */}
         <UrgentJobsSection />

         {/* 4. Additional Sections */}
         <div className="w-full space-y-20 mt-10">
            <StatsSection />
            <TopEmployers />
            <CareerTools />
            <CTABanner />
         </div>
      </div>
   );
}
