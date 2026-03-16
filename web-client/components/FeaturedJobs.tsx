import { ChevronLeft, ChevronRight, CheckCircle2, TrendingUp } from "lucide-react";

export function FeaturedJobs() {
  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-24 flex flex-col">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <div className="flex items-center gap-2 text-[#FF6B2C] text-sm font-bold tracking-wider uppercase mb-3">
            <TrendingUp className="w-4 h-4" /> Thịnh hành
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Kỳ thực tập nổi bật</h2>
        </div>
        <div className="flex gap-3">
          <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Job 1 */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col hover:border-blue-200 hover:shadow-xl transition-all duration-300 group">
          <div className="flex justify-between items-start mb-16">
            <div className="w-12 h-12 bg-indigo-500 rounded-xl shadow-sm" />
            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full">Premium</span>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">Nhà Thiết Kế Sản Phẩm</h3>
          <p className="text-slate-500 text-sm mb-6">Spotify • Stockholm | Từ xa</p>
          
          <div className="flex flex-wrap gap-2 mb-8">
            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">Toàn thời gian</span>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">Trả lương</span>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">Ngay lập tức</span>
          </div>
          
          <button className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors mt-auto">
            Xem chi tiết
          </button>
        </div>

        {/* Job 2 */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col hover:border-orange-200 hover:shadow-xl transition-all duration-300 group">
          <div className="flex justify-between items-start mb-16">
            <div className="w-12 h-12 bg-orange-500 rounded-xl shadow-sm" />
            <span className="px-3 py-1 bg-orange-50 text-orange-600 text-xs font-semibold rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Đang tuyển
            </span>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-1 group-hover:text-orange-600 transition-colors">Kỹ Sư Phần Mềm</h3>
          <p className="text-slate-500 text-sm mb-6">Stripe • San Francisco</p>
          
          <div className="flex flex-wrap gap-2 mb-8">
            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">Hỗn hợp</span>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">Python</span>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">Full Stack</span>
          </div>
          
          <button className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors mt-auto">
            Xem chi tiết
          </button>
        </div>

        {/* Job 3 */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col hover:border-blue-200 hover:shadow-xl transition-all duration-300 group">
          <div className="flex justify-between items-start mb-16">
            <div className="w-12 h-12 bg-blue-500 rounded-xl shadow-sm" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">Marketing Tăng Trưởng</h3>
          <p className="text-slate-500 text-sm mb-6">TikTok • New York</p>
          
          <div className="flex flex-wrap gap-2 mb-8">
            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">Tại chỗ</span>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">Mùa hè 24</span>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">Sáng tạo</span>
          </div>
          
          <button className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors mt-auto">
            Xem chi tiết
          </button>
        </div>
      </div>
    </section>
  );
}
