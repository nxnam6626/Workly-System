'use client';

import Image from "next/image";
import { Star, MapPin, Building2, CheckCircle2, Info, Share2, ShieldCheck, Users } from "lucide-react";
import { Company } from "@/types/company";

interface ProfileHeaderProps {
  company: Partial<Company>;
  isPreview?: boolean;
}

export function ProfileHeader({ company, isPreview }: ProfileHeaderProps) {
  const displayAddress = company.address?.split(',').slice(-1)[0].trim() || "Toàn quốc";
  const displayIndustry = company.mainIndustry || "Đang cập nhật";

  return (
    <section className="relative">
      {/* Banner */}
      <div className={`${isPreview ? 'h-[280px]' : 'h-[220px] md:h-[350px]'} w-full relative overflow-hidden bg-slate-200 ${isPreview ? 'rounded-t-3xl' : ''}`}>
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
        <div className={`bg-white rounded-3xl shadow-2xl -mt-16 md:-mt-24 p-6 md:p-10 flex flex-col md:flex-row gap-8 items-start md:items-end ${isPreview ? 'border border-slate-100' : ''}`}>
          {/* Logo */}
          <div className="w-36 h-36 md:w-48 md:h-48 bg-white rounded-[2rem] shadow-2xl border-8 border-white overflow-hidden flex-shrink-0 relative z-10 -mt-12 md:-mt-20">
            <Image
              src={company.logo || "/logos/logo.png"}
              alt={company.companyName || "Logo"}
              fill
              className="object-contain p-6"
            />
          </div>

          {/* Title & Info */}
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
                {company.companyName || "Tên công ty"}
                <ShieldCheck className="w-8 h-8 text-mariner fill-mariner/10" />
              </h1>
              <div className="flex items-center gap-1.5 bg-red-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest border-2 border-red-100 shadow-lg shadow-red-200 uppercase">
                <Star className="w-3.5 h-3.5 fill-white" />
                Đối tác uy tín
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-y-3 gap-x-8">
               <div className="flex items-center gap-2.5 text-slate-500 font-bold text-sm">
                  <MapPin className="w-5 h-5 text-mariner" />
                  <span>{displayAddress}</span>
               </div>
               <div className="flex items-center gap-2.5 text-slate-500 font-bold text-sm">
                  <Building2 className="w-5 h-5 text-mariner" />
                  <span>{displayIndustry}</span>
               </div>
               <div className="flex items-center gap-2.5 text-slate-500 font-bold text-sm">
                  <Users className="w-5 h-5 text-mariner" />
                  <span>1.2k Người theo dõi</span>
               </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              disabled={isPreview}
              className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-mariner hover:bg-blue-700 text-white font-black px-10 py-4 rounded-2xl transition-all shadow-xl shadow-mariner/20 active:scale-95 text-sm uppercase tracking-widest disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" />
              Theo dõi
            </button>
            <button className="p-4 rounded-2xl border-2 border-slate-100 text-slate-400 hover:text-mariner hover:border-mariner transition-all bg-slate-50 shadow-sm">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="p-4 rounded-2xl border-2 border-slate-100 text-slate-400 hover:text-mariner hover:border-mariner transition-all bg-slate-50 shadow-sm">
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
