"use client";

import { useState, useEffect } from "react";
import { Building2, ChevronRight } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

interface Employer {
  companyId: string;
  companyName: string;
  logo: string | null;
  banner: string | null;
  slug: string | null;
  jobsCount: number;
  mainIndustry: string | null;
  isRegistered: boolean;
}

export function TopEmployers() {
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployers = async () => {
      try {
        const res = await api.get("/companies/top?limit=20");
        setEmployers(res.data);
      } catch (error) {
        console.error("Failed to fetch top employers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployers();
  }, []);

  const featuredEmployers = employers.slice(0, 5);

  return (
    <section className="w-full py-16 bg-[#E9F6F4]/60">
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        {/* Header */}
        <div className="relative flex flex-col items-center mb-14">
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight text-center">
            Nhà Tuyển Dụng Tiêu Biểu
          </h2>
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <Link
              href="/companies"
              className="text-[#1e60ad] font-bold text-sm flex items-center gap-1 hover:underline transition-all group"
            >
              Xem thêm <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Top Row: Featured Grid (5 companies) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 pt-12 flex flex-col items-center border border-white animate-pulse shadow-sm h-[220px]">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-20 h-20 bg-slate-100 rounded-2xl" />
                <div className="w-3/4 h-5 bg-slate-100 rounded mb-4 mt-4" />
                <div className="w-1/2 h-4 bg-slate-50 rounded mb-6" />
                <div className="w-full h-10 bg-slate-100 rounded-xl" />
              </div>
            ))
          ) : featuredEmployers.map((emp) => (
            <Link
              key={emp.companyId}
              href={`/companies/${emp.companyId}`}
              className="group bg-white rounded-2xl p-6 pt-12 flex flex-col items-center text-center border border-white hover:border-blue-200 hover:shadow-[0_20px_50px_rgba(30,96,173,0.1)] transition-all duration-500 relative h-[220px]"
            >
              {/* Logo Overlay */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center border border-slate-50 p-2 group-hover:scale-105 transition-transform duration-500">
                {emp.logo ? (
                  <img
                    src={emp.logo}
                    alt={emp.companyName}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Building2 className="w-10 h-10 text-slate-300" />
                )}
                
                {/* Verified Badge */}
                {emp.isRegistered && (
                  <div className="absolute -right-1 -bottom-1 bg-[#1e60ad] text-white rounded-full p-0.5 border-2 border-white shadow-sm" title="Doanh nghiệp xác thực">
                    <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center justify-between h-full w-full">
                <div className="mt-4">
                  <h3 className="font-bold text-slate-800 text-[15px] leading-tight mb-1 line-clamp-2 min-h-[40px] flex items-center justify-center">
                    {emp.companyName}
                  </h3>
                  <div className="text-[12px] text-slate-400 font-medium line-clamp-1">
                    {emp.mainIndustry || "Đa lĩnh vực"}
                  </div>
                </div>

                <div className="w-full px-2 py-2.5 mt-auto bg-[#f0f7ff] text-[#1e60ad] text-[13px] font-bold rounded-xl group-hover:bg-[#1e60ad] group-hover:text-white transition-all duration-300">
                  {emp.jobsCount} vị trí tuyển dụng
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom Row: Infinite Marquee Logo Reel */}
        <div className="mt-20 overflow-hidden group/marquee relative w-full before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-20 before:bg-gradient-to-r before:from-[#E9F6F4]/60 before:to-transparent after:absolute after:right-0 after:top-0 after:z-10 after:h-full after:w-20 after:bg-gradient-to-l after:from-[#E9F6F4]/60 after:to-transparent">
          <div className="flex w-max gap-8 items-center animate-marquee whitespace-nowrap py-6">
            {[...employers, ...employers, ...employers, ...employers, ...employers, ...employers].map((emp, i) => (
              <Link
                key={`${emp.companyId}-${i}`}
                href={`/companies/${emp.companyId}`}
                className="w-24 h-24 bg-white rounded-2xl border border-white/50 shadow-md flex items-center justify-center p-3 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer shrink-0"
              >
                {emp.logo ? (
                  <img
                    src={emp.logo}
                    alt={emp.companyName}
                    className="w-full h-full object-contain grayscale opacity-60 group-hover/marquee:grayscale-0 group-hover/marquee:opacity-100 transition-all duration-500"
                  />
                ) : (
                  <Building2 className="w-10 h-10 text-slate-100" />
                )}
              </Link>
            ))}
          </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            animation: marquee 30s linear infinite;
          }
          .animate-marquee:hover {
            animation-play-state: paused;
          }
        ` }} />
      </div>
    </section>
  );
}
