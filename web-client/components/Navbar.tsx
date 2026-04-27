'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { NavBrand } from './navbar/NavBrand';
import { NavIcons } from './navbar/NavIcons';
import { AuthActions } from './navbar/AuthActions';
import { UserDropdown } from './navbar/UserDropdown';

export function Navbar() {
  const { isAuthenticated } = useAuthStore();
  const [isJobsMenuOpen, setIsJobsMenuOpen] = useState(false);
  const [isCompaniesMenuOpen, setIsCompaniesMenuOpen] = useState(false);

  const jobsMegaMenu = {
    industries: [
      { label: "Việc làm Tài Chính/Ngân Hàng", href: "/jobs?industry=Tài chính / Kế toán / Ngân hàng" },
      { label: "Việc làm Kế Toán/Kiểm Toán", href: "/jobs?industry=Tài chính / Kế toán / Ngân hàng" },
      { label: "Việc làm Hành Chính/Văn Phòng", href: "/jobs?industry=Nhân sự / Hành / Pháp lý" },
      { label: "Việc làm Kinh Doanh/Bán Hàng", href: "/jobs?industry=Kinh doanh / CSKH" },
      { label: "Việc làm Marketing/Quảng Cáo", href: "/jobs?industry=Marketing / Truyền thông" },
      { label: "Việc làm Xây dựng/Kiến Trúc", href: "/jobs?industry=Xây dựng / Kiến trúc" },
      { label: "Việc làm Công Nghệ Thông Tin", href: "/jobs?industry=CNTT / Phần mềm" },
      { label: "Việc làm Nhân Sự", href: "/jobs?industry=Nhân sự / Hành / Pháp lý" }
    ],
    locations: [
      { label: "Việc làm tại Hồ Chí Minh", href: "/jobs?location=Hồ Chí Minh" },
      { label: "Việc làm tại Hà Nội", href: "/jobs?location=Hà Nội" },
      { label: "Việc làm tại Đà Nẵng", href: "/jobs?location=Đà Nẵng" },
      { label: "Việc làm tại Cần Thơ", href: "/jobs?location=Cần Thơ" },
      { label: "Việc làm tại Bình Dương", href: "/jobs?location=Bình Dương" },
      { label: "Việc làm tại Hải Phòng", href: "/jobs?location=Hải Phòng" },
      { label: "Việc làm tại Đồng Nai", href: "/jobs?location=Đồng Nai" },
      { label: "Việc làm tại Quảng Ninh", href: "/jobs?location=Quảng Ninh" }
    ],
    needs: [
      { label: "Việc làm Tuyển Gấp", href: "/jobs?search=tuyển gấp" },
      { label: "Việc làm Nổi Bật", href: "/jobs?search=nổi bật" },
      { label: "Việc làm Lao động phổ thông", href: "/jobs?jobType=TEMPORARY" },
      { label: "Việc làm Không cần bằng cấp", href: "/jobs?search=không cần bằng cấp" },
      { label: "Việc làm Online tại nhà", href: "/jobs?jobType=REMOTE" },
      { label: "Việc làm Part-time", href: "/jobs?jobType=PART_TIME" },
      { label: "Việc làm Thời vụ", href: "/jobs?jobType=TEMPORARY" },
      { label: "Việc làm Remote", href: "/jobs?jobType=REMOTE" }
    ]
  };

  return (
    <nav className="w-full bg-white border-b border-slate-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 lg:px-6 flex items-center justify-between h-16">
        <div className="flex items-center gap-8">
          <NavBrand />

          {/* Centered Navigation Links */}
          <div className="hidden lg:flex items-center gap-6 h-16">
            <div
              className="relative h-full flex items-center"
              onMouseEnter={() => setIsJobsMenuOpen(true)}
              onMouseLeave={() => setIsJobsMenuOpen(false)}
            >
              <Link
                href="/jobs"
                className={`text-[15px] font-bold flex items-center gap-1 transition-colors h-full ${isJobsMenuOpen ? 'text-mariner' : 'text-slate-700 hover:text-mariner'
                  }`}
              >
                Việc làm <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isJobsMenuOpen ? 'rotate-180' : ''}`} />
              </Link>

              {/* Mega Menu */}
              {isJobsMenuOpen && (
                <div className="absolute top-16 -left-20 w-[850px] bg-white shadow-2xl rounded-b-2xl border-t border-slate-50 p-8 grid grid-cols-3 gap-10 animate-in fade-in slide-in-from-top-2 duration-300 z-50">
                  {/* Column 1: Ngành nghề */}
                  <div>
                    <h4 className="font-black text-slate-900 text-sm mb-5 uppercase tracking-wide">Việc theo ngành nghề</h4>
                    <ul className="space-y-3">
                      {jobsMegaMenu.industries.map(item => (
                        <li key={item.label}>
                          <Link href={item.href} className="text-slate-500 hover:text-mariner text-[13px] font-medium transition-colors block">
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Column 2: Địa điểm */}
                  <div>
                    <h4 className="font-black text-slate-900 text-sm mb-5 uppercase tracking-wide">Việc theo địa điểm</h4>
                    <ul className="space-y-3">
                      {jobsMegaMenu.locations.map(item => (
                        <li key={item.label}>
                          <Link href={item.href} className="text-slate-500 hover:text-mariner text-[13px] font-medium transition-colors block">
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Column 3: Nhu cầu */}
                  <div>
                    <h4 className="font-black text-slate-900 text-sm mb-5 uppercase tracking-wide">Việc theo nhu cầu</h4>
                    <ul className="space-y-3">
                      {jobsMegaMenu.needs.map(item => (
                        <li key={item.label}>
                          <Link href={item.href} className="text-slate-500 hover:text-mariner text-[13px] font-medium transition-colors block">
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div
              className="relative h-full flex items-center"
              onMouseEnter={() => setIsCompaniesMenuOpen(true)}
              onMouseLeave={() => setIsCompaniesMenuOpen(false)}
            >
              <Link
                href="/companies"
                className={`text-[15px] font-bold flex items-center gap-1 transition-colors h-full ${isCompaniesMenuOpen ? 'text-mariner' : 'text-slate-700 hover:text-mariner'
                  }`}
              >
                Công ty <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isCompaniesMenuOpen ? 'rotate-180' : ''}`} />
              </Link>

              {/* Companies Dropdown */}
              {isCompaniesMenuOpen && (
                <div className="absolute top-16 left-0 w-48 bg-white shadow-2xl rounded-b-xl border-t border-slate-50 py-3 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                  <ul className="space-y-1">
                    {[
                      "Tiêu Biểu", "Nổi Bật", "Ngân Hàng", "Bảo Hiểm",
                      "Công Nghệ", "Xây Dựng", "Sản Xuất", "Nhà Hàng",
                      "Khách Sạn", "Y Tế", "Bất Động Sản", "Giáo Dục"
                    ].map(item => (
                      <li key={item}>
                        <Link href="#" className="px-5 py-2 text-slate-600 hover:bg-slate-50 hover:text-mariner text-[13.5px] font-medium transition-all block">
                          {item}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <NavIcons />
              <UserDropdown />
            </div>
          ) : (
            <AuthActions />
          )}
        </div>
      </div>
    </nav>
  );
}
