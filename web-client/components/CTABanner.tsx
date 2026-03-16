import { Sparkles, CheckCircle2 } from "lucide-react";

export function CTABanner() {
  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-12">
      <div className="bg-[#0f172a] rounded-[2.5rem] p-8 md:p-16 flex flex-col lg:flex-row items-center justify-between gap-12 relative overflow-hidden shadow-2xl">
        {/* Background glowing effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full" />

        <div className="w-full lg:w-1/2 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight tracking-tight">
            Đảm bảo vị trí của bạn<br />trong đợt tuyển dụng<br />tiếp theo.
          </h2>
          <p className="text-slate-400 text-lg mb-8 max-w-md leading-relaxed">
            Tham gia cùng hơn 50.000 sinh viên nhận danh sách các kỳ thực tập cạnh tranh nhất được chọn lọc kỹ lưỡng hàng tuần trên toàn thế giới.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-[#FF6B2C]/20 flex items-center justify-center text-[#FF6B2C]">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-slate-300 font-medium">Vai trò chất lượng cao từ các công ty hàng đầu</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-[#FF6B2C]/20 flex items-center justify-center text-[#FF6B2C]">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-slate-300 font-medium">Tài nguyên cộng đồng độc quyền</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[45%] relative z-10">
          <div className="bg-[#1e293b]/50 backdrop-blur-md border border-slate-700 p-8 rounded-3xl">
            <h3 className="text-white font-semibold mb-6">Tham gia danh sách chờ</h3>
            <form className="space-y-4">
              <input
                type="text"
                placeholder="Tên, email, trường đại học..."
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-5 py-4 text-white placeholder:text-slate-500 outline-none focus:border-blue-500 transition-colors"
              />
              <button className="w-full bg-[#FF6B2C] hover:bg-[#e85a1f] text-white font-bold rounded-xl py-4 transition-colors flex justify-center items-center gap-2">
                Nhận quyền truy cập sớm <Sparkles className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
