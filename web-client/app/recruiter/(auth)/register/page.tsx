"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { Mail, Lock, Loader2, Building2, User, Phone, MapPin, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { getDashboardByRole } from "@/lib/roleRedirect";
import Link from "next/link";
import Image from "next/image";

// Placeholder data for provinces
const PROVINCES = [
  "Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ",
  "Bình Dương", "Đồng Nai", "Bắc Ninh", "Khánh Hòa", "Quảng Ninh",
  "Khác"
];

export default function EmployerRegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, isLoading: authLoading } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [taxCode, setTaxCode] = useState("");
  
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push(getDashboardByRole("RECRUITER"));
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password || !companyName || !phone || !fullName || !location) {
        return setError("Vui lòng điền đầy đủ các thông tin bắt buộc (*).");
    }

    setIsSubmitting(true);

    try {
      await register({ 
          email, 
          password, 
          fullName, 
          role: "RECRUITER",
          companyName,
          phone,
          location,
          taxCode
      });
      setIsSuccess(true);
      setTimeout(() => {
        router.push(getDashboardByRole("RECRUITER"));
      }, 2500);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.");
      setIsSubmitting(false);
    }
  };

  if (authLoading && !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans">
      {/* Left Column: Branding & Value Props */}
      <div className="hidden md:flex md:w-4/12 lg:w-5/12 bg-slate-50 relative overflow-hidden flex-col sticky top-0 h-screen">
        <div className="absolute inset-0 z-0">
          <Image
            src="/recruiter-hero-bg-light.png"
            alt="Tuyển dụng thông minh"
            fill
            className="object-cover opacity-90"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/70 to-white/30" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-between h-full p-12 lg:p-16">
          <div>
            <Link href="/recruiter/dashboard" className="flex items-center gap-2 mb-12 inline-flex">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-slate-900 drop-shadow-sm">Workly Employer</span>
            </Link>

            <h1 className="text-4xl font-bold text-slate-900 mb-6 leading-tight drop-shadow-sm">
              Đăng ký tài khoản <br /> Nhà tuyển dụng
            </h1>
            <p className="text-slate-700 text-lg mb-10 max-w-sm drop-shadow-sm font-medium">
              Tìm kiếm và kết nối nhanh chóng với hàng triệu ứng viên tiềm năng trên toàn quốc.
            </p>
          </div>

          <div className="space-y-6 pb-8">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-1">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Tiếp cận nhanh chóng</h3>
                <p className="text-slate-600 text-sm mt-1 leading-relaxed">Hàng ngàn hồ sơ ứng viên chất lượng được cập nhật mỗi ngày.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-1">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Đăng tin dễ dàng</h3>
                <p className="text-slate-600 text-sm mt-1 leading-relaxed">Hệ thống tạo tin tuyển dụng chuyên nghiệp chỉ trong vài phút.</p>
              </div>
            </div>
          </div>

          <div className="pb-8 text-sm text-slate-500 font-medium italic">
            © 2026 Workly – Nền tảng kết nối thực tập sinh.
          </div>
        </div>
      </div>

      {/* Right Column: Registration Form */}
      <div className="w-full md:w-8/12 lg:w-7/12 flex flex-col px-6 py-12 sm:px-12 lg:px-20 xl:px-28 bg-white relative">


        {/* Mobile Header */}
        <div className="md:hidden flex flex-col mb-8 mt-4">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Workly Employer</span>
          </div>
        </div>

        <div className="w-full max-w-2xl mx-auto md:mx-0 pt-4 md:pt-12 pb-12">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Tạo tài khoản mới</h2>
            <p className="text-slate-500 text-base">Điền thông tin doanh nghiệp của bạn để bắt đầu</p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 flex items-start gap-3 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {isSuccess && (
            <div className="mb-8 p-4 bg-emerald-50 flex items-start gap-3 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
              <span>Đăng ký doanh nghiệp thành công! Đang chuyển hướng bạn đến bảng điều khiển...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Row 1: Email & Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email làm việc <span className="text-red-500">*</span></label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    </div>
                    <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    placeholder="VD: hr@congty.com"
                    className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors sm:text-sm"
                    />
                </div>
                </div>

                <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mật khẩu <span className="text-red-500">*</span></label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    </div>
                    <input
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                    placeholder="Tối thiểu 6 ký tự"
                    className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors sm:text-sm"
                    />
                </div>
                </div>
            </div>

            {/* Row 2: Company Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên công ty <span className="text-red-500">*</span></label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                </div>
                <input
                  type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required
                  placeholder="Nhập tên công ty của bạn..."
                  className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors sm:text-sm"
                />
              </div>
            </div>

            {/* Row 3: Phone & Contact Person */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Số điện thoại <span className="text-red-500">*</span></label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    </div>
                    <input
                    type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required
                    placeholder="Nhập số điện thoại"
                    className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors sm:text-sm"
                    />
                </div>
                </div>

                <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Người đăng ký <span className="text-red-500">*</span></label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    </div>
                    <input
                    type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required
                    placeholder="Họ và tên người liên hệ"
                    className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors sm:text-sm"
                    />
                </div>
                </div>
            </div>

            {/* Row 4: Location & Tax Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tỉnh thành làm việc <span className="text-red-500">*</span></label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    </div>
                    <select
                    value={location} onChange={(e) => setLocation(e.target.value)} required
                    className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors sm:text-sm appearance-none"
                    >
                    <option value="" disabled>Chọn tỉnh thành</option>
                    {PROVINCES.map(prov => <option key={prov} value={prov}>{prov}</option>)}
                    </select>
                </div>
                </div>

                <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mã số thuế</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <FileText className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    </div>
                    <input
                    type="text" value={taxCode} onChange={(e) => setTaxCode(e.target.value)}
                    placeholder="Nhập mã số thuế (không bắt buộc)"
                    className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors sm:text-sm"
                    />
                </div>
                </div>
            </div>

            <div className="pt-4">
              <button
                type="submit" disabled={isSubmitting}
                className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    {isSuccess ? "Đang chuyển hướng..." : "Đang đăng ký..."}
                  </>
                ) : "ĐĂNG KÝ MỞ TÀI KHOẢN"}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 mb-10">
            <p className="text-center text-sm text-slate-600">
              Bạn đã có tài khoản doanh nghiệp?{" "}
              <Link href="/recruiter/login" className="font-bold text-blue-600 hover:text-blue-500 transition-colors">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
