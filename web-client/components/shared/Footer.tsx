"use client";

import {
  Facebook,
  Linkedin,
  Instagram,
  Music2, // For TikTok placeholder
  AtSign, // For Threads
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";

export function Footer() {
  const footerLinks = {
    locations: ["TPHCM", "Hà Nội", "Đà Nẵng", "Cần Thơ", "Bình Dương", "Hải Phòng", "Đồng Nai", "Quảng Ninh", "Bắc Ninh"],
    industries: ["Tài Chính/Ngân Hàng", "Kế Toán/Kiểm Toán", "Hành Chính/Văn Phòng", "Kinh Doanh/Bán Hàng", "Marketing/Quảng Cáo", "Xây dựng/Kiến Trúc", "Công Nghệ Thông Tin"],
    titles: ["Thực Tập Sinh", "Trợ Lý", "Nhân Viên Văn Phòng", "Trưởng Phòng", "Giám Đốc"],
    types: ["Part-time", "Online", "Thời vụ", "Remote"]
  };

  const secondaryLinks = [
    "Giới thiệu", "Điều khoản sử dụng", "Chính sách bảo mật", "Giải quyết tranh chấp",
    "Thoả thuận sử dụng mạng XH", "Quy chế", "Nhà Tuyển Dụng", "FAQ", "Blog", "Hỏi & Đáp", "Sitemap", "Quy định đăng tin"
  ];

  return (
    <footer className="w-full bg-white border-t border-slate-100 pt-16 pb-8">
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        {/* Top Section: Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 mb-12">
          {/* Column 1: Company Info (Span 4) */}
          <div className="lg:col-span-4 pr-0 lg:pr-8">
            <h3 className="text-[#0056b3] font-bold text-[18px] mb-6 uppercase tracking-tight">
              CÔNG TY CỔ PHẦN WORKLY AI
            </h3>
            <div className="space-y-4 text-slate-700 text-[13px] leading-relaxed">
              <p>
                <span className="font-bold">Trụ sở:</span> Tầng 3, Tòa nhà GIM, Ngõ 460 Khương Đình, Phường Khương Đình, Thành phố Hà Nội
                <br />
                <span className="font-bold flex items-center gap-1 mt-1">
                   Điện thoại: <span className="text-[#0056b3] font-medium">0984.259.428</span>
                </span>
              </p>
              <p>
                <span className="font-bold">Chi nhánh:</span> Tầng 5, Tòa nhà Phú Nhuận Plaza, Số 82 Trần Huy Liệu, Phường Cầu Kiệu, Thành phố Hồ Chí Minh
                <br />
                <span className="font-bold flex items-center gap-1 mt-1">
                   Điện thoại: <span className="text-[#0056b3] font-medium">0902.698.348</span>
                </span>
              </p>
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold">Email:</span>
                  <a href="mailto:contact@workly.vn" className="text-[#0056b3] hover:underline">contact@workly.vn</a>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">Hỗ trợ ứng viên:</span>
                  <span className="text-[#0056b3] font-medium">034.834.4515</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">Hotline:</span>
                  <span className="text-[#0056b3] font-medium">034.834.4515</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Địa điểm (Span 2) */}
          <div className="lg:col-span-2">
            <h4 className="text-[#0056b3] font-bold text-[14px] mb-6 whitespace-nowrap">Việc làm theo địa điểm</h4>
            <ul className="space-y-2.5">
              {footerLinks.locations.map(link => (
                <li key={link}><Link href="#" className="text-slate-600 hover:text-[#0056b3] text-[13px] transition-colors">{link}</Link></li>
              ))}
            </ul>
          </div>

          {/* Column 3: Ngành nghề (Span 2) */}
          <div className="lg:col-span-2">
            <h4 className="text-[#0056b3] font-bold text-[14px] mb-6 whitespace-nowrap">Việc theo ngành nghề</h4>
            <ul className="space-y-2.5">
              {footerLinks.industries.map(link => (
                <li key={link}><Link href="#" className="text-slate-600 hover:text-[#0056b3] text-[13px] transition-colors">{link}</Link></li>
              ))}
            </ul>
          </div>

          {/* Column 4: Chức danh (Span 2) */}
          <div className="lg:col-span-2">
            <h4 className="text-[#0056b3] font-bold text-[14px] mb-6 whitespace-nowrap">Việc theo chức danh</h4>
            <ul className="space-y-2.5">
              {footerLinks.titles.map(link => (
                <li key={link}><Link href="#" className="text-slate-600 hover:text-[#0056b3] text-[13px] transition-colors">{link}</Link></li>
              ))}
            </ul>
          </div>

          {/* Column 5: Loại hình (Span 2) */}
          <div className="lg:col-span-2">
            <h4 className="text-[#0056b3] font-bold text-[14px] mb-6 whitespace-nowrap">Việc theo loại hình</h4>
            <ul className="space-y-2.5">
              {footerLinks.types.map(link => (
                <li key={link}><Link href="#" className="text-slate-600 hover:text-[#0056b3] text-[13px] transition-colors">{link}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        {/* Middle Section: Secondary Links & Socials */}
        <div className="flex flex-col lg:flex-row items-center justify-between py-6 border-t border-slate-100 gap-6">
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-2">
            {secondaryLinks.map(link => (
              <Link key={link} href="#" className="text-slate-500 hover:text-[#0056b3] text-[12px] whitespace-nowrap transition-colors">
                {link}
              </Link>
            ))}
          </div>
          
          <div className="flex items-center gap-3">
            {[
              { icon: <Facebook className="w-4 h-4 fill-current" />, color: "hover:bg-blue-600" },
              { icon: <Linkedin className="w-4 h-4 fill-current" />, color: "hover:bg-blue-700" },
              { icon: <Instagram className="w-4 h-4" />, color: "hover:bg-pink-600" },
              { icon: <Music2 className="w-4 h-4" />, color: "hover:bg-black" },
              { icon: <AtSign className="w-4 h-4" />, color: "hover:bg-slate-700" }
            ].map((social, i) => (
              <a key={i} href="#" className={`w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-white transition-all ${social.color}`}>
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom Section: Legal & Compliance */}
        <div className="pt-8 border-t border-slate-100 flex flex-col lg:flex-row items-start justify-between gap-8">
          <div className="space-y-2 text-slate-400 text-[11px] leading-relaxed max-w-3xl">
            <p>Số ĐKKD: 0108266100, cấp ngày 09/05/2018 do Sở Kế hoạch và Đầu tư Thành phố Hà Nội cấp.</p>
            <p>Giấy phép thiết lập Mạng xã hội trên mạng số 568/GP-BTTTT do Bộ Thông tin & Truyền thông cấp ngày 30/08/2021.</p>
            <p className="font-medium text-slate-500">© 2026 Công ty Cổ phần Workly AI. All Rights Reserved.</p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
             {/* Bộ Công Thương Badge */}
             <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF0000] text-white rounded font-black italic text-[10px] leading-none shrink-0 shadow-sm">
                <CheckCircle2 className="w-3 h-3" />
                ĐÃ ĐĂNG KÝ <br/> BỘ CÔNG THƯƠNG
             </div>
             {/* DMCA Badge */}
             <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4CAF50] text-white rounded font-black text-[10px] leading-none shrink-0 shadow-sm italic">
                <ShieldCheck className="w-3 h-3" />
                DMCA <br/> PROTECTED
             </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
