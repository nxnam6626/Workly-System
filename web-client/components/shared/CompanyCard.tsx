"use client";

import Link from "next/link";
import { Building2, MapPin, Users } from "lucide-react";

interface Company {
  companyId: string;
  companyName: string;
  logo: string | null;
  banner: string | null;
  address: string | null;
  description: string | null;
  companySize: number | null;
  _count?: { jobPostings: number };
}

export function CompanyCard({ company }: { company: Company }) {
  return (
    <Link href={`/companies/${company.companyId}`} className="group block h-full">
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col hover:border-blue-400">
        <div className="relative h-32 bg-slate-100 overflow-hidden">
          {company.banner ? (
            <img
              src={company.banner}
              alt={company.companyName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 opacity-80" />
          )}
          <div className="absolute -bottom-8 left-6 w-16 h-16 bg-white rounded-xl shadow-md border border-gray-100 p-1 flex items-center justify-center overflow-hidden">
            {company.logo ? (
              <img
                src={company.logo}
                alt={company.companyName}
                className="w-full h-full object-contain"
              />
            ) : (
              <Building2 className="w-8 h-8 text-blue-500" />
            )}
          </div>
        </div>

        <div className="pt-10 pb-6 px-6 flex flex-col flex-1">
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-2">
            {company.companyName}
          </h3>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{company.address || "Chưa cập nhật địa chỉ"}</span>
            </div>
            {company.companySize && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Users className="w-4 h-4 flex-shrink-0" />
                <span>{company.companySize} nhân viên</span>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-500 line-clamp-3 mb-6 flex-1 italic">
            "{company.description || "Chưa có mô tả chi tiết về công ty."}"
          </p>

          <div className="pt-4 border-t border-gray-50 flex items-center justify-between mt-auto">
            <span className="text-sm font-semibold text-blue-600">
              {company._count?.jobPostings || 0} công việc đang tuyển
            </span>
            <div className="px-4 py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
              Xem chi tiết
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
