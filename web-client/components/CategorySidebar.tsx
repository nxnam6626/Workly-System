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
  Menu
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
    <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="bg-slate-50/50 px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
        <Menu className="w-4 h-4 text-slate-800" />
        <span className="font-extrabold text-[14px] text-slate-800 uppercase tracking-wider">Ngành nghề</span>
      </div>

      <div className="flex-grow">
        {categories.map((cat, idx) => (
          <Link
            key={idx}
            href={`/jobs?category=${cat.name}`}
            className="flex items-center gap-3 px-5 py-3.5 text-[14.5px] font-medium text-slate-600 hover:text-[#0047a5] hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0 group"
          >
            <span className="flex-1 truncate group-hover:font-semibold">{cat.name}</span>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#0047a5]" />
          </Link>
        ))}
      </div>

      <Link
        href="/jobs"
        className="flex items-center justify-center gap-2 py-4 text-xs font-bold text-slate-400 hover:text-mariner transition-colors italic"
      >
        Xem tất cả ngành nghề
      </Link>
    </div>
  );
}
