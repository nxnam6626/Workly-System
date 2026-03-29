'use client';

import {
  Code2,
  Database,
  Megaphone,
  PenTool,
  Calculator,
  UserCog,
  Truck,
  BarChart3,
  Palette,
  Settings,
  Hotel,
  GraduationCap,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { INDUSTRY_TAG_MAP } from "@/lib/constants";

export function CategorySidebar() {
  const categories = [
    { name: "Công nghệ thông tin", icon: <Code2 className="w-4 h-4" /> },
    { name: "Truyền thông & Marketing", icon: <Megaphone className="w-4 h-4" /> },
    { name: "Tài chính & Kế toán", icon: <Calculator className="w-4 h-4" /> },
    { name: "Hành chính & Nhân sự", icon: <UserCog className="w-4 h-4" /> },
    { name: "Vận tải & Chuỗi cung ứng", icon: <Truck className="w-4 h-4" /> },
    { name: "Kinh doanh & Bán hàng", icon: <BarChart3 className="w-4 h-4" /> },
    { name: "Thiết kế & Sáng tạo", icon: <Palette className="w-4 h-4" /> },
    { name: "Kỹ thuật & Sản xuất", icon: <Settings className="w-4 h-4" /> },
    { name: "Nhà hàng & Khách sạn", icon: <Hotel className="w-4 h-4" /> },
    { name: "Giáo dục & Đào tạo", icon: <GraduationCap className="w-4 h-4" /> },
  ];

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="flex-grow">
        {categories.slice(0, 5).map((cat, idx) => (
          <Link
            key={idx}
            href={`/jobs?category=${cat.name}`}
            className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all border-b border-slate-50 last:border-0 group"
          >
            <div className="text-slate-400 group-hover:text-blue-500 transition-colors">
              {cat.icon}
            </div>
            <span className="flex-1 truncate">{cat.name}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all" />
          </Link>
        ))}
      </div>

      <Link
        href="/jobs"
        className="flex items-center justify-center gap-2 py-4 text-sm font-bold text-blue-600 bg-slate-50/50 hover:bg-blue-50 transition-colors"
      >
        Tất cả các ngành
      </Link>
    </div>
  );
}
