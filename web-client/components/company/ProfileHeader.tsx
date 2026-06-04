'use client';

import Image from "next/image";
import { Star, MapPin, Building2, CheckCircle2, Info, Share2, ShieldCheck, Users } from "lucide-react";
import { Company } from "@/types/company";

interface ProfileHeaderProps {
  company: Partial<Company>;
  isPreview?: boolean;
}

export function ProfileHeader({ company, isPreview }: ProfileHeaderProps) {
  let displayAddress = "Toàn quốc";
  if (company.address) {
    const parts = company.address.split(',').map(p => p.trim());
    if (parts.length > 0) {
      const lastPart = parts[parts.length - 1].toLowerCase();
      if (lastPart === 'việt nam' || lastPart === 'vietnam') {
        displayAddress = parts.length > 1 ? parts[parts.length - 2] : parts[parts.length - 1];
      } else {
        displayAddress = parts[parts.length - 1];
      }
    }
  }
  const displayIndustry = company.mainIndustry || "Đang cập nhật";

  return (
    <section className="relative">
      {/* Banner */}
      <div className={`${isPreview ? 'h-[240px]' : 'h-[160px] md:h-[260px]'} w-full relative overflow-hidden bg-slate-200 ${isPreview ? 'rounded-t-3xl' : ''}`}>
        <Image
          src={company.banner || "/assets/default-banner.jpg"}
          alt={company.companyName || "Banner"}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
      </div>

      {/* Info Bar */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 relative">
        <div className={`bg-white rounded-3xl shadow-2xl -mt-12 md:-mt-16 p-5 md:p-7 flex flex-col md:flex-row gap-6 items-start md:items-end ${isPreview ? 'border border-slate-100' : ''}`}>
          {/* Logo */}
          <div className="w-28 h-28 md:w-36 md:h-36 bg-white rounded-[1.5rem] shadow-xl border-4 border-white overflow-hidden flex-shrink-0 relative z-10 -mt-10 md:-mt-14">
            <Image
              src={company.logo || "/logos/logo.png"}
              alt={company.companyName || "Logo"}
              fill
              className="object-contain p-4"
            />
          </div>

          {/* Title & Info */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
                {company.companyName || "Tên công ty"}
                <ShieldCheck className="w-6 h-6 text-mariner fill-mariner/10" />
              </h1>
              <div className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded-full text-[9px] font-black tracking-widest border border-red-100 shadow-md shadow-red-200 uppercase">
                <Star className="w-3 h-3 fill-white" />
                Đối tác uy tín
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-6">
               <div className="flex items-center gap-2 text-slate-500 font-bold text-xs">
                  <MapPin className="w-4 h-4 text-mariner" />
                  <span>{displayAddress}</span>
               </div>
               <div className="flex items-center gap-2 text-slate-500 font-bold text-xs">
                  <Building2 className="w-4 h-4 text-mariner" />
                  <span>{displayIndustry}</span>
               </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button className="p-3 rounded-xl border-2 border-slate-100 text-slate-400 hover:text-mariner hover:border-mariner transition-all bg-slate-50 shadow-sm">
              <Share2 className="w-4 h-4" />
            </button>
            <button className="p-3 rounded-xl border-2 border-slate-100 text-slate-400 hover:text-mariner hover:border-mariner transition-all bg-slate-50 shadow-sm">
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
