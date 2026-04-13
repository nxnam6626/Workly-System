"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/auth";
import { Mail, Lock, Loader2, ArrowRight, Building2, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function EmployerLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading: authLoading, user } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Where to redirect after successful login (supports returning to the
  // page a recruiter was on before their session expired)
  const callbackUrl = searchParams.get("callbackUrl") || "/recruiter/dashboard";

  useEffect(() => {
    if (isAuthenticated && user && user.roles) {
      if (user.roles.includes("RECRUITER")) {
        router.push(callbackUrl);
      } else if (user.roles.includes("CANDIDATE")) {
        // Candidate trying to use the employer portal — send to candidate login
        router.push("/login");
      }
    }
  }, [isAuthenticated, user, router, callbackUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const loggedInUser = await login({ email, password });
      if (loggedInUser.roles?.includes("RECRUITER")) {
        // Respect callbackUrl so the recruiter returns to the page
        // they were on before their session expired
        router.push(callbackUrl);
      } else if (loggedInUser.roles?.includes("CANDIDATE")) {
        setError("Tài khoản của bạn không có quyền truy cập cổng Nhà tuyển dụng. Vui lòng đăng nhập tại trang dành cho Ứng viên.");
        setIsSubmitting(false);
      } else {
        // Unknown role — stay in recruiter context and show dashboard
        router.push("/recruiter/dashboard");
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
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans">
      {/* Left Column: Branding & Value Props */}
      <div className="hidden md:flex md:w-5/12 lg:w-1/2 bg-slate-50 relative overflow-hidden flex-col">

        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col justify-center h-full p-12 lg:p-20 pb-24">
          <Link href="/recruiter/dashboard" className="flex items-center gap-2 mb-8 inline-flex">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <Building2 className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900 drop-shadow-sm">Workly Employer</span>
          </Link>

          <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight drop-shadow-sm">
            Thu hút nhân tài, <br />
            <span className="text-blue-600 font-extrabold">Kiến tạo tương lai.</span>
          </h1>
          <p className="text-slate-700 text-lg mb-8 max-w-md drop-shadow-sm font-medium">
            Nền tảng tuyển dụng thông minh giúp doanh nghiệp tiếp cận đúng ứng viên tiềm năng một cách nhanh chóng và hiệu quả.
          </p>

          <div className="space-y-4 max-w-sm">
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-slate-200/50 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-semibold text-slate-800">Đăng tin tuyển dụng miễn phí & nhanh chóng</span>
            </div>
          </div>

          <div className="mt-8 text-sm text-slate-500 font-medium italic">
            © 2026 Workly – Nền tảng kết nối thực tập sinh.
          </div>
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="w-full md:w-7/12 lg:w-1/2 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-24 xl:px-32 bg-white relative">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center gap-2 mb-10 mt-8">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Building2 className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">Workly Employer</span>
        </div>

        <div className="w-full max-w-md mx-auto md:mx-0">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Đăng nhập Doanh nghiệp</h2>
            <p className="text-slate-500 text-base">Vui lòng đăng nhập để bắt đầu tìm kiếm ứng viên của bạn</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                <span>{error}</span>
              </div>
              {error.toLowerCase().includes("khóa") && (
                <Link
                  href="/support?subject=Khiếu nại tài khoản bị khóa"
                  className="mt-1 ml-3.5 inline-flex font-bold underline hover:text-red-700 transition-colors"
                >
                  Liên hệ Admin để được hỗ trợ
                </Link>
              )}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 group">
              <label className="text-sm font-semibold text-slate-700 ml-1">Email làm việc</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="VD: hr@congty.com"
                  className="w-full bg-white border border-slate-300 rounded-xl py-3.5 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium sm:text-sm"
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-semibold text-slate-700">Mật khẩu</label>
                <Link href="/forgot-password" title="Quên mật khẩu?" className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">Quên mật khẩu?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Nhập mật khẩu"
                  className="w-full bg-white border border-slate-300 rounded-xl py-3.5 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium sm:text-sm"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white font-semibold rounded-xl py-4 px-4 mt-2 transition-all hover:bg-blue-700 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ height: '48px' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  Đăng nhập
                  <ArrowRight className="w-5 h-5 ml-1" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100">
            <p className="text-center text-slate-600 text-sm">
              Chưa có tài khoản Nhà tuyển dụng?{" "}
              <Link href="/recruiter/register" className="font-bold text-blue-600 hover:text-blue-700 transition-colors">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
