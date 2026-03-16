import { ArrowRight, MapPin, Search } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative w-full max-w-7xl mx-auto px-6 pt-24 pb-20 flex flex-col items-center text-center">
      {/* Subtle gradient backgrounds */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-gradient-to-b from-blue-100/50 to-transparent blur-3xl -z-10 rounded-full pointer-events-none" />

      {/* Tag */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold tracking-wide uppercase mb-8">
        <span className="w-2 h-2 rounded-full bg-blue-500" />
        Được tin dùng bởi hơn 50.000+ sinh viên
      </div>

      <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1] max-w-4xl">
        Tìm kiếm kỳ thực tập <br className="hidden sm:block" /> mơ ước của bạn với <span className="text-blue-600">AI</span>
      </h1>

      <p className="text-lg md:text-xl text-slate-500 mb-12 max-w-2xl leading-relaxed">
        Đừng nộp đơn mù quáng. Sử dụng công cụ tương thích thông minh của chúng tôi để tìm các vai trò hoàn toàn phù hợp với kỹ năng và mục tiêu nghề nghiệp của bạn.
      </p>

      {/* Search Bar */}
      <div className="w-full max-w-3xl bg-white p-2 sm:p-3 rounded-full shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col sm:flex-row items-center gap-2">
        <div className="flex-1 flex items-center gap-3 px-4 py-2 w-full">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Thiết kế sản phẩm, Marketing..."
            className="w-full bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
          />
        </div>

        <div className="hidden sm:block w-[1px] h-8 bg-slate-200 mx-1" />

        <div className="flex-1 flex items-center gap-3 px-4 py-2 w-full border-t border-slate-100 sm:border-none pt-4 sm:pt-2">
          <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Từ xa hoặc New York"
            className="w-full bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
          />
        </div>

        <button className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full flex items-center justify-center gap-2 transition-colors mt-2 sm:mt-0 shadow-md shadow-blue-600/20 shrink-0">
          Tìm kiếm <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
