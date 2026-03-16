"use client";

import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { PartnersSection } from "@/components/PartnersSection";
import { CareerTools } from "@/components/CareerTools";
import { FeaturedJobs } from "@/components/FeaturedJobs";
import { CTABanner } from "@/components/CTABanner";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar />
      
      <main className="flex flex-col items-center">
        <HeroSection />
        <PartnersSection />
        <CareerTools />
        <FeaturedJobs />
        <CTABanner />
      </main>

      <Footer />
    </div>
  );
}
