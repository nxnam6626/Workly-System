"use client";

import React, { useState, useMemo } from "react";
import { 
  Lock, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Shield,
  KeyRound,
  Fingerprint,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ProfileSidebar } from "@/components/candidates/ProfileSidebar";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [loading, setLoading] = useState(false);
  const { logout } = useAuthStore();
  const router = useRouter();

  const passwordStrength = useMemo(() => {
    const pass = formData.newPassword;
    if (!pass) return 0;
    let strength = 0;
    if (pass.length >= 8) strength += 25;
    if (/[A-Z]/.test(pass)) strength += 25;
    if (/[0-9]/.test(pass)) strength += 25;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 25;
    return strength;
  }, [formData.newPassword]);

  const getStrengthColor = (score: number) => {
    if (score <= 25) return "bg-red-500";
    if (score <= 50) return "bg-amber-500";
    if (score <= 75) return "bg-blue-500";
    return "bg-emerald-500";
  };

  const getStrengthLabel = (score: number) => {
    if (score <= 25) return "Y?u";
    if (score <= 50) return "Trung bình";
    if (score <= 75) return "Khá";
    return "M?nh";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("M?t kh?u xác nh?n không kh?p!");
      return;
    }

    if (passwordStrength < 50) {
      toast.error("M?t kh?u quá y?u! Vui lòng s? d?ng m?t kh?u m?nh hon.");
      return;
    }

    setLoading(true);
    try {
      await api.patch("/auth/change-password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      
      toast.success("Ð?i m?t kh?u thành công!");
      
      // Optional security measure: logout after 2 seconds
      setTimeout(() => {
        toast("Phiên dang nh?p dã h?t h?n. Vui lòng dang nh?p l?i v?i m?t kh?u m?i.", { icon: "??" });
        logout();
        router.push("/login");
      }, 2000);
      
    } catch (error: any) {
      const msg = error.response?.data?.message || "Ðã có l?i x?y ra. Vui lòng th? l?i.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] pt-24 pb-20 font-sans">
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <ProfileSidebar />
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl"
            >
              <div className="mb-10 space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-600 text-[10px] font-black uppercase tracking-widest mb-4">
                  <Fingerprint className="w-3 h-3" />
                  Security Center
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  Ð?i m?t kh?u <Sparkles className="w-8 h-8 text-blue-500" />
                </h1>
                <p className="text-slate-500 font-medium">B?o m?t tài kho?n c?a b?n b?ng cách c?p nh?t m?t kh?u d?nh k?.</p>
              </div>

              <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 p-8 md:p-12 relative overflow-hidden">
                {/* Decorative background circle */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 opacity-10 rounded-full translate-x-1/2 -translate-y-1/2" />
                
                <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                  
                  {/* Current Password */}
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-slate-400" />
                      M?t kh?u hi?n t?i
                    </label>
                    <div className="relative group">
                      <input
                        type={showOld ? "text" : "password"}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-medium pr-14"
                        placeholder="••••••••"
                        required
                        value={formData.currentPassword}
                        onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                      />
                      <button
                        type="button"
                        onClick={() => setShowOld(!showOld)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        {showOld ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <hr className="border-slate-50" />

                  {/* New Password */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <Lock className="w-4 h-4 text-slate-400" />
                        M?t kh?u m?i
                      </label>
                      <div className="relative group">
                        <input
                          type={showNew ? "text" : "password"}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-medium pr-14"
                          placeholder="Nh?p m?t kh?u m?i"
                          required
                          value={formData.newPassword}
                          onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNew(!showNew)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Password Strength Indicator */}
                    {formData.newPassword && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-3"
                      >
                        <div className="flex justify-between items-center px-1">
                          <span className="text-xs font-bold text-slate-400">Ð? m?nh: <b className="text-slate-900">{getStrengthLabel(passwordStrength)}</b></span>
                          <span className="text-xs font-black text-blue-600">{passwordStrength}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            className={`h-full ${getStrengthColor(passwordStrength)}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${passwordStrength}%` }}
                            transition={{ type: "spring", stiffness: 50 }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium italic">
                          M?o: S? d?ng ít nh?t 8 ký t?, bao g?m c? ch? hoa, ch? thu?ng, s? và ký t? d?c bi?t.
                        </p>
                      </motion.div>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-slate-400" />
                        Xác nh?n m?t kh?u m?i
                      </label>
                      <div className="relative group">
                        <input
                          type={showConfirm ? "text" : "password"}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-medium pr-14"
                          placeholder="Nh?p l?i m?t kh?u m?i"
                          required
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-red-500 px-1 pt-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          M?t kh?u xác nh?n không kh?p
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      type="submit"
                      disabled={loading || passwordStrength < 50}
                      className="w-full bg-slate-900 text-white font-black py-5 rounded-[24px] hover:bg-blue-600 shadow-2xl shadow-slate-200 hover:shadow-blue-200 transition-all flex items-center justify-center gap-3 group active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          XÁC NH?N Ð?I M?T KH?U
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Security Banner Card */}
              <div className="mt-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[32px] p-8 text-white flex flex-col md:flex-row items-center gap-8 border border-slate-700 shadow-xl">
                 <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-[24px] flex items-center justify-center shrink-0 border border-white/10">
                    <Shield className="w-10 h-10 text-blue-400" />
                 </div>
                 <div className="space-y-2 text-center md:text-left">
                   <h3 className="text-xl font-black">T?i sao b?n nên d?i m?t kh?u?</h3>
                   <p className="text-sm text-slate-400 font-medium leading-relaxed">
                     Vi?c thay d?i m?t kh?u d?nh k? giúp b?o v? tài kho?n kh?i các r?i ro b?o m?t và gi? cho thông tin h? so c?a b?n luôn an toàn trên Workly.
                   </p>
                 </div>
              </div>
            </motion.div>
          </div>
        </div>

      </div>
    </div>
  );
}

