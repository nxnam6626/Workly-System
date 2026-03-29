import { ArrowRight, MapPin, Search, Briefcase, TrendingUp } from "lucide-react";

export function HeroSection() {
  const trending = ["IT / Phần mềm", "Kinh doanh", "Marketing", "Kế toán", "Bán hàng"];

  return (
    <section className="relative w-full overflow-hidden pt-20 pb-32">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-full -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-indigo-100/40 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-blue-50 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <span className="text-xs font-bold text-slate-600 tracking-wide uppercase">
            Hơn 5.000+ tin tuyển dụng mới mỗi ngày
          </span>
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.15]">
          Tìm việc làm mơ ước <br className="hidden md:block" /> 
          cùng với <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Workly AI</span>
        </h1>

        <p className="text-lg text-slate-500 mb-12 max-w-2xl leading-relaxed">
          Nền tảng kết nối ứng viên tài năng với những nhà tuyển dụng hàng đầu. 
          Bắt đầu hành trình sự nghiệp của bạn ngay hôm nay.
        </p>

        {/* Enhanced Search Bar */}
        <div className="w-full max-w-5xl bg-white p-2 md:p-4 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-slate-100 flex flex-col lg:flex-row items-center gap-2 mb-8">
          <div className="flex-1 flex items-center gap-3 px-4 py-3 w-full group">
            <Search className="w-5 h-5 text-blue-500 group-focus-within:scale-110 transition-transform" />
            <input
              type="text"
              placeholder="Vị trí tuyển dụng, tên công ty..."
              className="w-full bg-transparent outline-none text-slate-700 font-medium placeholder:text-slate-400"
            />
          </div>

          <div className="hidden lg:block w-px h-10 bg-slate-100" />

          <div className="flex-1 flex items-center gap-3 px-4 py-3 w-full border-t lg:border-none border-slate-50">
            <MapPin className="w-5 h-5 text-rose-500" />
            <select className="w-full bg-transparent outline-none text-slate-700 font-medium appearance-none cursor-pointer">
              <option>Tất cả địa điểm</option>
              <option>Hà Nội</option>
              <option>TP. Hồ Chí Minh</option>
              <option>Đà Nẵng</option>
              <option>Từ xa (Remote)</option>
            </select>
          </div>

          <div className="hidden lg:block w-px h-10 bg-slate-100" />

          <div className="flex-1 flex items-center gap-3 px-4 py-3 w-full border-t lg:border-none border-slate-50">
            <Briefcase className="w-5 h-5 text-amber-500" />
            <select className="w-full bg-transparent outline-none text-slate-700 font-medium appearance-none cursor-pointer">
              <option>Tất cả ngành nghề</option>
              <option>Công nghệ thông tin</option>
              <option>Kinh doanh / Bán hàng</option>
              <option>Marketing</option>
              <option>Kế toán / Tài chính</option>
            </select>
          </div>

          <button className="w-full lg:w-auto px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-blue-600/20 active:scale-95">
            Tìm kiếm <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Trending Keywords */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="flex items-center gap-1.5 text-sm font-bold text-slate-400">
            <TrendingUp className="w-4 h-4" /> Từ khóa phổ biến:
          </span>
          {trending.map((item, idx) => (
            <button key={idx} className="px-4 py-1.5 rounded-full bg-slate-100/50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 text-sm font-medium transition-colors border border-transparent hover:border-blue-100">
              {item}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
