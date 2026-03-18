"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { Mail, Lock, User, Loader2, Briefcase, CheckCircle2, Sparkles, AlertCircle } from "lucide-react";
import { getDashboardByRole } from "@/lib/roleRedirect";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, isLoading: authLoading } = useAuthStore();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push(getDashboardByRole("CANDIDATE"));
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      return setError("Mật khẩu không khớp");
    }

    setIsSubmitting(true);

    try {
      await register({ fullName, email, password, role: "CANDIDATE" });
      router.push(getDashboardByRole("CANDIDATE"));
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.");
      setIsSubmitting(false);
    }
  };

  if (authLoading && !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans">
      {/* Left Column: Branding & Value Props (Hidden on mobile) */}
      <div className="hidden md:flex md:w-5/12 lg:w-1/2 bg-[#F3F5F7] flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-10 left-0 w-80 h-80 bg-indigo-100 rounded-full blur-3xl opacity-60 translate-y-1/4 -translate-x-1/4" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 mb-16 inline-flex">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">Workly</span>
          </Link>

          <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
            Tiếp lợi thế <br />
            <span className="text-blue-600">kết nối tương lai.</span>
          </h1>
          <p className="text-slate-600 text-lg mb-10 max-w-md">
            Tìm việc làm nhanh chóng, dễ dàng và phù hợp nhất với năng lực của bạn.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-blue-600 shrink-0 mt-1">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-lg">Hàng ngàn việc làm uy tín</h3>
                <p className="text-slate-500 text-sm mt-1 leading-relaxed">Được cập nhật mỗi ngày từ các doanh nghiệp hàng đầu.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-blue-600 shrink-0 mt-1">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-lg">Tìm việc thông minh bằng AI</h3>
                <p className="text-slate-500 text-sm mt-1 leading-relaxed">Đề xuất công việc phù hợp với CV và lộ trình sự nghiệp.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-12 text-sm text-slate-500 font-medium">
          © 2024 Workly. Bệ phóng sự nghiệp.
        </div>
      </div>

      {/* Right Column: Registration Form */}
      <div className="w-full md:w-7/12 lg:w-1/2 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-24 xl:px-32 bg-white relative">
        {/* Mobile Header (Only visible on small screens) */}
        <div className="md:hidden flex items-center gap-2 mb-12">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">Workly</span>
        </div>

        <div className="w-full max-w-md mx-auto md:mx-0">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Đăng ký tài khoản mới</h2>
            <p className="text-slate-500 text-base">Cùng xây dựng một hồ sơ nổi bật và nhận được các cơ hội sự nghiệp lý tưởng</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 flex items-start gap-3 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Họ và tên</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Nhập họ và tên của bạn"
                  className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email cá nhân</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Nhập email của bạn"
                  className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Mật khẩu từ 6 đến 32 ký tự"
                  className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Xác nhận mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Nhập lại mật khẩu"
                  className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors sm:text-sm"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Đang đăng ký...
                  </>
                ) : (
                  "Đăng ký"
                )}
              </button>
            </div>
            
            <p className="text-sm text-slate-500 text-center mt-6">
              Bằng việc đăng ký, bạn đã đồng ý với Workly về{" "}
              <Link href="#" className="font-semibold text-blue-600 hover:text-blue-500">Quy định bảo mật</Link> và{" "}
              <Link href="#" className="font-semibold text-blue-600 hover:text-blue-500">Điều khoản dịch vụ</Link>.
            </p>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-200">
            <p className="text-center text-sm text-slate-600">
              Bạn đã có tài khoản?{" "}
              <Link href="/login" className="font-bold text-blue-600 hover:text-blue-500 transition-colors">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
