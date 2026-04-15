import { Building2, ChevronRight } from "lucide-react";
import Link from "next/link";

export function TopEmployers() {
  const employers = [
    { name: "FPT Software", jobs: 156, color: "bg-orange-500" },
    { name: "VNG Corporation", jobs: 84, color: "bg-blue-500" },
    { name: "Viettel Group", jobs: 120, color: "bg-red-600" },
    { name: "Shopee", jobs: 42, color: "bg-orange-600" },
    { name: "Momo", jobs: 35, color: "bg-pink-600" },
    { name: "Grab", jobs: 28, color: "bg-green-600" },
  ];

  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-20 bg-white">
      <div className="flex items-center justify-between mb-10 border-l-4 border-mariner pl-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#111827] tracking-tight uppercase">Top Nhà Tuyển Dụng</h2>
          <p className="text-slate-500 mt-1 text-sm md:text-base font-medium">Đối tác chiến lược và các tập đoàn hàng đầu</p>
        </div>
        <Link href="/companies" className="text-mariner text-[15px] font-bold flex items-center gap-1 hover:text-primary-hover group">
          Xem tất cả <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
        {employers.map((emp, index) => (
          <div key={index} className="bg-white border border-slate-100 rounded-lg p-6 flex flex-col items-center hover:shadow-jobsgo-hover hover:border-mariner/20 transition-all cursor-pointer group shadow-jobsgo">
            <div className={`w-16 h-16 ${emp.color} rounded-lg mb-4 flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform`}>
              <Building2 className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm md:text-base text-center truncate w-full">{emp.name}</h3>
            <span className="mt-2 text-mariner text-xs font-bold">
              {emp.jobs} việc làm
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
