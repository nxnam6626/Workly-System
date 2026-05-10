'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet as WalletIcon, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight, 
  History, 
  Loader2, 
  Sparkles, 
  Plus, 
  CalendarDays,
  X
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth';
import { ProfilePageShell } from '@/components/candidates/ProfilePageShell';
import { getWalletBalance, getTransactions, topUpWallet } from '@/lib/candidate-wallet-api';

export default function CandidateWalletPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const isLookingForJob = user?.candidate?.isOpenToWork ?? false;
  const [topupAmount, setTopupAmount] = useState<string>('50000');
  const [processing, setProcessing] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  // Initial status checks from callback
  useEffect(() => {
    const status = searchParams.get('payment');
    if (status === 'SUCCESS') {
      toast.success('Nạp tiền thành công!');
      router.replace('/profile/wallet');
    } else if (status === 'CANCEL') {
      toast.error('Đã hủy quy trình thanh toán.');
      router.replace('/profile/wallet');
    }
  }, [searchParams, router]);

  // SWR fetches
  const { data: walletData, mutate: mutateWallet, isLoading: loadingWallet } = useSWR(
    'candidate-wallet-balance',
    getWalletBalance,
    { revalidateOnFocus: true }
  );

  const { data: transactions = [], mutate: mutateTrans, isLoading: loadingTrans } = useSWR(
    'candidate-transactions',
    () => getTransactions(0, 30),
    { revalidateOnFocus: true }
  );

  const refreshData = () => {
    mutateWallet();
    mutateTrans();
  };

  const handleDirectTopup = async () => {
    const amt = Number(topupAmount);
    if (!amt || amt < 10000) {
      toast.error('Số tiền nạp tối thiểu là 10.000đ');
      return;
    }

    setProcessing(true);
    try {
      const { checkoutUrl } = await topUpWallet(amt);
      setPaymentUrl(checkoutUrl);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tạo link thanh toán.');
    } finally {
      setProcessing(false);
    }
  };

  const calculateDaysLeft = () => {
    if (!walletData?.jobSearchExpiresAt) return 0;
    const diff = new Date(walletData.jobSearchExpiresAt).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const daysLeft = calculateDaysLeft();

  return (
    <ProfilePageShell 
      title={
        <>
          Ví <span className="text-indigo-600">Của Tôi</span>
        </>
      }
      subtitle="Quản lý số dư để duy trì quyền lợi tìm việc nhanh"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT: Cards & Forms */}
        <div className="lg:col-span-1 space-y-6">
          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden"
          >
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <Sparkles className="w-32 h-32" />
             </div>
             <div className="relative z-10">
                <p className="text-indigo-200/80 font-medium text-sm flex items-center gap-2 mb-1">
                  <CreditCard size={14} /> Số dư khả dụng
                </p>
                <div className="text-4xl font-black tracking-tight flex items-end gap-2 mt-1">
                  {loadingWallet ? <Loader2 size={28} className="animate-spin opacity-50" /> : (walletData?.balance || 0).toLocaleString('vi-VN')}
                  <span className="text-lg font-medium text-indigo-200 mb-1.5">VNĐ</span>
                </div>

                <div className="mt-8 pt-5 border-t border-white/10">
                   <div className="flex items-center justify-between">
                     <div>
                        <p className="text-xs text-indigo-200/60">Trạng thái Tìm việc</p>
                        <p className="font-bold text-[13px] mt-0.5">
                          {daysLeft > 0 ? (
                             isLookingForJob ? (
                                <span className="text-emerald-400 flex items-center gap-1">
                                  <CalendarDays size={14} /> Đang hoạt động
                                </span>
                             ) : (
                                <span className="text-amber-400 flex items-center gap-1" title="Gói vẫn còn hạn nhưng bạn đã ẩn hồ sơ">
                                  <CalendarDays size={14} /> Đang tạm ẩn
                                </span>
                             )
                          ) : (
                            <span className="text-slate-400">Chưa kích hoạt</span>
                          )}
                        </p>
                     </div>
                     {daysLeft > 0 && (
                       <div className="bg-white/10 rounded-2xl px-3 py-2 backdrop-blur-sm text-center min-w-[80px]">
                         <span className="block text-xl font-bold leading-none">{daysLeft}</span>
                         <span className="text-[9px] font-bold text-indigo-200 uppercase tracking-wider">Ngày còn lại</span>
                       </div>
                     )}
                   </div>
                </div>
             </div>
          </motion.div>

          {/* Quick Topup Section */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
             <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
               <Plus className="w-5 h-5 text-indigo-600" /> Nạp thêm tiền
             </h3>
             
             <div className="space-y-4">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">VNĐ</span>
                  <input 
                    type="number"
                    className="w-full pl-14 pr-4 py-3.5 bg-slate-50 border-0 rounded-2xl text-base font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    placeholder="20000"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {['20000', '50000', '100000'].map(val => (
                    <button 
                      key={val}
                      onClick={() => setTopupAmount(val)}
                      className={`py-2 text-sm font-bold rounded-xl border transition-all ${topupAmount === val ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {(Number(val)/1000)}k
                    </button>
                  ))}
                </div>

                <button 
                  onClick={handleDirectTopup}
                  disabled={processing}
                  className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {processing ? <Loader2 size={18} className="animate-spin" /> : <WalletIcon size={18} />}
                  Nạp Ngay Qua PayOS
                </button>
             </div>
          </div>
          
        </div>

        {/* RIGHT: Transactions Table */}
        <div className="lg:col-span-2">
           <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col min-h-[500px]">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <History className="text-slate-400" size={20} /> Lịch sử giao dịch
                </h3>
              </div>

              <div className="flex-1 p-2 overflow-auto">
                {loadingTrans ? (
                  <div className="h-64 flex items-center justify-center text-slate-400 gap-2 font-medium">
                    <Loader2 className="animate-spin" size={20} /> Đang lấy dữ liệu...
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                    <History size={48} className="text-slate-200 mb-3" />
                    <p className="font-medium">Chưa có bản ghi giao dịch nào.</p>
                    <p className="text-xs text-slate-400 mt-1">Mọi hoạt động nạp và thanh toán sẽ lưu tại đây.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {transactions.map((tx: any) => {
                       const isDeposit = tx.type === 'DEPOSIT';
                       return (
                         <div key={tx.transactionId} className="flex items-center justify-between p-4 hover:bg-slate-50/80 rounded-2xl transition-all group">
                           <div className="flex items-center gap-4">
                              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${isDeposit ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {isDeposit ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 group-hover:text-indigo-900 transition-colors">
                                  {(tx.description || 'Giao dịch').split('|')[0]}
                                </p>
                                <div className="flex items-center gap-3 mt-1">
                                   <p className="text-[12px] font-medium text-slate-400">
                                     {new Date(tx.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                   </p>
                                   {tx.status !== 'SUCCESS' && (
                                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${
                                        tx.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-100 text-slate-500 border-slate-200'
                                      }`}>
                                        {tx.status === 'PENDING' ? 'Chờ thanh toán' : 'Đã hủy'}
                                      </span>
                                   )}
                                </div>
                              </div>
                           </div>
                           <div className={`text-right font-black text-lg tracking-tight ${isDeposit && tx.status === 'SUCCESS' ? 'text-emerald-600' : 'text-slate-600'}`}>
                             {isDeposit ? '+' : '-'}{tx.amount.toLocaleString()}đ
                           </div>
                         </div>
                       );
                    })}
                  </div>
                )}
              </div>
           </div>
        </div>
      </div>


      {/* Modern Immersive Payment Portal */}
      {paymentUrl && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0f172a]/80 backdrop-blur-md p-0 sm:p-4 md:p-8 animate-in fade-in duration-300">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white w-full max-w-5xl h-full max-h-screen sm:max-h-[90vh] flex flex-col overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] sm:rounded-[28px] border border-white/10 relative"
          >
            {/* Premium Header Blur Pane */}
            <div className="absolute top-0 left-0 right-0 h-16 z-10 px-6 flex items-center justify-between bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                  <CreditCard className="text-white" size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 tracking-tight leading-none mb-1">Thanh toán Workly</h3>
                  <p className="text-[11px] font-medium text-slate-500">Kết nối bảo mật qua PayOS Secure</p>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  setPaymentUrl(null);
                  refreshData();
                }}
                className="group relative px-4 py-2 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-2xl text-xs font-bold text-slate-600 hover:text-rose-600 flex items-center gap-2 transition-all shadow-sm active:scale-[0.98]"
              >
                <span>Đóng và tải lại</span>
                <div className="w-5 h-5 rounded-full bg-white group-hover:bg-rose-100 flex items-center justify-center transition-colors">
                  <X size={12} className="transition-transform group-hover:rotate-90 duration-300" />
                </div>
              </button>
            </div>
            
            {/* Immersive Frame Content with proper top offset for header */}
            <div className="flex-1 w-full pt-16 bg-[#F4F7FA]">
               <iframe 
                 src={paymentUrl}
                 className="w-full h-full border-0 bg-[#F4F7FA]"
                 title="Secure Payment Terminal"
                 allow="payment"
               />
            </div>
          </motion.div>
        </div>
      )}
    </ProfilePageShell>
  );
}
