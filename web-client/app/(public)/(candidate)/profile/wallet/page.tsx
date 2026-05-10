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
import { ProfilePageShell } from '@/components/candidates/ProfilePageShell';
import ActivateJobSearchModal from '@/components/modals/ActivateJobSearchModal';
import { getWalletBalance, getTransactions, topUpWallet } from '@/lib/candidate-wallet-api';

export default function CandidateWalletPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
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
                            <span className="text-emerald-400 flex items-center gap-1">
                              <CalendarDays size={14} /> Đang kích hoạt
                            </span>
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
          
          <button
             onClick={() => setIsModalOpen(true)}
             className="w-full p-5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl text-white font-bold text-center shadow-lg shadow-emerald-500/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles size={20} />
            Kích hoạt/Gia hạn Gói Tìm Việc
          </button>
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

      <ActivateJobSearchModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          refreshData();
        }}
      />

      {/* Payment Iframe Handler */}
      {paymentUrl && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-4xl h-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-white/20"
          >
            <div className="p-4 border-b flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <CreditCard className="text-indigo-600" size={18} />
                 Cổng thanh toán trực tuyến
              </h3>
              <button 
                onClick={() => {
                  setPaymentUrl(null);
                  refreshData();
                }}
                className="px-3 py-1.5 bg-white border rounded-xl text-xs font-bold text-slate-500 flex items-center gap-1 hover:bg-slate-100 shadow-sm"
              >
                Đóng cửa sổ <X size={14} />
              </button>
            </div>
            <div className="flex-1 w-full">
               <iframe 
                 src={paymentUrl}
                 className="w-full h-full border-0"
                 title="PayOS Payment"
               />
            </div>
          </motion.div>
        </div>
      )}
    </ProfilePageShell>
  );
}
