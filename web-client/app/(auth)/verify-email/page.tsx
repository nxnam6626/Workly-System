"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Loader2, CheckCircle2, XCircle, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Đang xác thực tài khoản của bạn...");
  const hasCalledAPI = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Mã xác thực không hợp lệ hoặc đã bị thiếu.");
      return;
    }

    if (hasCalledAPI.current) return;
    hasCalledAPI.current = true;

    const verifyToken = async () => {
      try {
        // Gọi API sử dụng alias /auth/verify như thiết kế
        const { data } = await api.post("/auth/verify", { token });
        setStatus("success");
        setMessage(data.message || "Xác thực tài khoản thành công!");
        
        // Tự động chuyển hướng sau 3 giây
        setTimeout(() => {
          router.push("/login?verified=true");
        }, 3000);
      } catch (err: any) {
        setStatus("error");
        setMessage(err.response?.data?.message || "Xác thực thất bại. Link có thể đã hết hạn hoặc không hợp lệ.");
      }
    };

    verifyToken();
  }, [token, router]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-12">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">Workly</span>
          </Link>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-10 border border-slate-100 shadow-xl shadow-slate-200/50 text-center"
        >
          {status === "loading" && (
            <div className="space-y-6">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Loader2 className="w-10 h-10 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Đang xác thực</h2>
              <p className="text-slate-500 leading-relaxed font-medium">
                Vui lòng đợi trong giây lát, chúng tôi đang kích hoạt tài khoản của bạn.
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-6">
              <motion.div 
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto"
              >
                <CheckCircle2 className="w-10 h-10" />
              </motion.div>
              <h2 className="text-2xl font-bold text-slate-900">Thành công!</h2>
              <p className="text-slate-600 leading-relaxed">
                {message}
              </p>
              <div className="pt-4 space-y-4">
                <p className="text-sm text-slate-400">Đang chuyển hướng về trang đăng nhập...</p>
                <Link 
                  href="/login" 
                  className="w-full inline-flex items-center justify-center px-6 py-3.5 border border-transparent text-base font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md shadow-blue-200 gap-2"
                >
                  Đăng nhập ngay
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-6">
              <motion.div 
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto"
              >
                <XCircle className="w-10 h-10" />
              </motion.div>
              <h2 className="text-2xl font-bold text-slate-900">Xác thực thất bại</h2>
              <p className="text-slate-600 leading-relaxed">
                {message}
              </p>
              <div className="pt-4 grid grid-cols-1 gap-3">
                <Link 
                  href="/register" 
                  className="w-full inline-flex items-center justify-center px-6 py-3.5 border border-slate-200 text-base font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-all"
                >
                  Đăng ký lại
                </Link>
                <Link 
                  href="/login" 
                  className="w-full inline-flex items-center justify-center px-6 py-3.5 border border-transparent text-base font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
                >
                  Về trang Đăng nhập
                </Link>
              </div>
            </div>
          )}
        </motion.div>

        <p className="text-center mt-12 text-sm text-slate-400 font-medium">
          © 2026 Workly – Nền tảng kết nối thực tập sinh.
        </p>
      </div>
    </div>
  );
}
