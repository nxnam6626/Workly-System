'use client';

import {
  Code2,
  Megaphone,
  Calculator,
  UserCog,
  Truck,
  BarChart3,
  Palette,
  Settings,
  Hotel,
  GraduationCap,
  ChevronRight,
  Menu,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export function CategorySidebar() {
  const categories = [
    { name: "Kinh Doanh/Bán Hàng", icon: <BarChart3 className="w-4 h-4" /> },
    { name: "Marketing/PR/Quảng Cáo", icon: <Megaphone className="w-4 h-4" /> },
    { name: "Công Nghệ Thông Tin", icon: <Code2 className="w-4 h-4" /> },
    { name: "Hành Chính/Văn Phòng", icon: <UserCog className="w-4 h-4" /> },
    { name: "Kế Toán/Kiểm Toán", icon: <Calculator className="w-4 h-4" /> },
    { name: "Nhân Sự", icon: <UserCog className="w-4 h-4" /> },
    { name: "Vận Tải/Logistics", icon: <Truck className="w-4 h-4" /> },
  ];

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/50 shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden flex flex-col h-full group/sidebar">
      {/* Header */}
      <div className="bg-slate-50/80 px-5 py-4.5 border-b border-slate-100 flex items-center gap-3">
        <div className="p-1.5 bg-mariner/10 rounded-lg text-mariner">
          <Menu className="w-4 h-4 stroke-[3px]" />
        </div>
        <span className="font-black text-[13px] text-slate-800 uppercase tracking-widest">Ngành nghề trọng tâm</span>
      </div>

      <div className="flex-grow py-2">
        {categories.map((cat, idx) => (
          <Link
            key={idx}
            href={`/jobs?category=${cat.name}`}
            className="flex items-center gap-3 px-5 py-3.5 text-[14px] font-bold text-slate-600 hover:text-mariner hover:bg-blue-50/50 transition-all border-b border-slate-50/50 last:border-0 group/item"
          >
            <div className="text-slate-400 group-hover/item:text-mariner transition-colors">
              {cat.icon}
            </div>
            <span className="flex-1 truncate">{cat.name}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover/item:translate-x-1 group-hover/item:text-mariner transition-all" />
          </Link>
        ))}
      </div>

      <Link
        href="/jobs"
        className="flex items-center justify-center gap-2 py-4 bg-slate-50/30 text-[11px] font-black text-slate-400 hover:text-mariner hover:bg-slate-50 transition-all uppercase tracking-tighter"
      >
        <span>XEM TẤT CẢ NGÀNH NGHỀ</span>
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
