"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { Loader2 } from "lucide-react";
import { getDashboardByRole } from "@/lib/roleRedirect";

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const refreshToken = searchParams.get("refresh_token");
  const isFirstLoginParam = searchParams.get("is_first_login") === "true";
  const { setOAuthTokens, user } = useAuthStore();
  const [error, setError] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      if (!token || !refreshToken) {
        if (!searchParams.toString()) return; 
        setError("Không nhận được token xác thực từ server.");
        setTimeout(() => router.push("/login"), 3000);
        return;
      }
      
      try {
        await setOAuthTokens(token, refreshToken, isFirstLoginParam);
        // The second useEffect will handle redirection once the user object is updated in the store
      } catch (err) {
        console.error("[OAuth Callback Error]", err);
        setError("Đã xảy ra lỗi khi xác thực hoặc token hết hạn.");
        setTimeout(() => router.push("/login"), 3000);
      }
    };

    handleCallback();
  }, [token, refreshToken, router, setOAuthTokens, searchParams]);

  // Handle redirection based on user role
  useEffect(() => {
    if (user && user.roles && user.roles.length > 0) {
      if (user.roles.includes("CANDIDATE") && user.isFirstLogin) {
        router.push("/onboarding/import-cv");
        return;
      }
      const targetDashboard = getDashboardByRole(user.roles[0]);
      router.push(targetDashboard);
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center max-w-sm w-full">
        {error ? (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-slate-900 mb-2">Lỗi xác thực</h1>
            <p className="text-red-600 text-sm">{error}</p>
            <p className="text-xs text-slate-400 mt-4 italic">Đang quay lại trang đăng nhập...</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Đang xác thực...</h2>
            <p className="text-slate-500 font-medium text-sm">Vui lòng đợi trong giây lát, bạn sẽ được chuyển hướng.</p>
          </div>
        )}
      </div>
    </div>
  );
}
