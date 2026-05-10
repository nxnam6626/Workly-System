'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, ShieldCheck, Wallet, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { getWalletBalance, topUpWallet, activateJobSearch, CandidateWallet } from '@/lib/candidate-wallet-api';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ActivateJobSearchModal({ isOpen, onClose, onSuccess }: Props) {
  const [wallet, setWallet] = useState<CandidateWallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [topupAmount, setTopupAmount] = useState<number>(50000);
  const ACTIVATION_COST = 20000;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchWallet();
    }
  }, [isOpen]);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const data = await getWalletBalance();
      setWallet(data);
    } catch (error) {
      console.error(error);
      toast.error('Không thể tải thông tin ví.');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!wallet) return;
    if (wallet.balance < ACTIVATION_COST) {
      toast.error('Số dư của bạn không đủ.');
      return;
    }

    setProcessing(true);
    try {
      await activateJobSearch();
      toast.success('Kích hoạt trạng thái tìm việc thành công!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Kích hoạt thất bại. Vui lòng thử lại.');
    } finally {
      setProcessing(false);
    }
  };

  const handleTopup = async () => {
    setProcessing(true);
    try {
      const { checkoutUrl } = await topUpWallet(topupAmount);
      window.location.href = checkoutUrl;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể kết nối cổng thanh toán.');
      setProcessing(false);
    }
  };


  const isShortOnFunds = wallet && wallet.balance < ACTIVATION_COST;

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-white rounded-[28px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] overflow-hidden border border-white/20"
          >
            <button onClick={onClose} className="absolute top-5 right-5 p-2 rounded-xl hover:bg-slate-100 transition-all duration-200 z-10 text-slate-400 hover:text-slate-600 group">
              <X size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>

        <div className="p-6 pt-8">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-indigo-600/20 transform -rotate-3">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Kích hoạt Tìm Việc</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-xs">
              Duy trì hồ sơ nổi bật và ứng tuyển mọi vị trí trong vòng 30 ngày.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-100">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-slate-600">Mức phí (30 ngày)</span>
              <span className="font-bold text-indigo-600 text-lg">20.000đ</span>
            </div>
            <div className="h-px bg-slate-200/50 w-full my-2"></div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-slate-400" /> Số dư ví hiện tại
              </span>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              ) : (
                <span className={`font-semibold ${isShortOnFunds ? 'text-red-500' : 'text-emerald-600'}`}>
                  {wallet ? wallet.balance.toLocaleString('vi-VN') : '0'}đ
                </span>
              )}
            </div>
          </div>

          {wallet && isShortOnFunds ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Số dư ví của bạn không đủ {ACTIVATION_COST.toLocaleString('vi-VN')}đ. Vui lòng nạp thêm để tiếp tục.</span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 mb-2 block">CHỌN MỆNH GIÁ NẠP</label>
                <div className="grid grid-cols-3 gap-2">
                  {[20000, 50000, 100000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setTopupAmount(amount)}
                      className={`p-2.5 text-sm rounded-xl border font-medium transition-all ${
                        topupAmount === amount 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' 
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {amount / 1000}k
                    </button>
                  ))}
                </div>
              </div>

              <button
                disabled={processing}
                onClick={handleTopup}
                className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20 disabled:opacity-70"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard size={18} />}
                Nạp tiền qua PayOS
              </button>
            </div>
          ) : (
            <button
              disabled={processing || loading}
              onClick={handleActivate}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-xl shadow-indigo-600/25 disabled:opacity-70 hover:shadow-lg active:scale-[0.98]"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 size={18} />}
              Thanh toán 20.000đ
            </button>
          )}

          <p className="text-[11px] text-center text-slate-400 mt-6">
            Bằng việc thanh toán, bạn đồng ý với điều khoản sử dụng của Workly. 
            Hồ sơ sẽ được gắn thẻ Ưu Tiên tự động.
          </p>
        </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
