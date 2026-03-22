import { HeroSection } from "@/components/HeroSection";
import { PartnersSection } from "@/components/PartnersSection";
import { CareerTools } from "@/components/CareerTools";
import { FeaturedJobs } from "@/components/FeaturedJobs";
import { CTABanner } from "@/components/CTABanner";

export default function Home() {
  return (
    <div className="flex flex-col items-center w-full">
      <HeroSection />
      <PartnersSection />
      <CareerTools />
      <FeaturedJobs />
      <CTABanner />
    </div>
  );
}
