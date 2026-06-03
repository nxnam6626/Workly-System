"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Github, Mail, Headphones } from "lucide-react";

const productLinks = [
  { label: "Tìm việc làm", href: "/jobs" },
  { label: "Danh sách công ty", href: "/companies" },
  { label: "Tạo CV trực tuyến", href: "/cv-builder" },
  { label: "AI Matching", href: "/matching" },
  { label: "Hồ sơ cá nhân", href: "/profile" },
];

const recruiterLinks = [
  { label: "Dashboard", href: "/recruiter/dashboard" },
  { label: "Đăng tin tuyển dụng", href: "/recruiter/post-job" },
  { label: "Quản lý ứng viên", href: "/recruiter/applications" },
  { label: "Lịch phỏng vấn", href: "/recruiter/interviews" },
  { label: "Hồ sơ công ty", href: "/recruiter/company" },
];

const resourceLinks = [
  { label: "Trung tâm hỗ trợ", href: "/support" },
  { label: "Điều khoản sử dụng", href: "/terms" },
  { label: "Chính sách bảo mật", href: "/privacy" },
];

export function Footer() {
  return (
    <footer className="w-full bg-slate-50/80 border-t border-slate-200/60">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 py-16">

          {/* Brand Column — Takes more space */}
          <div className="lg:col-span-4 space-y-6">
            <Link href="/" className="flex items-center gap-3 group">
              <Image
                src="/logos/logo.png"
                alt="Workly Logo"
                width={36}
                height={36}
                className="rounded-xl"
              />
              <span className="text-slate-900 font-extrabold text-[22px] tracking-tight group-hover:text-blue-600 transition-colors">
                Workly
              </span>
            </Link>

            <p className="text-slate-500 text-[14px] leading-relaxed max-w-sm">
              Nền tảng tuyển dụng thông minh — kết nối ứng viên phù hợp với nhà tuyển dụng nhanh chóng, chính xác nhờ công nghệ AI.
            </p>

            {/* CTA Button */}
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2.5 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all duration-200 active:scale-[0.97] group"
            >
              Khám phá việc làm
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* Contact mini */}
            <div className="flex flex-col gap-2 pt-2">
              <a
                href="mailto:contact@workly.vn"
                className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 text-xs transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                contact@workly.vn
              </a>
              <Link
                href="/support"
                className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 text-xs transition-colors"
              >
                <Headphones className="w-3.5 h-3.5" />
                Trung tâm hỗ trợ
              </Link>
            </div>
          </div>

          {/* Link Columns */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8 lg:gap-6 lg:pt-1">

            {/* Sản phẩm */}
            <div>
              <h4 className="text-slate-900 font-bold text-xs uppercase tracking-widest mb-5">
                Ứng viên
              </h4>
              <ul className="space-y-3">
                {productLinks.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-slate-500 hover:text-slate-900 text-[13px] transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Nhà tuyển dụng */}
            <div>
              <h4 className="text-slate-900 font-bold text-xs uppercase tracking-widest mb-5">
                Nhà tuyển dụng
              </h4>
              <ul className="space-y-3">
                {recruiterLinks.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-slate-500 hover:text-slate-900 text-[13px] transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tài nguyên */}
            <div>
              <h4 className="text-slate-900 font-bold text-xs uppercase tracking-widest mb-5">
                Tài nguyên
              </h4>
              <ul className="space-y-3">
                {resourceLinks.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-slate-500 hover:text-slate-900 text-[13px] transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-200/60 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-400 text-[11px] font-medium">
            © {new Date().getFullYear()} Workly. All rights reserved.
          </p>
          <p className="text-slate-300 text-[11px]">
            Built with Next.js, NestJS & AI
          </p>
        </div>
      </div>
    </footer>
  );
}
