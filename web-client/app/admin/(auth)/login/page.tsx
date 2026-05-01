"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { getDashboardByRole } from "@/lib/roleRedirect";
import { checkIsAdmin } from "@/lib/admin-auth";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isInitialized, user } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-redirect if already logged in as admin — only after auth check is done
  useEffect(() => {
    if (!isInitialized) return;
    if (isAuthenticated && checkIsAdmin(user)) {
      router.replace(getDashboardByRole("ADMIN"));
    }
  }, [isInitialized, isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const loggedInUser = await login({ email, password });
      
      if (checkIsAdmin(loggedInUser)) {
        router.replace(getDashboardByRole("ADMIN"));
      } else {
        setError("Tài khoản của bạn không có đặc quyền quản trị hệ thống.");
        setIsSubmitting(false);
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại.";
      setError(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row font-sans text-slate-300">
      {/* Left Column: Branding & Value Props */}
      <div className="hidden md:flex md:w-5/12 lg:w-1/2 bg-slate-900 relative overflow-hidden flex-col border-r border-slate-800">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-indigo-900/40 via-slate-900 to-slate-950" />
        <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-indigo-600/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col justify-end h-full p-12 lg:p-20 pb-24">
          <Link href="/" className="flex items-center gap-2 mb-8 inline-flex">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">Workly Admin</span>
          </Link>

          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Hệ thống Quản trị, <br />
            <span className="text-indigo-400 font-extrabold">Kiểm soát toàn diện.</span>
          </h1>
          <p className="text-slate-400 text-lg mb-8 max-w-md">
            Trung tâm điều hành nền tảng Workly. Chỉ dành cho nhân sự có thẩm quyền.
          </p>

          <div className="flex items-center gap-3 bg-slate-800/50 backdrop-blur-md p-4 rounded-xl border border-slate-700/50 w-fit">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span className="font-semibold text-slate-200">Giám sát và vận hành hệ thống</span>
          </div>

          <div className="mt-8 text-sm text-slate-500 font-medium italic">
            © 2026 Workly – Nền tảng kết nối thực tập sinh.
          </div>
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="w-full md:w-7/12 lg:w-1/2 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-24 xl:px-32 relative bg-white md:bg-transparent">
        <div className="w-full max-w-md mx-auto md:mx-0">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900 md:text-white mb-3">Đăng nhập Quản trị</h2>
            <p className="text-slate-500 md:text-slate-400">Vui lòng cung cấp mật khẩu để xác minh danh tính</p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 md:text-red-400 text-sm flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 md:text-slate-300 ml-1">Email quản trị</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@workly.com"
                  className="w-full bg-white md:bg-slate-900 border border-slate-300 md:border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-slate-900 md:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-semibold text-slate-700 md:text-slate-300">Mật khẩu</label>
                <Link href="/forgot-password" hidden className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors">Quên mật khẩu?</Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Tối thiểu 8 ký tự"
                  className="w-full bg-white md:bg-slate-900 border border-slate-300 md:border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-slate-900 md:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Đăng nhập Hệ thống <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100 md:border-slate-800 text-center">
            <p className="text-slate-600 md:text-slate-500 text-sm italic">
              Khu vực giới hạn quyền truy cập nội bộ.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
