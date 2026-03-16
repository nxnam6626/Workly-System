import Link from "next/link";
import { Sparkles, User, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/auth";

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <nav className="flex items-center justify-between px-6 py-4 md:px-12 bg-white/70 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
      <div className="flex items-center gap-2 cursor-pointer">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
          <Sparkles className="w-5 h-5" />
        </div>
        <span className="text-xl font-bold tracking-tight">Workly</span>
      </div>

      <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-600">
        <Link href="#" className="hover:text-slate-900 transition-colors">Tìm kiếm thực tập</Link>
        <Link href="#" className="hover:text-slate-900 transition-colors">Đánh giá CV AI</Link>
        <Link href="#" className="hover:text-slate-900 transition-colors">Tài nguyên</Link>
        <Link href="#" className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full hover:bg-orange-100 transition-colors">
          <Sparkles className="w-3.5 h-3.5" />
          Tìm kiếm AI
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
              <User className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium">{user?.name || user?.email || "Người dùng"}</span>
            </div>
            <button
              onClick={() => logout()}
              className="flex items-center gap-2 text-slate-600 hover:text-red-600 font-medium transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:block"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 rounded-full text-sm font-semibold bg-[#FF6B2C] text-white hover:bg-[#e85a1f] transition-colors shadow-sm"
            >
              Bắt đầu
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
