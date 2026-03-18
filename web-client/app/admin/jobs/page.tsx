import { Briefcase, Search, Filter } from 'lucide-react';

export default function JobsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản Lý Tin Tuyển Dụng</h1>
          <p className="text-sm text-slate-500 mt-1">
            Duyệt tin, gỡ/ẩn tin, và hiệu chỉnh dữ liệu crawler
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm việc làm..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white">
              Chờ duyệt
            </button>
            <button className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
              Đã duyệt
            </button>
            <button className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
              Đã gỡ/ẩn
            </button>
          </div>
        </div>
        
        <div className="p-12 text-center text-slate-500">
          <Briefcase className="w-12 h-12 mx-auto text-slate-300 mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-slate-700">Danh sách việc làm</h3>
          <p className="text-sm mt-2">Chức năng quản lý duyệt tin và hiệu chỉnh dữ liệu crawler đang trong quá trình phát triển.</p>
        </div>
      </div>
    </div>
  );
}
