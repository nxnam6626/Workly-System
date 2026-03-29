'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { Mail, ShieldCheck, Loader2, Home, ArrowRight, ShieldAlert } from 'lucide-react';
import { StatusBanner } from '@/components/ui/StatusBanner';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const { user, verifyEmail } = useAuthStore();
  
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!email && !user?.email) {
      setErrorStatus('Thông tin người dùng không hợp lệ. Vui lòng quay lại trang chủ.');
      setTimeout(() => router.push('/'), 3000);
    }
  }, [email, user, router]);

  const targetEmail = email || user?.email;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus(null);

    if (otp.length !== 6) {
      setErrorStatus('Mã OTP phải có đúng 6 chữ số!');
      return;
    }

    setIsVerifying(true);
    try {
      await verifyEmail({ email: targetEmail as string, token: otp });
      setIsSuccess(true);
      // Success state is handled by UI transition
    } catch (error: any) {
      setErrorStatus(error.response?.data?.message || 'Xác minh thất bại. Mã OTP không đúng hoặc đã hết hạn.');
      setOtp('');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-slate-50/50">
      <div className="max-w-xl w-full bg-white p-12 rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100 text-center relative overflow-hidden transition-all duration-500">
        
        <StatusBanner 
          type="error" 
          message={errorStatus} 
          onClose={() => setErrorStatus(null)} 
        />

        {isSuccess ? (
          <div className="animate-in zoom-in-95 fade-in duration-700">
            <div className="relative w-32 h-32 mx-auto mb-10">
              <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-25" />
              <div className="relative w-full h-full bg-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-200">
                <ShieldCheck className="w-16 h-16 text-white" />
              </div>
            </div>
            
            <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Tuyệt vời!</h1>
            <p className="text-slate-500 text-lg mb-10 leading-relaxed px-6">
              Email của bạn đã được xác minh thành công. Bây giờ bạn có thể trải nghiệm toàn bộ tính năng của Workly.
            </p>

            <div className="flex flex-col gap-4">
              <Link 
                href="/profile/account"
                className="w-full py-5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl hover:shadow-slate-200 flex items-center justify-center gap-2 group"
              >
                <span>Đến trang cá nhân</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/"
                className="text-slate-500 font-bold hover:text-slate-800 transition-colors"
              >
                Quay về trang chủ
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-10 rotate-3 shadow-inner">
              <Mail className="w-12 h-12 text-blue-600 -rotate-3" />
            </div>
            
            <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Xác minh tài khoản</h1>
            <p className="text-slate-500 text-lg mb-10 leading-relaxed">
              Mã xác minh đã được gửi tới: <br />
              <span className="text-slate-900 font-bold bg-slate-100 px-3 py-1 rounded-lg mt-2 inline-block">
                {targetEmail}
              </span>
            </p>

            <form onSubmit={handleVerify} className="space-y-8 text-left">
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-widest opacity-60">Nhập mã OTP</label>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">6 CHỮ SỐ</span>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-5xl font-black tracking-[1.5rem] px-6 py-8 rounded-[2rem] border-4 border-slate-50 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-100 bg-slate-50/50 shadow-inner"
                  placeholder="000000"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying || otp.length !== 6}
                className="w-full py-5 bg-blue-600 text-white font-black text-lg rounded-[2rem] hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 hover:-translate-y-1 active:translate-y-0 disabled:opacity-30 flex items-center justify-center gap-3 overflow-hidden group"
              >
                {isVerifying ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : (
                  <>
                    <span>Xác nhận danh tính</span>
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-12 pt-8 border-t border-slate-100">
              <div className="bg-slate-50 p-6 rounded-2xl flex items-center gap-4 text-left">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <ShieldAlert className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-medium">Bạn không nhận được mã?</p>
                  <Link href="/profile/account" className="text-blue-600 text-sm font-bold hover:underline">Gửi lại yêu cầu tại đây</Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Decorative elements */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-50/30 rounded-full blur-3xl -z-10" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-slate-100/50 rounded-full blur-3xl -z-10" />
      </div>
    </div>
  );
}
