import { Users, Briefcase, Building2, Globe } from "lucide-react";

export function StatsSection() {
  const stats = [
    { icon: <Briefcase className="w-6 h-6" />, label: "Việc làm đang tuyển", value: "50,000+" },
    { icon: <Building2 className="w-6 h-6" />, label: "Doanh nghiệp", value: "10,000+" },
    { icon: <Users className="w-6 h-6" />, label: "Ứng viên", value: "1,000,000+" },
    { icon: <Globe className="w-6 h-6" />, label: "Quốc gia", value: "25+" },
  ];

  return (
    <section className="w-full bg-white py-12 border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, index) => (
          <div key={index} className="flex flex-col items-center text-center group">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
              {stat.icon}
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
            <div className="text-sm font-medium text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
