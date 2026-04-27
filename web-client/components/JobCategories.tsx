"use client";

import { useState, useEffect } from "react";
import {
  Briefcase, Users, Scale, Calculator,
  Cpu, Megaphone, Landmark, Settings,
  Truck, Utensils, Palette, HeartPulse,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

export function JobCategories() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/job-postings/stats/categories");
        setStats(res.data);
      } catch (error) {
        console.error("Failed to fetch job category stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const categoryMapping: Record<string, string> = {
    "Kinh Doanh": "Kinh Doanh / Bán Hàng",
    "Nhân Sự": "Nhân Sự / Hành Chính / Pháp Lý",
    "Luật": "Luật / Tư Vấn Pháp Lý",
    "Kế Toán": "Tài Chính / Kế Toán / Ngân Hàng",
    "Công Nghệ": "Công Nghệ Thông Tin",
    "Marketing": "Marketing / Truyền Thông",
    "Tài Chính": "Tài Chính / Kế Toán / Ngân Hàng",
    "Sản Xuất": "Kỹ Thuật / Cơ Khí / Sản Xuất",
    "Logistics": "Vận Tải / Logistics",
    "Nhà Hàng": "Nhà Hàng / Khách Sạn / Du lịch",
    "Thiết Kế": "Thiết Kế / Sáng Tạo",
    "Y Tế": "Y Tế / Dược Phẩm",
  };

  const categories = [
    { name: "Kinh Doanh", icon: <Briefcase className="w-8 h-8" />, bgColor: "bg-[#EBF5FF]", iconColor: "text-[#1890FF]" },
    { name: "Nhân Sự", icon: <Users className="w-8 h-8" />, bgColor: "bg-[#FFF1F0]", iconColor: "text-[#FF4D4F]" },
    { name: "Luật", icon: <Scale className="w-8 h-8" />, bgColor: "bg-[#F9F0FF]", iconColor: "text-[#722ED1]" },
    { name: "Kế Toán", icon: <Calculator className="w-8 h-8" />, bgColor: "bg-[#FFF7E6]", iconColor: "text-[#FA8C16]" },
    { name: "Công Nghệ", icon: <Cpu className="w-8 h-8" />, bgColor: "bg-[#E6FFFB]", iconColor: "text-[#13C2C2]" },
    { name: "Marketing", icon: <Megaphone className="w-8 h-8" />, bgColor: "bg-[#F6FFED]", iconColor: "text-[#52C41A]" },
    { name: "Tài Chính", icon: <Landmark className="w-8 h-8" />, bgColor: "bg-[#FFFBE6]", iconColor: "text-[#FADB14]" },
    { name: "Sản Xuất", icon: <Settings className="w-8 h-8" />, bgColor: "bg-[#F5F5F5]", iconColor: "text-[#8C8C8C]" },
    { name: "Logistics", icon: <Truck className="w-8 h-8" />, bgColor: "bg-[#E6FFFA]", iconColor: "text-[#13C2C2]" },
    { name: "Nhà Hàng", icon: <Utensils className="w-8 h-8" />, bgColor: "bg-[#FFF2F0]", iconColor: "text-[#FF4D4F]" },
    { name: "Thiết Kế", icon: <Palette className="w-8 h-8" />, bgColor: "bg-[#F0F5FF]", iconColor: "text-[#2F54EB]" },
    { name: "Y Tế", icon: <HeartPulse className="w-8 h-8" />, bgColor: "bg-[#FFF0F6]", iconColor: "text-[#EB2F96]" },
  ];

  const getCountDisplay = (catName: string) => {
    const backendName = categoryMapping[catName];
    const count = stats[backendName] || 0;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K+`;
    return `${count}+`;
  };

  return (
    <section className="w-full bg-white py-16">
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Ngành Nghề Nổi Bật
          </h2>
          <Link
            href="/jobs"
            className="text-slate-700 font-bold text-sm flex items-center gap-1 hover:text-mariner transition-colors group shrink-0"
          >
            Xem thêm <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-5">
          {loading ? (
            Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl p-6 flex flex-col items-center animate-pulse">
                <div className="w-8 h-8 bg-slate-200 rounded-lg mb-4" />
                <div className="h-4 bg-slate-200 rounded w-2/3 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            ))
          ) : categories.map((cat, index) => (
            <Link
              key={index}
              href={`/jobs?industry=${encodeURIComponent(categoryMapping[cat.name] || cat.name)}`}
              className={`group ${cat.bgColor} rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-transparent hover:border-white`}
            >
              <div className={`${cat.iconColor} mb-4 transition-transform duration-300 group-hover:scale-110`}>
                {cat.icon}
              </div>
              <h3 className="font-bold text-slate-800 text-[15px] mb-1">
                {cat.name}
              </h3>
              <p className="text-slate-400 text-[12px] font-medium leading-none">
                {getCountDisplay(cat.name)} Việc làm
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
