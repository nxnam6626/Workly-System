"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/auth";
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { getDashboardByRole } from "@/lib/roleRedirect";
import Link from "next/link";
import Image from "next/image";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading, user } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user && user.roles) {
      if (user.roles.includes("ADMIN")) {
        router.push(getDashboardByRole("ADMIN"));
      } else {
        // Not an admin, don't kick them to "/", just show error or let them stay
        setError("Tài khoản hiện tại không có quyền quản trị. Vui lòng đăng xuất và đăng nhập lại bằng tài khoản cấp cao hơn.");
      }
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const loggedInUser = await login({ email, password });
      if (loggedInUser.roles?.includes("ADMIN")) {
        router.push(getDashboardByRole("ADMIN"));
      } else {
        setError("Tài khoản của bạn không có đặc quyền quản trị hệ thống.");
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
      setIsSubmitting(false);
    }
  };

  if (authLoading && !isAuthenticated) {
    return null; 
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row font-sans text-slate-300">
      {/* Left Column: Branding & Value Props */}
      <div className="hidden md:flex md:w-5/12 lg:w-1/2 bg-slate-900 relative overflow-hidden flex-col border-r border-slate-800">
        {/* Background Image/Gradient */}
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-indigo-900/40 via-slate-900 to-slate-950" />
        
        {/* Decorative Circles */}
        <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-indigo-600/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />
        
        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col justify-end h-full p-12 lg:p-20 pb-24">
          <Link href="/" className="flex items-center gap-2 mb-8 inline-flex">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">Workly Admin</span>
          </Link>

          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight drop-shadow-sm">
            Hệ thống Quản trị, <br />
            <span className="text-indigo-400 font-extrabold">Kiểm soát toàn diện.</span>
          </h1>
          <p className="text-slate-400 text-lg mb-8 max-w-md font-medium">
            Trung tâm điều hành nền tảng Workly. Chỉ dành cho nhân sự có thẩm quyền.
          </p>

          <div className="space-y-4 max-w-sm">
            <div className="flex items-center gap-3 bg-slate-800/50 backdrop-blur-md p-4 rounded-xl border border-slate-700/50 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-semibold text-slate-200">Giám sát và vận hành hệ thống</span>
            </div>
          </div>

          <div className="mt-8 text-sm text-slate-500 font-medium italic">
            © 2026 Workly – Nền tảng kết nối thực tập sinh.
          </div>
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="w-full md:w-7/12 lg:w-1/2 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-24 xl:px-32 relative bg-white md:bg-transparent">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center gap-2 mb-10 mt-8">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 md:text-white">Workly Admin</span>
        </div>

        <div className="w-full max-w-md mx-auto md:mx-0">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900 md:text-white mb-3">Đăng nhập Quản trị</h2>
            <p className="text-slate-500 md:text-slate-400 text-base">Vui lòng cung cấp mật khẩu để xác minh danh tính</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 bg-red-50 md:bg-red-500/10 border border-red-200 md:border-red-500/20 rounded-xl text-red-600 md:text-red-400 text-sm flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-600 md:bg-red-400 shrink-0" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 group">
              <label className="text-sm font-semibold text-slate-700 md:text-slate-300 ml-1">Email quản trị</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 md:group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@workly.com"
                  className="w-full bg-white md:bg-slate-900 border border-slate-300 md:border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-slate-900 md:text-white placeholder:text-slate-400 md:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 md:focus:ring-indigo-500/40 focus:border-indigo-500 transition-all font-medium sm:text-sm"
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-semibold text-slate-700 md:text-slate-300">Mật khẩu</label>
                <Link href="/forgot-password" title="Quên mật khẩu?" className="text-xs font-medium text-indigo-600 md:text-indigo-400 hover:text-indigo-700 md:hover:text-indigo-300 transition-colors">Quên mật khẩu?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 md:group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Tối thiểu 8 ký tự"
                  className="w-full bg-white md:bg-slate-900 border border-slate-300 md:border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-slate-900 md:text-white placeholder:text-slate-400 md:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 md:focus:ring-indigo-500/40 focus:border-indigo-500 transition-all font-medium sm:text-sm"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 text-white font-semibold rounded-xl py-4 px-4 mt-2 transition-all hover:bg-indigo-700 shadow-md shadow-indigo-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ height: '48px' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  Đăng nhập Hệ thống
                  <ArrowRight className="w-5 h-5 ml-1" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100 md:border-slate-800">
            <p className="text-center text-slate-600 md:text-slate-500 text-sm">
              Khu vực này giới hạn quyền truy cập nội bộ.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
