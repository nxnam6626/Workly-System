'use client';

import { useState } from "react";
import { MapPin, Globe, Users, Facebook, Star, Edit3 } from "lucide-react";
import { Company } from "@/types/company";

interface SidebarInfoProps {
  company: Partial<Company>;
  isPreview?: boolean;
}

export function SidebarInfo({ company, isPreview }: SidebarInfoProps) {
  return (
    <div className="space-y-8">
      {/* Basic Info Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
        <h3 className="text-[17px] font-black text-slate-900 uppercase tracking-tight">Thông tin công ty</h3>

        <div className="space-y-4">
          <InfoItem icon={<MapPin className="w-5 h-5 text-mariner" />} label={company.address || "Địa chỉ chưa cập nhật"} />

          {company.websiteUrl && (
            <div className="flex gap-3">
              <Globe className="w-5 h-5 text-mariner shrink-0" />
              <a
                href={company.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold text-mariner hover:underline truncate"
              >
                {company.websiteUrl.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}

          <InfoItem icon={<Users className="w-5 h-5 text-mariner" />} label={company.companySize ? `${company.companySize} nhân viên` : "Quy mô chưa cập nhật"} />
          <InfoItem icon={<Facebook className="w-5 h-5 text-[#1877F2]" />} label="Facebook" isClickable />
        </div>

        {/* Map Placeholder */}
        <div className="rounded-xl overflow-hidden h-[200px] bg-slate-100 relative group border border-slate-100">
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
            <MapPin className="w-8 h-8 opacity-50 group-hover:scale-110 transition-transform" />
            <span className="text-[12px] font-bold">Xem trên bản đồ</span>
          </div>
          <div className="absolute bottom-3 left-3 right-3">
            <button className="w-full py-2 bg-white/90 backdrop-blur-sm rounded-lg text-[12px] font-black text-mariner shadow-sm hover:bg-white transition-all">
              Mở Google Maps
            </button>
          </div>
        </div>
      </div>

      {/* Rating Summary */}
      <RatingSummaryCard />

      {/* Detail Ratings */}
      <DetailRatingsCard />

      {/* Write Review Form */}
      {!isPreview && <ReviewForm />}
    </div>
  );
}

function InfoItem({ icon, label, isClickable }: { icon: React.ReactNode; label: string; isClickable?: boolean }) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0">{icon}</div>
      <div className={`text-sm font-medium ${isClickable ? 'text-[#1877F2] font-bold cursor-pointer hover:underline' : 'text-slate-600'} leading-snug`}>
        {label}
      </div>
    </div>
  );
}

function RatingSummaryCard() {
  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-sm border border-amber-100 p-8 text-center relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
      <h3 className="text-[17px] font-black text-slate-900 uppercase tracking-tight mb-4 relative z-10">Được đánh giá</h3>
      <div className="text-6xl font-black text-slate-800 mb-2 relative z-10">4.0</div>
      <div className="flex items-center justify-center gap-1 mb-4 relative z-10">
        {[1, 2, 3, 4].map(i => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
        <Star key={5} className="w-5 h-5 text-amber-300" />
      </div>
      <div className="w-20 h-20 bg-amber-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl border-4 border-white transform group-hover:rotate-12 transition-transform">
        <Star className="w-10 h-10 fill-white text-white" />
      </div>
    </div>
  );
}

function DetailRatingsCard() {
  const ratings = [
    { label: "Lương thưởng & phúc lợi", val: 85 },
    { label: "Đào tạo & học học", val: 70 },
    { label: "Sự quan tâm đến nhân viên", val: 75 },
    { label: "Văn hoá công ty", val: 80 },
    { label: "Văn phòng làm việc", val: 90 },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
      <div className="space-y-5">
        {ratings.map((item, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[13px] font-bold text-slate-600">{item.label}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-mariner rounded-full transition-all duration-1000"
                style={{ width: `${item.val}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewForm() {
  const [isExpanded, setIsExpanded] = useState(false);
  const categories = [
    "Lương thưởng & phúc lợi",
    "Đào tạo & học học",
    "Sự quan tâm đến nhân viên",
    "Văn hoá công ty",
    "Văn phòng làm việc"
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 transition-all duration-500">
      <h3 className="text-lg font-black text-slate-900 uppercase mb-6">Viết đánh giá về công ty</h3>
      
      {!isExpanded ? (
        <div className="space-y-6">
          <button 
            onClick={() => setIsExpanded(true)}
            className="w-full py-4 bg-amber-400 hover:bg-amber-500 text-slate-900 font-black rounded-xl shadow-lg shadow-amber-200 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Edit3 className="w-5 h-5" />
            Thêm đánh giá của bạn
          </button>
          
          <div className="pt-6 border-t border-slate-50">
             <ReviewGuidelines />
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
          {categories.map((label, i) => (
            <div key={i} className="space-y-2">
              <p className="text-sm font-bold text-slate-700">{label} <span className="text-red-500">*</span></p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className="w-6 h-6 text-slate-200 hover:text-amber-400 cursor-pointer transition-colors" />
                ))}
              </div>
            </div>
          ))}
          <div className="space-y-4 pt-4">
            <input
              type="text"
              placeholder="Tiêu đề *"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-mariner transition-colors font-medium text-sm"
            />
            <textarea
              placeholder="Nội dung *"
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-mariner transition-colors font-medium text-sm resize-none"
            />
            <div className="flex gap-3">
               <button className="flex-1 py-3 bg-mariner text-white font-black rounded-xl hover:shadow-lg transition-all active:scale-95 uppercase tracking-wide">
                 Gửi đánh giá
               </button>
               <button 
                onClick={() => setIsExpanded(false)}
                className="px-6 py-3 border border-slate-200 text-slate-400 font-bold rounded-xl hover:bg-slate-50 transition-all"
               >
                 Hủy
               </button>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-50">
             <ReviewGuidelines />
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewGuidelines() {
  return (
    <ul className="text-[12px] font-medium text-slate-400 space-y-2">
      <li className="flex items-start gap-2">
        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
        Đánh giá của bạn sẽ được ẩn danh
      </li>
      <li className="flex items-start gap-2">
        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
        Giúp cho các ứng viên tìm việc hiểu rõ hơn về công ty
      </li>
    </ul>
  );
}
