"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { HIERARCHICAL_INDUSTRIES } from "@/lib/industries";

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

export function CareerSidebar() {
  const searchParams = useSearchParams();
  const currentIndustry = searchParams.get("industry");

  // Find which main category is active (either it is selected or one of its sub-categories is selected)
  const activeMainCategory = HIERARCHICAL_INDUSTRIES.find(i =>
    i.category === currentIndustry || i.subCategories.includes(currentIndustry || "")
  );

  const renderSection = (title: string, content: React.ReactNode) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
      <h3 className="text-slate-800 font-black text-[15px] mb-4 uppercase tracking-tight">{title}</h3>
      <div className="space-y-0.5 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
        {content}
      </div>
    </div>
  );

  const industryContent = (
    <div className="space-y-1">
      {HIERARCHICAL_INDUSTRIES.map((main) => {
        const isMainActive = main.category === currentIndustry;
        const isParentOfActive = main.subCategories.includes(currentIndustry || "");
        const isOpen = isMainActive || isParentOfActive;

        return (
          <div key={main.category} className="space-y-1">
            <Link
              href={`/jobs?industry=${encodeURIComponent(main.category)}`}
              className={`flex items-center justify-between py-2 px-3 rounded-lg text-[13px] font-bold transition-all group ${isMainActive || isParentOfActive
                ? "bg-[#1e60ad]/5 text-[#1e60ad]"
                : "text-slate-700 hover:bg-slate-50 hover:text-[#1e60ad]"
                }`}
            >
              <span className="line-clamp-1">{main.category}</span>
              <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isOpen ? "rotate-90 text-[#1e60ad]" : "opacity-40 group-hover:opacity-100"}`} />
            </Link>

            {isOpen && (
              <div className="ml-4 pl-3 border-l-2 border-slate-100 space-y-1 py-1 animate-in slide-in-from-top-1 duration-200">
                {main.subCategories.map((sub) => (
                  <Link
                    key={sub}
                    href={`/jobs?industry=${encodeURIComponent(sub)}`}
                    className={`block py-1.5 px-3 rounded-md text-[12.5px] font-medium transition-all ${sub === currentIndustry
                      ? "text-[#1e60ad] bg-[#1e60ad]/5 font-bold"
                      : "text-slate-500 hover:text-[#1e60ad] hover:bg-slate-50"
                      }`}
                  >
                    {sub}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const locationContent = locations.map((item) => (
    <Link
      key={item}
      href={`/jobs?location=${encodeURIComponent(item.replace("Việc Làm ", ""))}`}
      className="flex items-center justify-between py-2 px-3 rounded-lg text-[13px] font-medium text-slate-600 hover:bg-slate-50 hover:text-[#1e60ad] transition-all group"
    >
      <span className="line-clamp-1">{item}</span>
      <ChevronRight className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  ));

  return (
    <div className="w-full space-y-6">
      {/* Sections */}
      {renderSection("Ngành nghề chuyên môn", industryContent)}

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
