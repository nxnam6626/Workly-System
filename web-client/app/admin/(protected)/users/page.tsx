import { Users, Search, Filter } from 'lucide-react';

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản Lý Người Dùng</h1>
          <p className="text-sm text-slate-500 mt-1">
            Xem chi tiết tài khoản và khóa tài khoản khi cần thiết
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm user..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>
          <button className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50">
            <Filter className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-12 text-center text-slate-500">
          <Users className="w-12 h-12 mx-auto text-slate-300 mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-slate-700">Danh sách người dùng</h3>
          <p className="text-sm mt-2">Chức năng này đang được lên kế hoạch phát triển.</p>
        </div>
      </div>
    </div>
  );
}
