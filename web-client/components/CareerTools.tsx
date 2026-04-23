import { Briefcase, FileText, Target } from "lucide-react";

export function CareerTools() {
  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-24 flex flex-col border-t border-slate-100 mt-12 bg-white/50">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">Công cụ nghề nghiệp cho thế hệ mới</h2>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">Mọi thứ bạn cần để đi từ ứng viên đến thực tập sinh tại các công ty yêu thích của bạn.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-blue-600">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-3">Thu thập Thông minh</h3>
          <p className="text-slate-500 leading-relaxed">
            Chúng tôi tổng hợp các kỳ thực tập tốt nhất từ khắp nơi trên web, được điều chỉnh hoàn toàn theo sở thích của bạn.
          </p>
        </div>

        <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6 text-orange-600">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-3">Đánh giá CV AI</h3>
          <p className="text-slate-500 leading-relaxed">
            Tối ưu hóa sơ yếu lý lịch của bạn bằng AI được huấn luyện để hiểu chính xác những gì nhà tuyển dụng đang tìm kiếm.
          </p>
        </div>

        <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 text-indigo-600">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-3">Thông tin Nội bộ</h3>
          <p className="text-slate-500 leading-relaxed">
            Nhận những đánh giá xác thực và mẹo phỏng vấn độc quyền từ các cựu thực tập sinh đã từng làm việc tại đó.
          </p>
        </div>
      </div>
    </section>
  );
}
