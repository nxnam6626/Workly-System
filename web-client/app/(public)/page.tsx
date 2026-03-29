import { HeroSearch } from "@/components/HeroSearch";
import { CategorySidebar } from "@/components/CategorySidebar";
import { BannerSlider } from "@/components/BannerSlider";
import { UrgentJobsSection } from "@/components/UrgentJobsSection";
import { StatsSection } from "@/components/StatsSection";
import { TopEmployers } from "@/components/TopEmployers";
import { CareerTools } from "@/components/CareerTools";
import { CTABanner } from "@/components/CTABanner";

export default function Home() {
  return (
    <div className="flex flex-col items-center w-full bg-white pb-20">
      {/* 1. Hero & Search Section */}
      <HeroSearch />

      {/* 2. Main Content Grid (Categories & Banner) */}
      <div className="w-full max-w-7xl mx-auto px-40 py-8 grid grid-cols-1 lg:grid-cols-5 gap-6">
        <aside className="lg:col-span-2 hidden lg:block">
          <CategorySidebar />
        </aside>
        <main className="lg:col-span-3 h-[280px]">
          <BannerSlider />
        </main>
      </div>

      {/* 3. Urgent Jobs Section */}
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
