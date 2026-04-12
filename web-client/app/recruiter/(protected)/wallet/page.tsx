'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Wallet as WalletIcon, CreditCard, ArrowUpRight, ArrowDownRight, History, Loader2, Sparkles, Plus } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';

function WalletContent() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    fetchWalletData();
  }, []);

  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'SUCCESS') {
      toast.success('Thanh toán thành công!');
      router.replace('/recruiter/wallet');
    } else if (status === 'CANCEL') {
      toast.error('Đã huỷ thanh toán.');
      router.replace('/recruiter/wallet');
    }
  }, [searchParams, router]);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const [balanceRes, transRes] = await Promise.all([
        api.get('/wallets/balance'),
        api.get('/wallets/transactions')
      ]);
      setBalance(balanceRes.data.balance || 0);
      setTransactions(transRes.data || []);
    } catch (error) {
      console.error('Failed to load wallet data', error);
      toast.error('Không thể tải dữ liệu ví');
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(topUpAmount);
    if (!amount || amount <= 0) {
       toast.error('Vui lòng nhập số tiền hợp lệ');
       return;
    }
    setProcessing(true);
    try {
      const { data } = await api.post('/wallets/top-up', { amount });
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.success(`Đã yêu cầu nạp ${amount} xu!`);
        setTopUpAmount('');
        fetchWalletData();
      }
    } catch (error: any) {
      console.error('Top up error:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi nạp tiền');
    } finally {
      setProcessing(false);
    }
  };

  const PresetAmount = ({ amount, label }: { amount: number, label: string }) => (
     <button 
        type="button"
        onClick={() => setTopUpAmount(amount.toString())}
        className="px-4 py-2 border border-indigo-100 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 text-indigo-700 font-semibold transition-colors text-sm"
     >
        {label}
     </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-5xl mx-auto space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <WalletIcon className="h-8 w-8 text-indigo-600" />
            Ví Của Tôi
          </h1>
          <p className="text-slate-500 mt-2">Quản lý số dư xu và lịch sử giao dịch thanh toán.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Balance & TopUp */}
        <div className="lg:col-span-1 space-y-6">
           {/* Balance Card */}
           <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                 <Sparkles className="w-24 h-24" />
              </div>
              <div className="relative z-10">
                 <p className="text-indigo-100 font-medium mb-1 flex items-center gap-2">
                   <CreditCard className="w-4 h-4" /> Tổng số dư hiện có
                 </p>
                 <div className="text-4xl font-bold tracking-tight mb-4 flex items-end gap-2">
                   {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : balance.toLocaleString()} 
                   <span className="text-xl font-medium text-indigo-200 mb-1">Xu</span>
                 </div>
                 
                 <div className="pt-4 border-t border-white/20 mt-6 flex justify-between items-center text-sm">
                    <span className="text-indigo-100">Cập nhật lúc</span>
                    <span className="font-medium text-white">{new Date().toLocaleTimeString('vi-VN')}</span>
                 </div>
              </div>
           </div>

           {/* Top Up Form */}
           <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
             <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" /> Nạp tiền vào ví
             </h3>
             <form onSubmit={handleTopUp} className="space-y-4">
               <div>
                  <label className="text-sm font-semibold text-slate-600 mb-2 block">Số lượng Xu cần nạp</label>
                  <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Xu</span>
                     <input 
                        type="number" 
                        value={topUpAmount}
                        onChange={(e) => setTopUpAmount(e.target.value)}
                        placeholder="Ví dụ: 1000"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-semibold text-slate-800"
                     />
                  </div>
               </div>
               
               <div className="grid grid-cols-3 gap-2">
                  <PresetAmount amount={100} label="100 Xu" />
                  <PresetAmount amount={500} label="500 Xu" />
                  <PresetAmount amount={1000} label="1000 Xu" />
               </div>

               <button 
                 type="submit" 
                 disabled={processing || !topUpAmount}
                 className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
               >
                 {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <WalletIcon className="w-5 h-5" />}
                 Thanh Toán Ngay
               </button>
             </form>
           </div>
        </div>

        {/* Right Side: Transactions History */}
        <div className="lg:col-span-2">
           <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-full flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                 <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <History className="w-5 h-5 text-slate-500" /> Lịch sử giao dịch
                 </h3>
              </div>
              <div className="flex-1 overflow-auto p-2">
                 {loading ? (
                    <div className="flex justify-center items-center h-40 text-slate-400">
                       <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải lịch sử...
                    </div>
                 ) : transactions.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-60 text-slate-400">
                       <History className="w-12 h-12 mb-3 text-slate-200" />
                       <p>Chưa có giao dịch nào.</p>
                       <p className="text-xs mt-1">Lịch sử nạp và trừ tiền sẽ hiển thị ở đây.</p>
                    </div>
                 ) : (
                    <div className="space-y-1">
                       {transactions.map((tx: any) => (
                          <div key={tx.transactionId} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-2xl">
                             <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                   tx.type === 'TOPUP' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                                }`}>
                                   {tx.type === 'TOPUP' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                                </div>
                                <div>
                                   <p className="font-bold text-slate-800">
                                      {tx.description} 
                                      {tx.status === 'PENDING' && <span className="ml-2 text-xs text-amber-500 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Đang chờ xử lý</span>}
                                      {tx.status === 'CANCELLED' && <span className="ml-2 text-xs text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">Đã huỷ</span>}
                                   </p>
                                   <p className="text-xs text-slate-500 font-medium">{new Date(tx.createdAt).toLocaleString('vi-VN')}</p>
                                </div>
                             </div>
                             <div className={`font-bold text-lg ${tx.type === 'TOPUP' && tx.status === 'SUCCESS' ? 'text-emerald-600' : 'text-slate-500'}`}>
                                {tx.type === 'TOPUP' ? '+' : '-'}{tx.amount} xu
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
           </div>
        </div>

      </div>
    </motion.div>
  );
}

export default function WalletPage() {
  return (
    <Suspense fallback={<div>Đang tải ví...</div>}>
      <WalletContent />
    </Suspense>
  );
}
