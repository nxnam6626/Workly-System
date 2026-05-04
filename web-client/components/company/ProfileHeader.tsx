'use client';

import Image from "next/image";
import { Star, MapPin, Building2, CheckCircle2, Info, Share2 } from "lucide-react";
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
      <div className={`${isPreview ? 'h-[250px]' : 'h-[200px] md:h-[300px]'} w-full relative overflow-hidden bg-slate-200 ${isPreview ? 'rounded-t-3xl' : ''}`}>
        <Image
          src={company.banner || "/assets/default-banner.jpg"}
          alt={company.companyName || "Banner"}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* Info Bar */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 relative">
        <div className={`bg-white rounded-2xl shadow-xl -mt-16 md:-mt-20 p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-end ${isPreview ? 'border border-slate-100' : ''}`}>
          {/* Logo */}
          <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-2xl shadow-lg border-4 border-white overflow-hidden flex-shrink-0 relative">
            <Image
              src={company.logo || "/logos/logo.png"}
              alt={company.companyName || "Logo"}
              fill
              className="object-contain p-4"
            />
          </div>

          {/* Title & Info */}
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">
                {company.companyName || "Tên công ty"}
              </h1>
              <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[12px] font-black border border-amber-200">
                <Star className="w-3 h-3 fill-amber-700" />
                NTD CAO CẤP
              </div>
            </div>

            <div className="text-slate-400 font-bold text-sm md:text-base">
              {company.internationalName || company.shortName || "TÊN GIAO DỊCH CHƯA CẬP NHẬT"}
            </div>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 pt-2">
              <div className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                <MapPin className="w-4 h-4 text-mariner" />
                <span>Địa điểm: <span className="text-mariner hover:underline cursor-pointer">{displayAddress}</span></span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                <Building2 className="w-4 h-4 text-mariner" />
                <span>Lĩnh vực: <span className="text-mariner hover:underline cursor-pointer">{displayIndustry}</span></span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button 
              disabled={isPreview}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-mariner hover:bg-blue-700 text-white font-black px-6 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              Theo dõi
            </button>
            <button className="p-2.5 rounded-lg border border-slate-200 text-slate-400 hover:text-mariner hover:border-mariner transition-all">
              <Info className="w-5 h-5" />
            </button>
            <button className="p-2.5 rounded-lg border border-slate-200 text-slate-400 hover:text-mariner hover:border-mariner transition-all">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
