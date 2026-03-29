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
    <section className="w-full max-w-7xl mx-auto px-6 py-20">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Top Nhà Tuyển Dụng</h2>
          <p className="text-slate-500 mt-2 text-sm md:text-base">Các tập đoàn hàng đầu đang tìm kiếm tài năng như bạn</p>
        </div>
        <Link href="/companies" className="text-blue-600 text-sm font-bold flex items-center gap-1 hover:underline">
          Xem tất cả <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
        {employers.map((emp, index) => (
          <div key={index} className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col items-center hover:shadow-lg hover:border-blue-100 transition-all cursor-pointer group">
            <div className={`w-16 h-16 ${emp.color} rounded-xl mb-4 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
              <Building2 className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm md:text-base text-center truncate w-full">{emp.name}</h3>
            <span className="mt-2 px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] md:text-xs font-bold rounded-full">
              {emp.jobs} việc làm
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
