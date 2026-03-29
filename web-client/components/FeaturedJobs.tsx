import { ChevronRight, CheckCircle2, Flame, Sparkles, MapPin, DollarSign, Clock } from "lucide-react";
import Link from "next/link";

export function FeaturedJobs() {
  const jobs = [
    {
      id: 1,
      title: "Senior Product Designer",
      company: "Spotify",
      location: "Hà Nội",
      salary: "20 - 35 triệu",
      type: "Toàn thời gian",
      time: "2 giờ trước",
      badge: "Hot",
      badgeColor: "bg-rose-50 text-rose-600",
      icon: <Flame className="w-3 h-3" />,
      logo: "bg-green-500",
    },
    {
      id: 2,
      title: "Fullstack Developer (NodeJS/React)",
      company: "VNG Corporation",
      location: "TP. HCM",
      salary: "15 - 25 triệu",
      type: "Tại chỗ",
      time: "5 giờ trước",
      badge: "Premium",
      badgeColor: "bg-blue-50 text-blue-600",
      icon: <Sparkles className="w-3 h-3" />,
      logo: "bg-blue-500",
    },
    {
      id: 3,
      title: "Marketing Growth Specialist",
      company: "Shopee",
      location: "Đà Nẵng",
      salary: "12 - 18 triệu",
      type: "Từ xa",
      time: "1 ngày trước",
      badge: "Mới",
      badgeColor: "bg-emerald-50 text-emerald-600",
      icon: <CheckCircle2 className="w-3 h-3" />,
      logo: "bg-orange-600",
    },
    {
      id: 4,
      title: "Kỹ Sư Cầu Nối (Bridge SE)",
      company: "FPT Software",
      location: "Hà Nội",
      salary: "Cạnh tranh",
      type: "Toàn thời gian",
      time: "3 giờ trước",
      badge: "Hot",
      badgeColor: "bg-rose-50 text-rose-600",
      icon: <Flame className="w-3 h-3" />,
      logo: "bg-orange-500",
    },
  ];

  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-20 pb-24">
      <div className="flex items-end justify-between mb-12">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Việc Làm Nổi Bật</h2>
          <p className="text-slate-500 mt-2">Đừng bỏ lỡ những cơ hội nghề nghiệp tốt nhất dành cho bạn</p>
        </div>
        <Link href="/jobs" className="text-blue-600 text-sm font-bold flex items-center gap-1 hover:underline group">
          Xem tất cả <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white border border-slate-100 rounded-3xl p-5 flex flex-col hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-100 transition-all duration-300 group cursor-pointer relative overflow-hidden">
            {/* Top Row: Logo & Badge */}
            <div className="flex justify-between items-start mb-6">
              <div className={`w-12 h-12 ${job.logo} rounded-2xl shadow-sm flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform`}>
                {job.company.charAt(0)}
              </div>
              <span className={`px-2.5 py-1 ${job.badgeColor} text-[10px] font-bold rounded-lg flex items-center gap-1 uppercase tracking-wider`}>
                {job.icon} {job.badge}
              </span>
            </div>

            {/* Title & Company */}
            <div className="mb-6 flex-1">
              <h3 className="text-base font-bold text-slate-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors uppercase leading-snug">
                {job.title}
              </h3>
              <p className="text-sm font-semibold text-slate-500">{job.company}</p>
            </div>
            
            {/* Details */}
            <div className="space-y-2.5 mb-6">
              <div className="flex items-center gap-2 text-slate-500">
                <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <span className="text-xs font-bold text-slate-700">{job.salary}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <span className="text-xs font-medium">{job.location} • {job.type}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[10px] font-medium">{job.time}</span>
              </div>
              <button className="text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Ứng tuyển ngay
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Trust Banner (Tiny) */}
      <div className="mt-16 py-6 px-10 bg-slate-900 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-white text-sm font-bold">Hãy để AI tìm việc giúp bạn</p>
            <p className="text-slate-400 text-xs">Phân tích hồ sơ và đề xuất việc làm phù hợp nhất</p>
          </div>
        </div>
        <button className="px-6 py-2.5 bg-white text-slate-900 text-sm font-bold rounded-xl hover:bg-slate-100 transition-colors">
          Thử ngay miễn phí
        </button>
      </div>
    </section>
  );
}
