'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Star, Zap, Crown, ArrowRight, Clock, Plus, Loader2, Wallet as WalletIcon, X } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useWalletStore } from '@/stores/wallet';
import { useConfirm } from '@/components/ConfirmDialog';

function TopUpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  if (!isOpen) return null;

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Vui lòng nhập số lượng xu hợp lệ');
      return;
    }
    setProcessing(true);
    try {
      const { data } = await api.post('/wallets/top-up', { amount: numAmount });
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.success('Giao dịch tạo thành công!');
        onClose();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tạo link thanh toán');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-600" /> Nạp tiền vào ví
          </h3>
          <form onSubmit={handleTopUp} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-600 mb-2 block">Số lượng Xu cần nạp</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Xu</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ví dụ: 1000"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-semibold text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[100, 500, 1000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val.toString())}
                  className="px-4 py-2 border border-indigo-100 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 text-indigo-700 font-semibold transition-colors text-sm"
                >
                  {val}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={processing || !amount}
              className="w-full pt-2 mt-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <WalletIcon className="w-5 h-5" />}
              Tiến hành thanh toán
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const plans = [
  {
    id: 'LITE',
    name: 'Gói LITE',
    icon: <Zap className="w-6 h-6 text-blue-500" />,
    price: '450.000đ',
    credits: 450,
    description: 'Phù hợp cho công ty nhỏ, nhu cầu tuyển dụng vừa phải.',
    benefits: [
      'Đăng 10 Tin BASIC',
      'Đăng 5 Tin VIP & 2 Tin URGENT',
      'Mở khóa AI Report Dashboard',
      'Tiết kiệm cực sốc cho Khách hàng trải nghiệm',
    ],
    popular: false,
    theme: 'blue',
  },
  {
    id: 'GROWTH',
    name: 'Gói GROWTH',
    icon: <Crown className="w-6 h-6 text-amber-500" />,
    price: '2.000.000đ',
    credits: 2000,
    description: 'Dành cho doanh nghiệp cần đẩy mạnh tuyển dụng nhanh.',
    benefits: [
      'Đăng 5 Tin VIP chuyên nghiệp',
      'Đăng 2 Tin URGENT Tuyển gấp',
      'Mở khóa AI Report Dashboard',
      'Auto-refresh tin sau 48h',
      'Tiết kiệm 30% chi phí',
    ],
    popular: true,
    theme: 'amber',
  },
];

export default function PlansPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const fetchWallet = useWalletStore((state) => state.fetchWallet);
  const confirm = useConfirm();

  useEffect(() => {
    fetchCurrentSubscription();
  }, []);

  const fetchCurrentSubscription = async () => {
    try {
      const response = await api.get('/subscriptions/current');
      setCurrentSubscription(response.data);
    } catch (error) {
      console.error('Failed to fetch subscription', error);
    }
  };

  const handleBuyPlan = async (planId: string) => {
    const planDetails = plans.find(p => p.id === planId);
    if (!planDetails) return;

    if (currentSubscription && new Date(currentSubscription.expiryDate) > new Date()) {
      if (currentSubscription.planType !== planId) {
        const ok = await confirm({
          title: `Thay đổi sang Gói ${planId}?`,
          message: `Bạn đang còn hạn sử dụng gói ${currentSubscription.planType}. Việc mua gói ${planId} sẽ thay thế quyền lợi và làm mới hạn mức của gói cũ. Bạn có chắc chắn?`,
          confirmText: 'Tiến hành',
          variant: 'warning',
        });
        if (!ok) return;
      } else {
        const ok = await confirm({
          title: `Gia hạn Gói ${planId}?`,
          message: `Mua thêm gói này sẽ làm mới 30 ngày sử dụng từ hôm nay và reset toàn bộ bài đăng. Bạn muốn tiếp tục?`,
          confirmText: 'Xác nhận',
          variant: 'info',
        });
        if (!ok) return;
      }
    } else {
      const ok = await confirm({
        title: `Mua ${planDetails.name}?`,
        message: `Xác nhận mua ${planDetails.name} với giá ${planDetails.credits} xu (${planDetails.price}) từ ví của bạn.`,
        confirmText: 'Mua ngay',
        variant: 'success',
      });
      if (!ok) return;
    }

    try {
      setLoading(planId);
      await api.post('/subscriptions/buy', { planType: planId });
      toast.success(`Đăng ký thành công ${planId === 'LITE' ? 'Gói LITE' : 'Gói GROWTH'}!`);
      await fetchWallet();
      await fetchCurrentSubscription();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại';
      const msgStr = typeof message === 'string' ? message : message[0];
      if (msgStr.toLowerCase().includes('không đủ') || msgStr.toLowerCase().includes('nạp thêm')) {
        toast.error('Số dư của bạn không đủ. Vui lòng nạp thêm Xu để tiếp tục!');
        setIsTopUpModalOpen(true);
      } else {
        toast.error(msgStr);
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-4">
          Nâng cấp Giải pháp Tuyển dụng
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Lựa chọn gói phù hợp để tối ưu chi phí và tăng tốc độ tìm kiếm ứng viên tài năng cho công ty bạn.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan) => {
          const isActive =
            currentSubscription?.planType === plan.id &&
            new Date(currentSubscription.expiryDate) > new Date();

          return (
            <div
              key={plan.id}
              className={`bg-white rounded-3xl p-8 border-2 transition-all duration-300 relative ${
                isActive
                  ? 'border-indigo-500 shadow-xl ring-4 ring-indigo-500/20'
                  : plan.popular
                    ? 'border-amber-400 shadow-2xl shadow-amber-200/40 relative transform md:-translate-y-4 md:scale-105'
                    : 'border-slate-200 shadow-lg hover:shadow-xl'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white font-bold px-6 py-1.5 rounded-full text-sm flex items-center gap-1.5 z-10 shadow-lg shadow-indigo-600/30">
                  <Check className="w-4 h-4" />
                  Bạn Đang Dùng Gói Này
                </div>
              )}
              {plan.popular && !isActive && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold px-6 py-1.5 rounded-full text-sm shadow-lg shadow-amber-500/30 flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-current" />
                Khuyên Dùng
              </div>
            )}

            <div className="flex items-center gap-4 mb-6">
              <div
                className={`p-3 rounded-2xl ${
                  plan.theme === 'blue' ? 'bg-blue-50' : 'bg-amber-50'
                }`}
              >
                {plan.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                <p className="text-slate-500 text-sm">{plan.description}</p>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-end gap-2">
                <span className="text-3xl font-extrabold text-slate-900">{plan.price}</span>
                <span className="text-slate-500 mb-1 font-medium">/ tháng</span>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {plan.benefits.map((benefit, i) => (
                <div key={i} className="flex gap-3 text-slate-700 font-medium">
                  <div
                    className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      plan.theme === 'blue'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-amber-100 text-amber-600'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  </div>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

              <button
                onClick={() => handleBuyPlan(plan.id)}
                disabled={loading === plan.id}
                className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                  isActive
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    : plan.theme === 'blue'
                      ? 'bg-slate-900 text-white hover:bg-slate-800'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 hover:opacity-90'
                } ${loading === plan.id ? 'opacity-70 cursor-not-allowed' : 'active:scale-[0.98]'}`}
              >
                {loading === plan.id ? 'Đang xử lý...' : isActive ? 'Gia hạn gói' : 'Mua gói ngay'}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
              
              {isActive && (
                <p className="mt-4 text-center text-[13px] text-slate-500 flex items-center justify-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Còn hạn tới {new Date(currentSubscription.expiryDate).toLocaleDateString('vi-VN')}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-20 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">Nhu cầu Mở khóa ứng viên?</h2>
        <p className="text-slate-500 text-center mb-8">Tiết kiệm lớn với các gói mở khóa riêng lẻ (Không cần mua gói tháng)</p>
        
        <div className="grid md:grid-cols-2 gap-6">
          {[{ id: 'XEM_NHANH', name: 'Gói "Xem Nhanh"', price: '150.000', xuPrice: 150, quota: 6, subtitle: 'Mua 5 tặng 1' },
            { id: 'SAN_TAI', name: 'Gói "Săn Tài"', price: '400.000', xuPrice: 400, quota: 20, subtitle: 'Giá cực hời cho HR' }
          ].map(pack => (
            <div key={pack.id} className="bg-white border rounded-2xl p-6 flex flex-col justify-between hover:shadow-lg transition-all">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{pack.name}</h3>
                <p className="text-sm text-green-600 font-medium">{pack.subtitle}</p>
                <div className="my-4">
                  <span className="text-3xl font-black text-slate-900">{pack.price}</span>
                  <span className="text-slate-500 font-medium ml-1">VNĐ</span>
                </div>
                <p className="text-slate-600 mb-6 flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-500" /> Nhận ngay <strong className="text-slate-900">{pack.quota} lượt</strong> mở CV
                </p>
              </div>
              <button
                disabled={loading === pack.id}
                onClick={async () => {
                  const ok = await confirm({
                    title: `Mua ${pack.name}?`,
                    message: `Xác nhận mua ${pack.name} với giá ${pack.xuPrice} xu (${pack.price} VNĐ) từ ví của bạn.`,
                    confirmText: 'Mua ngay',
                    variant: 'success',
                  });
                  if (!ok) return;
                  try {
                    setLoading(pack.id);
                    await api.post('/subscriptions/buy-cv-hunter', { packageType: pack.id });
                    toast.success(`Đăng ký thành công ${pack.name}!`);
                    await fetchWallet();
                  } catch (error: any) {
                    const message = error.response?.data?.message || 'Có lỗi xảy ra';
                    const msgStr = typeof message === 'string' ? message : message[0];
                    if (msgStr.toLowerCase().includes('không đủ') || msgStr.toLowerCase().includes('nạp thêm')) {
                      toast.error('Số dư của bạn không đủ. Vui lòng nạp thêm Xu để tiếp tục!');
                      setIsTopUpModalOpen(true);
                    } else {
                      toast.error(msgStr);
                    }
                  } finally {
                    setLoading(null);
                  }
                }}
                className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl transition-colors"
               >
                 {loading === pack.id ? 'Đang giao dịch...' : 'Mua ngay'}
               </button>
            </div>
          ))}
        </div>
      </div>
      <TopUpModal isOpen={isTopUpModalOpen} onClose={() => setIsTopUpModalOpen(false)} />
    </div>
  );
}
