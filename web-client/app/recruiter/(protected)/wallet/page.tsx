'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet as WalletIcon, CreditCard, ArrowUpRight, ArrowDownRight, History, Loader2, Sparkles, Plus, HelpCircle, X, Crown, AlertCircle } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useWalletStore } from '@/stores/wallet';
import { useAuthStore } from '@/stores/auth';


function WalletContent() {
  const { wallet: globalWallet, fetchWallet } = useWalletStore();
  const balance = globalWallet?.balance || 0;
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cvUnlockQuota, setCvUnlockQuota] = useState(0);
  const [cvUnlockQuotaMax, setCvUnlockQuotaMax] = useState(0);
  const [subscription, setSubscription] = useState<any>(null);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const { user } = useAuthStore();
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubject, setSupportSubject] = useState('Hỗ trợ nạp tiền/Giao dịch Recruiter');
  const [sendingSupport, setSendingSupport] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

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
      await fetchWallet(); // Tự động sync với top navbar
      
      setCvUnlockQuota(balanceRes.data.cvUnlockQuota || 0);
      setCvUnlockQuotaMax(balanceRes.data.cvUnlockQuotaMax || 0);
      setTransactions(transRes.data || []);
      setSubscription(balanceRes.data.subscription || null);
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
        setPaymentUrl(data.checkoutUrl);
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

  const resumePayment = async (txId: string) => {
    setProcessing(true);
    try {
      const { data } = await api.post(`/wallets/transactions/${txId}/resume`);
      if (data.checkoutUrl) {
        setPaymentUrl(data.checkoutUrl);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tiếp tục thanh toán');
      fetchWalletData(); // refresh incase it was marked cancelled
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      await api.post('/subscriptions/cancel');
      toast.success('Gói cước của bạn sẽ không được gia hạn và sẽ kết thúc sau khi hết hạn.');
      setShowCancelModal(false);
      fetchWalletData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể hủy gói');
    } finally {
      setCancelling(false);
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) {
      toast.error('Vui lòng nhập vấn đề bạn gặp phải');
      return;
    }
    setSendingSupport(true);
    try {
      await api.post('/support/contact', {
        email: user?.email || '',
        name: user?.recruiter?.company?.companyName || user?.name || user?.email || '',
        subject: supportSubject,
        message: supportMessage
      });
      toast.success('Yêu cầu hỗ trợ đã được gửi. Chúng tôi sẽ xử lý ngay.');
      setShowSupportModal(false);
      setSupportMessage('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể gửi yêu cầu');
    } finally {
      setSendingSupport(false);
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
                <CreditCard className="w-4 h-4" /> Tổng số dư hiện hành
              </p>
              <div className="text-4xl font-bold tracking-tight mb-4 flex items-end gap-2">
                {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : balance.toLocaleString()}
                <span className="text-xl font-medium text-indigo-200 mb-1">Xu</span>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-white/20 mt-6">
                <div className="flex-1">
                  <p className="text-xs text-indigo-100 mb-0.5">Hạng tài khoản</p>
                  <p className="font-bold text-white uppercase flex items-center gap-1.5 flex-wrap">
                    {subscription?.planType ? (
                      <>
                        <Crown className="w-4 h-4 text-amber-300" />
                        Gói {subscription.planType}
                      </>
                    ) : (
                      'Tài khoản Thường'
                    )}
                  </p>
                </div>
                <div className="flex-[0.8] text-right">
                  <p className="text-xs text-indigo-100 mb-0.5">Cập nhật lúc</p>
                  <span className="font-medium text-white text-sm">{new Date().toLocaleTimeString('vi-VN')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Up Form */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" /> Nạp tiền vào ví
              </h3>
              <button 
                type="button"
                onClick={() => setShowSupportModal(true)}
                className="text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1.5 transition-colors"
                title="Gặp rắc rối khi giao dịch? Nhận hỗ trợ"
              >
                <HelpCircle className="w-4 h-4" /> Hỗ trợ
              </button>
            </div>
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

        {/* Right Side: Usage Tracker & Transactions History */}
        <div className="lg:col-span-2 space-y-6">

          {/* Usage Tracker */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" /> Hạn mức sử dụng
              </h3>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* CV Hunter Quota */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-slate-600">🔓 CV Hunter</p>
                  {cvUnlockQuotaMax > 0 ? (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cvUnlockQuota === 0 ? 'bg-rose-100 text-rose-600' :
                        cvUnlockQuota / cvUnlockQuotaMax < 0.3 ? 'bg-amber-100 text-amber-600' :
                          'bg-emerald-100 text-emerald-600'
                      }`}>
                      {cvUnlockQuota === 0 ? 'Hết lượt' : `Còn ${Math.round((cvUnlockQuota / cvUnlockQuotaMax) * 100)}%`}
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-400"></span>
                  )}
                </div>

                <div className="flex items-end gap-1 mb-3">
                  <span className={`text-3xl font-black ${cvUnlockQuota === 0 ? 'text-rose-500' :
                      cvUnlockQuota / Math.max(cvUnlockQuotaMax, 1) < 0.3 ? 'text-amber-500' :
                        'text-emerald-600'
                    }`}>{cvUnlockQuota}</span>
                  <span className="text-slate-400 text-sm mb-1 font-medium">Lượt xem CV</span>
                </div>

                {/* Progress bar
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${cvUnlockQuota === 0 ? 'bg-rose-400' :
                        cvUnlockQuota / Math.max(cvUnlockQuotaMax, 1) < 0.3 ? 'bg-amber-400' :
                          'bg-emerald-500'
                      }`}
                    style={{ width: cvUnlockQuotaMax > 0 ? `${(cvUnlockQuota / cvUnlockQuotaMax) * 100}%` : '0%' }}
                  />
                </div> */}

                <p className="text-xs text-slate-400 mt-2">
                  {cvUnlockQuota === 0 && cvUnlockQuotaMax > 0
                    ? `Hết lượt. Sẽ tính ${subscription && new Date() <= new Date(subscription.expiryDate) ? '30' : '50'} Xu / lượt`
                    : cvUnlockQuota === 0
                      ? 'Mua gói CV Hunter để xem liên hệ miễn phí'
                      : `Còn ${cvUnlockQuota} lượt mở khóa hồ sơ miễn phí`}
                </p>
              </div>

              {/* Monthly Plan */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <p className="text-sm font-bold text-slate-600 mb-3">📋 Gói cước tháng</p>
                {subscription && new Date() <= new Date(subscription.expiryDate) ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">{subscription.planType}</span>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-slate-500">Tin Thường</span>
                        <span className={subscription.usedBasicPosts >= subscription.maxBasicPosts ? 'text-rose-500' : 'text-slate-700'}>
                          {subscription.usedBasicPosts} / {subscription.maxBasicPosts}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${Math.min((subscription.usedBasicPosts / subscription.maxBasicPosts) * 100, 100)}%` }} />
                      </div>
                    </div>
                    {subscription.maxVipPosts > 0 && (
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span className="text-slate-500">Tin VIP Chuyên Nghiệp</span>
                          <span className={subscription.usedVipPosts >= subscription.maxVipPosts ? 'text-rose-500' : 'text-slate-700'}>
                            {subscription.usedVipPosts} / {subscription.maxVipPosts}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-amber-500 h-2 rounded-full transition-all" style={{ width: `${Math.min((subscription.usedVipPosts / subscription.maxVipPosts) * 100, 100)}%` }} />
                        </div>
                      </div>
                    )}
                    {subscription.maxUrgentPosts > 0 && (
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span className="text-slate-500">Tin Tuyển Gấp</span>
                          <span className={subscription.usedUrgentPosts >= subscription.maxUrgentPosts ? 'text-rose-500' : 'text-slate-700'}>
                            {subscription.usedUrgentPosts} / {subscription.maxUrgentPosts}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-rose-500 h-2 rounded-full transition-all" style={{ width: `${Math.min((subscription.usedUrgentPosts / subscription.maxUrgentPosts) * 100, 100)}%` }} />
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-slate-400">Hết hạn: {new Date(subscription.expiryDate).toLocaleDateString('vi-VN')}</p>
                    {subscription.isCancelled ? (
                      <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Trạng thái: Đã hủy</p>
                        <p className="text-[11px] text-amber-500 font-medium leading-tight">Gói sẽ tự động kết thúc vào ngày {new Date(subscription.expiryDate).toLocaleDateString('vi-VN')}. Bạn vẫn có thể sử dụng các quyền lợi còn lại.</p>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setShowCancelModal(true)}
                        className="w-full mt-4 py-2.5 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all"
                      >
                        Hủy gói dịch vụ
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col justify-center h-full gap-1">
                    <p className="text-sm font-medium text-slate-500">Chưa đăng ký gói tháng</p>
                    <p className="text-xs text-slate-400">Đăng tin sẽ trừ phí theo từng bài</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex-1 flex flex-col min-h-[400px]">
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
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tx.type === 'DEPOSIT' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                          }`}>
                          {tx.type === 'DEPOSIT' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 flex flex-wrap items-center gap-2">
                            <span>{(tx.description || '').split('|')[0]}</span>
                            {tx.status === 'PENDING' && <span className="text-xs text-amber-500 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Đang chờ xử lý</span>}
                            {tx.status === 'CANCELLED' && <span className="text-xs text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">Đã huỷ</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-xs text-slate-500 font-medium">{new Date(tx.createdAt).toLocaleString('vi-VN')}</p>
                            {tx.status === 'PENDING' && (
                              <button
                                onClick={() => resumePayment(tx.transactionId)}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded hover:underline hover:bg-indigo-100 transition-colors"
                              >
                                Thanh toán tiếp &rarr;
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className={`font-bold text-lg ${tx.type === 'DEPOSIT' && tx.status === 'SUCCESS' ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {tx.type === 'DEPOSIT' ? '+' : '-'}{tx.amount} xu
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
          >
            <button 
              onClick={() => setShowSupportModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-6">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Cần hỗ trợ nạp tiền?</h3>
              <p className="text-sm text-slate-500 mt-1">Mô tả vấn đề bạn gặp phải (ví dụ: đã chuyển khoản nhưng chưa có xu, lỗi thanh toán). Admin sẽ hỗ trợ bạn ngay.</p>
            </div>
            
            <form onSubmit={handleSupportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Chủ đề hỗ trợ</label>
                <select
                  value={supportSubject}
                  onChange={(e) => setSupportSubject(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-medium text-slate-700 appearance-none"
                >
                  <option value="Hỗ trợ nạp tiền/Khuyến mãi">Hỗ trợ nạp tiền/Khuyến mãi</option>
                  <option value="Hỗ trợ mua gói tin/Nâng cấp tài khoản">Hỗ trợ mua gói tin/Nâng cấp tài khoản</option>
                  <option value="Hỗ trợ về duyệt tin tuyển dụng">Hỗ trợ về duyệt tin tuyển dụng</option>
                  <option value="Mở khóa tài khoản">Mở khóa tài khoản</option>
                  <option value="Báo lỗi hệ thống">Báo lỗi hệ thống</option>
                  <option value="Vấn đề khác">Vấn đề khác...</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Chi tiết vấn đề</label>
                <textarea
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Nhập nội dung vấn đề bạn đang gặp phải..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm resize-none"
                  required
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSupportModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={sendingSupport || !supportMessage.trim()}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {sendingSupport && <Loader2 className="w-4 h-4 animate-spin" />}
                  Gửi yêu cầu
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl text-center"
          >
            <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-800">Xác nhận hủy gói?</h3>
            <p className="text-slate-500 mt-4 font-medium leading-relaxed">
              Bạn vẫn có thể tiếp tục sử dụng các quyền lợi và lượt đăng tin còn lại cho đến hết ngày <strong>{new Date(subscription?.expiryDate).toLocaleDateString('vi-VN')}</strong>. Sau thời gian này, gói sẽ không được gia hạn.
            </p>
            <div className="flex flex-col gap-3 mt-8">
              <button
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-lg shadow-rose-200 transition-all flex items-center justify-center gap-2"
              >
                {cancelling ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Xác nhận hủy'}
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className="w-full py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-all"
              >
                Giữ lại gói
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Payment Iframe Modal */}
      {paymentUrl && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 sm:p-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col overflow-hidden relative shadow-2xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                Thanh toán giao dịch
              </h3>
              <p className="text-xs text-amber-600 ml-4 font-medium px-2 py-1 bg-amber-50 rounded hidden sm:block">
                * Nếu gặp màn hình trắng khi hủy (do lỗi giả lập localhost), vui lòng nhấn nút X ở góc phải để đóng.
              </p>
              <button 
                onClick={() => {
                  setPaymentUrl(null);
                  fetchWalletData();
                }}
                className="p-2 hover:bg-slate-200 text-slate-500 rounded-full transition-colors ml-auto flex items-center gap-2 font-semibold"
                title="Đóng"
              >
                Đóng <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 w-full bg-slate-100/50">
              <iframe 
                src={paymentUrl} 
                className="w-full h-full border-none"
                title="Thanh toán"
                allow="payment"
              />
            </div>
          </motion.div>
        </div>
      )}
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
