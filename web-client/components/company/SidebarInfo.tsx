'use client';

import {
  MapPin,
  Globe,
  Users,
  Star,
  StarHalf,
  Briefcase,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { Company } from "@/types/company";
import React from "react";

interface SidebarInfoProps {
  company: Partial<Company>;
  isPreview?: boolean;
  onReviewClick?: () => void;
}

export function SidebarInfo({ company, isPreview, onReviewClick }: SidebarInfoProps) {
  return (
    <div className="space-y-4">
      {/* Contact & General Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-mariner p-3">
          <h3 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Thông tin liên hệ
          </h3>
        </div>

        <div className="p-5 space-y-5">
          <div className="space-y-3">
            <InfoItem
              icon={<MapPin className="w-4 h-4 text-mariner" />}
              label="Địa chỉ"
              value={company.address || "Chưa cập nhật"}
            />

            {company.websiteUrl && (
              <div className="flex gap-3 group cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-mariner group-hover:text-white transition-all">
                  <Globe className="w-4 h-4 text-mariner group-hover:text-white" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Website</p>
                  <a
                    href={company.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[12px] font-bold text-mariner hover:underline truncate block"
                  >
                    {company.websiteUrl.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Company Stats Widgets */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <Users className="w-4 h-4 text-mariner mb-1.5" />
              <p className="text-[9px] font-black text-slate-400 uppercase">Quy mô</p>
              <p className="text-xs font-black text-slate-800">{company.companySize ? `${company.companySize} nhân viên` : "Chưa cập nhật"}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <Briefcase className="w-4 h-4 text-mariner mb-1.5" />
              <p className="text-[9px] font-black text-slate-400 uppercase">Lĩnh vực</p>
              <p className="text-xs font-black text-slate-800 truncate">{company.mainIndustry || "Chưa cập nhật"}</p>
            </div>
          </div>

          {/* Live Interactive Map Widget */}
          {company.address && (
            <div className="rounded-xl overflow-hidden h-[160px] bg-slate-50 relative border border-slate-200 group">
              <iframe
                src={`https://maps.google.com/maps?q=${encodeURIComponent(company.address)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                className="w-full h-full border-0 grayscale-[0.1] group-hover:grayscale-0 transition-all duration-500"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="absolute bottom-2 left-2 right-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(company.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-1.5 bg-white/95 backdrop-blur-sm text-mariner rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md border border-white/50 hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 no-underline"
                >
                  Xem toàn màn hình <ChevronRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rating & Review Widgets */}
      <div className="space-y-4">
        <RatingSummaryCard 
          averageRating={(company as any).averageRating} 
          reviewCount={(company as any).reviewCount} 
          onClick={onReviewClick}
        />
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value, isPlaceholder }: { icon: React.ReactNode; label: string; value: string; isPlaceholder?: boolean }) {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="space-y-0.5">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{label}</p>
        <p className={`text-[12px] font-bold ${isPlaceholder ? 'text-slate-400 italic' : 'text-slate-700'} leading-snug`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function RatingSummaryCard({ 
  averageRating = 0, 
  reviewCount = 0,
  onClick 
}: { 
  averageRating?: number, 
  reviewCount?: number,
  onClick?: () => void 
}) {
  const formattedRating = averageRating.toFixed(1);
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm border border-slate-100 p-6 text-center relative overflow-hidden group ${onClick ? 'cursor-pointer hover:shadow-md transition-all' : ''}`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/5 rounded-full -mr-12 -mt-12 blur-2xl" />
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Đánh giá chung</h3>
      <div className="flex flex-col items-center">
        <div className="text-5xl font-black text-slate-800 leading-none">{formattedRating}</div>
        <div className="flex items-center gap-1 my-3">
          {[1, 2, 3, 4, 5].map(i => {
            const isFull = i <= Math.floor(averageRating);
            const isHalf = !isFull && i === Math.ceil(averageRating) && averageRating % 1 !== 0;
            
            if (isFull) {
              return <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />;
            } else if (isHalf) {
              return <StarHalf key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />;
            } else {
              return <Star key={i} className="w-4 h-4 text-amber-200" />;
            }
          })}
        </div>
        <p className="text-[10px] font-bold text-slate-400 italic">Dựa trên {reviewCount} đánh giá từ ứng viên</p>
      </div>
    </div>
  );
}
