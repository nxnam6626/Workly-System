import { PieChart, Users, Briefcase, Activity } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Thống Kê Tổng Quan</h1>
          <p className="text-sm text-slate-500 mt-1">
            Bảng điều khiển theo dõi hoạt động của hệ thống
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng Số Khách Hàng', value: '1,248', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Tin Tuyển Dụng', value: '8,392', icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Lượt Cào Hôm Nay', value: '254', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Tỉ Lệ Duyệt', value: '94%', icon: PieChart, color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 shadow-sm mt-8">
        <PieChart className="w-16 h-16 mx-auto text-slate-300 mb-4 opacity-50" />
        <h3 className="text-lg font-semibold text-slate-700">Biểu đồ đang cập nhật</h3>
        <p className="text-sm mt-2">Tính năng này đang trong quá trình phát triển.</p>
      </div>
    </div>
  );
}
