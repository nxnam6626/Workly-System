"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/auth";
import { Mail, Lock, Loader2, ArrowRight, Sparkles, Briefcase } from "lucide-react";
import { getDashboardByRole } from "@/lib/roleRedirect";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading, user } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user && user.roles) {
      if (user.roles.includes("CANDIDATE")) {
        router.push("/");
      } else if (user.roles.includes("RECRUITER")) {
        // If they are an employer trying to access candidate login, maybe don't redirect automatically
        // but since they are already authenticated, we could redirect to employer dashboard
        // However, the rule is "separate worlds", so staying here with an error is better if they just logged in.
        // But for an existing session, maybe redirecting is fine? 
        // Let's stick to the "two worlds" and guide them.
        router.push("/recruiter/login");
      }
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const loggedInUser = await login({ email, password });
      if (loggedInUser.roles?.includes("CANDIDATE")) {
        router.push("/");
      } else if (loggedInUser.roles?.includes("RECRUITER")) {
        setError("Tài khoản của bạn là tài khoản Nhà tuyển dụng. Vui lòng đăng nhập tại trang dành cho Nhà tuyển dụng.");
        // We might want to logout here to keep the "worlds separate"
        // await logout(true); 
        setIsSubmitting(false);
      } else {
        router.push(getDashboardByRole(loggedInUser.roles?.[0]));
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
        <div className="relative z-10 flex flex-col justify-start h-full p-12 lg:p-20 pb-24">
          <Link href="/" className="flex items-center gap-2 mb-8 inline-flex">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">Workly</span>
          </Link>

          <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight drop-shadow-sm">
            Tiếp lợi thế, <br />
            <span className="text-blue-600 font-extrabold">Kết nối tương lai.</span>
          </h1>
          <p className="text-slate-700 text-lg mb-8 max-w-md font-medium drop-shadow-sm">
            Bệ phóng sự nghiệp giúp bạn tìm kiếm những cơ hội việc làm tốt nhất và phù hợp nhất.
          </p>

          <div className="space-y-4 max-w-sm">
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-slate-200/50 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="font-semibold text-slate-800">Cơ hội việc làm từ các công ty hàng đầu</span>
            </div>
          </div>

          <div className="mt-auto text-sm text-slate-500 font-medium">
            © 2026 Workly – Nền tảng kết nối thực tập sinh.
          </div>
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="w-full md:w-7/12 lg:w-1/2 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-24 xl:px-32 bg-white relative">

        {/* Mobile Header */}
        <div className="md:hidden flex items-center gap-2 mb-10 mt-8">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">Workly</span>
        </div>

        <div className="w-full max-w-md mx-auto md:mx-0">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Chào mừng trở lại</h2>
            <p className="text-slate-500 text-base">Vui lòng đăng nhập để tiếp tục hành trình sự nghiệp</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 group">
              <label className="text-sm font-semibold text-slate-700 ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
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

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-slate-400 font-medium tracking-wider">Hoặc đăng nhập bằng</span>
            </div>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <a 
              href="http://localhost:3001/auth/google"
              className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-semibold text-slate-700 shadow-sm group"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </a>
            <a 
              href="http://localhost:3001/auth/linkedin"
              className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-semibold text-slate-700 shadow-sm group"
            >
              <svg className="w-5 h-5 text-[#0077B5] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
              LinkedIn
            </a>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-100">
            <p className="text-center text-slate-600 text-sm">
              Chưa có tài khoản?{" "}
              <Link href="/register" className="font-bold text-blue-600 hover:text-blue-700 transition-colors">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
