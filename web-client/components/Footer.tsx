import { Sparkles, Twitter, Linkedin, Globe } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 bg-white mt-20">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">Workly</span>
            </div>
            <p className="text-slate-500 text-sm mb-8 max-w-xs leading-relaxed">
              Trao quyền cho thế hệ kỹ sư tiếp theo với các công cụ để tìm kiếm công việc có ý nghĩa.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-500 hover:border-blue-200 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-700 hover:border-blue-200 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-colors">
                <Globe className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-6">Sản phẩm</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><a href="#" className="hover:text-blue-600 transition-colors">Công cụ Tìm kiếm</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Tối ưu hóa CV</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Đánh giá Thực tập</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Bảng giá</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-6">Công ty</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><a href="#" className="hover:text-blue-600 transition-colors">Về chúng tôi</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Tuyển dụng</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Hợp tác</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Bản tin</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-6">Hỗ trợ</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><a href="#" className="hover:text-blue-600 transition-colors">Trung tâm Trợ giúp</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Chính sách Bảo mật</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Điều khoản Dịch vụ</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Nguyên tắc Cộng đồng</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm">
            © 2024 Workly Labs. Dành cho nhà sáng tạo.
          </p>
          <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium bg-emerald-50 px-3 py-1 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Hệ thống hoạt động bình thường
          </div>
        </div>
      </div>
    </footer>
  );
}
