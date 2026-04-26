import { Users, Briefcase, Building2, Globe } from "lucide-react";

export function StatsSection() {
  const stats = [
    { icon: <Briefcase className="w-6 h-6" />, label: "Vi?c làm dang tuy?n", value: "50,000+" },
    { icon: <Building2 className="w-6 h-6" />, label: "Doanh nghi?p", value: "10,000+" },
    { icon: <Users className="w-6 h-6" />, label: "?ng viên", value: "1,000,000+" },
    { icon: <Globe className="w-6 h-6" />, label: "Qu?c gia", value: "25+" },
  ];

  return (
    <section className="w-full bg-white py-12 border-y border-slate-100">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, index) => (
          <div key={index} className="flex flex-col items-center text-center group">
            <div className="w-12 h-12 rounded-full bg-slate-50 text-mariner flex items-center justify-center mb-4 group-hover:bg-mariner group-hover:text-white transition-all duration-300 border border-slate-100 shadow-sm">
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
