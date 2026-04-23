"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

const industries = [
  "Kinh Doanh/Bán Hàng",
  "Chăm Sóc Khách Hàng",
  "Hành Chính/Văn Phòng",
  "Kế Toán/Kiểm Toán",
  "Xây Dựng/Kiến Trúc/Nội Thất",
  "Marketing/PR/Quảng Cáo",
  "Sản Xuất/Lắp Ráp/Chế Biến",
  "Chuỗi Cung Ứng/Kho Vận/Xuất Nhập...",
  "Cơ Khí/Ô Tô/Tự Động Hoá",
  "Điện/Điện Tử/Năng Lượng",
  "Thiết Kế",
  "Tài Chính/Ngân Hàng/Chứng Khoán"
];

const locations = [
  "Việc Làm Hồ Chí Minh",
  "Việc Làm Hà Nội",
  "Việc Làm Bình Dương",
  "Việc Làm Đồng Nai",
  "Việc Làm Đà Nẵng",
  "Việc Làm Hải Phòng",
  "Việc Làm Bắc Ninh",
  "Việc Làm Hà Nam",
  "Việc Làm Cần Thơ",
  "Việc Làm Hải Dương",
  "Việc Làm Nghệ An",
  "Việc Làm Thừa Thiên Huế",
  "Việc Làm Quảng Ninh",
  "Việc Làm Lâm Đồng",
  "Việc Làm Long An",
  "Việc Làm Bà Rịa - Vũng Tàu",
  "Việc Làm Hưng Yên",
  "Việc Làm Bình Phước",
  "Việc Làm Tây Ninh",
  "Việc Làm Kiên Giang"
];

const jobTitles = [
  "Nhân Viên Tư Vấn",
  "Nhân Viên Kinh Doanh",
  "Sales",
  "Nhân Viên Telesale",
  "Nhân Viên Kế Toán",
  "Chuyên Viên Quản Lý",
  "Nhân Viên Chăm Sóc Khách Hàng",
  "Nhân Viên Kỹ Thuật",
  "Công Nhân Kỹ Thuật",
  "Trợ Lý",
  "Chuyên Viên Marketing",
  "Chuyên Viên Thiết Kế"
];

const jobTypes = [
  "Việc Làm Part-Time",
  "Việc Làm Thời Vụ"
];

export function CareerSidebar() {
  const renderSection = (title: string, items: string[], activeIndex: number = 0) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
      <h3 className="text-slate-800 font-black text-[15px] mb-4 uppercase tracking-tight">{title}</h3>
      <div className="space-y-0.5 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
        {items.map((item, i) => (
          <Link
            key={item}
            href="#"
            className={`flex items-center justify-between py-2.5 px-3 rounded-lg text-[13px] font-medium transition-all group ${i === activeIndex
                ? "bg-slate-50 text-[#1e60ad] border-r-4 border-r-[#1e60ad]"
                : "text-slate-600 hover:bg-slate-50 hover:text-[#1e60ad]"
              }`}
          >
            <span className="line-clamp-1">{item}</span>
            <ChevronRight className={`w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${i === activeIndex ? "opacity-100" : ""}`} />
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-6">
      {/* Sections */}
      {renderSection("Tìm theo ngành nghề", industries, 0)}
      {renderSection("Tìm theo địa điểm", locations, -1)}
      {renderSection("Tìm theo loại hình", jobTypes, -1)}
      {renderSection("Tìm theo chức danh", jobTitles, 0)}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e60ad;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #164a8a;
        }
      `}</style>
    </div>
  );
}
