'use client';

import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Shield, Zap, Crown, RotateCcw, Loader2, Mail, CheckCircle2 } from 'lucide-react';

export default function DebugSubscriptionPage() {
  const [email, setEmail] = useState('zighdevil@gmail.com');
  const [loading, setLoading] = useState<string | null>(null);

  const handleForceSet = async (plan: string) => {
    setLoading(plan);
    try {
      const { data } = await api.post('/debug/force-set-subscription', { email, plan });
      toast.success(data.message);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(null);
    }
  };

  const PlanCard = ({ plan, title, desc, icon: Icon, color }: any) => (
    <div className={`p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl hover:shadow-2xl transition-all group relative overflow-hidden`}>
      <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-${color}-500/5 rounded-full group-hover:scale-150 transition-transform duration-700`}></div>
      <div className={`w-14 h-14 rounded-2xl bg-${color}-50 flex items-center justify-center mb-6`}>
        <Icon className={`w-7 h-7 text-${color}-600`} />
      </div>
      <h3 className="text-2xl font-black text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">{desc}</p>
      
      <button
        onClick={() => handleForceSet(plan)}
        disabled={!!loading}
        className={`w-full py-4 rounded-2xl bg-${color}-600 hover:bg-${color}-700 text-white font-bold transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-${color}-200`}
      >
        {loading === plan ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
        Kích hoạt {title}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-full text-xs font-black uppercase tracking-widest mb-4">
            <Shield className="w-3.5 h-3.5" /> Development Mode Only
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-4">
            Debug Subscriptions
          </h1>
          <p className="text-slate-500 font-medium text-lg max-w-lg mx-auto">
            Công cụ thay đổi trạng thái gói cước siêu tốc dành cho nhà phát triển.
          </p>
        </div>

        <div className="bg-white p-8 rounded-[3rem] shadow-xl shadow-slate-200 border border-slate-100 mb-10">
          <label className="block text-sm font-bold text-slate-600 mb-3 ml-2">Target Email</label>
          <div className="relative group">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-momo-pink transition-colors" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-16 pl-14 pr-6 rounded-2xl border border-slate-200 focus:border-momo-pink focus:ring-4 focus:ring-momo-pink/5 outline-none transition-all font-bold text-slate-800 text-lg shadow-sm"
              placeholder="nhập email..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <PlanCard
            plan="LITE"
            title="Gói LITE"
            desc="5 tin thường, 2 tin VIP. Phù hợp cho doanh nghiệp nhỏ (SME)."
            icon={Zap}
            color="indigo"
          />
          <PlanCard
            plan="GROWTH"
            title="Gói GROWTH"
            desc="20 tin thường, 10 tin VIP, 3 tin Tuyển gấp. Full tính năng AI."
            icon={Crown}
            color="amber"
          />
        </div>

        <div className="mt-12 flex justify-center">
          <button
            onClick={() => handleForceSet('FREE')}
            disabled={!!loading}
            className="flex items-center gap-3 px-10 py-5 rounded-3xl bg-slate-800 hover:bg-slate-900 text-white font-black text-lg transition-all active:scale-95 shadow-xl shadow-slate-300"
          >
            {loading === 'FREE' ? <Loader2 className="w-6 h-6 animate-spin" /> : <RotateCcw className="w-6 h-6" />}
            Reset về FREE Account
          </button>
        </div>

        <div className="mt-20 p-8 glass-morphism rounded-[2.5rem] border border-white/50 text-center">
          <p className="text-slate-500 font-bold text-sm">
            Ghi chú: API này chỉ hoạt động khi <code className="bg-slate-100 px-2 py-1 rounded text-rose-500">NODE_ENV !== 'production'</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
