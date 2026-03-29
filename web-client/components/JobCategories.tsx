import { 
  Code2, Megaphone, Laptop, Calculator, 
  HeartPulse, Scale, Palmtree, Hammer 
} from "lucide-react";

export function JobCategories() {
  const categories = [
    { icon: <Code2 className="w-6 h-6" />, name: "Công nghệ thông tin", jobs: "1,240" },
    { icon: <Megaphone className="w-6 h-6" />, name: "Marketing / PR", jobs: "850" },
    { icon: <Calculator className="w-6 h-6" />, name: "Kế toán / Tài chính", jobs: "620" },
    { icon: <Laptop className="w-6 h-6" />, name: "Kinh doanh / Bán hàng", jobs: "2,100" },
    { icon: <HeartPulse className="w-6 h-6" />, name: "Y tế / Dược", jobs: "340" },
    { icon: <Scale className="w-6 h-6" />, name: "Luật / Pháp lý", jobs: "180" },
    { icon: <Palmtree className="w-6 h-6" />, name: "Du lịch / Khách sạn", jobs: "560" },
    { icon: <Hammer className="w-6 h-6" />, name: "Xây dựng / Kiến trúc", jobs: "420" },
  ];

  return (
    <section className="w-full bg-slate-50 py-20">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-10">Khám Phá Theo Ngành Nghề</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((cat, index) => (
            <div key={index} className="bg-white p-6 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer group">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                {cat.icon}
              </div>
              <h3 className="font-bold text-slate-800 mb-1">{cat.name}</h3>
              <p className="text-xs text-slate-400 font-medium">({cat.jobs} việc làm)</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
