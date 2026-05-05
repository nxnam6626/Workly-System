import React from 'react';
import { motion } from 'framer-motion';
import { Home, MapPin, Crown, Zap, Shield, CheckCircle2, Navigation } from 'lucide-react';
import { JobFormData } from '@/types/job';

interface Step4Props {
  formData: JobFormData;
  setFormData: React.Dispatch<React.SetStateAction<JobFormData>>;
  branches: any[];
  handleBranchToggle: (id: string) => void;
  userPlan: string;
}

export const Step4_JobTier = ({
  formData,
  setFormData,
  branches,
  handleBranchToggle,
  userPlan
}: Step4Props) => {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12 pb-6">
      {/* Branch Selection */}
      <div className="space-y-6">
        <div className="space-y-1 ml-1">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-indigo-500" /> Địa điểm làm việc áp dụng <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-slate-400 font-medium">Chọn các chi nhánh mà vị trí này sẽ làm việc tại đó.</p>
        </div>
        
        {branches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {branches.map(branch => (
              <button
                key={branch.branchId}
                type="button"
                onClick={() => handleBranchToggle(branch.branchId)}
                className={`p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden group shadow-sm ${
                  formData.branchIds.includes(branch.branchId)
                    ? 'border-indigo-600 bg-indigo-50/30'
                    : 'border-slate-100 bg-white hover:border-indigo-200'
                }`}
              >
                <div className="flex items-start gap-4">
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                     formData.branchIds.includes(branch.branchId) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                   }`}>
                      <MapPin className="w-5 h-5" />
                   </div>
                   <div>
                      <p className="text-sm font-bold text-slate-800 tracking-tight">{branch.name}</p>
                      <p className="text-[11px] text-slate-500 mt-1 font-medium leading-relaxed">
                        {branch.address}
                      </p>
                   </div>
                </div>
                {formData.branchIds.includes(branch.branchId) && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Bạn chưa có thông tin chi nhánh.</p>
            <p className="text-[10px] text-slate-400 mt-1">Vui lòng cập nhật "Hồ sơ công ty" trước khi đăng tin.</p>
          </div>
        )}
      </div>

      {/* Job Tier Selection */}
      <div className="space-y-8 bg-slate-50/40 p-6 rounded-3xl border border-slate-100 shadow-inner">
        <div className="space-y-1.5 text-center">
          <h4 className="text-xl font-black text-slate-800 uppercase tracking-[0.2em]">Hạng tin tuyển dụng</h4>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Tăng hiệu quả tiếp cận với các gói ưu tiên</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { id: 'BASIC', name: 'Tin Thường', icon: Shield, color: 'slate', price: 'Miễn phí', desc: 'Hiển thị cơ bản trên trang tìm kiếm việc làm.', bg: 'bg-slate-500' },
            { id: 'PROFESSIONAL', name: 'Nổi Bật', icon: Crown, color: 'indigo', price: '1 Lượt PRO', desc: 'Ưu tiên hiển thị phía trên các tin thường.', bg: 'bg-indigo-600' },
            { id: 'URGENT', name: 'Tuyển Gấp', icon: Zap, color: 'rose', price: '1 Lượt VIP', desc: 'Gắn badge "Tuyển gấp", hiển thị ưu tiên cao nhất.', bg: 'bg-rose-600' }
          ].map(tier => (
            <button
              key={tier.id}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, jobTier: tier.id }))}
              className={`p-6 rounded-3xl border-2 text-left transition-all relative flex flex-col gap-6 h-full group ${
                formData.jobTier === tier.id
                  ? 'border-white bg-white shadow-xl scale-[1.03] z-10'
                  : 'border-transparent bg-transparent opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
              }`}
            >
              <div className="space-y-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${tier.bg} text-white`}>
                  <tier.icon className="w-7 h-7" />
                </div>
                <div>
                  <p className={`text-xs font-black uppercase tracking-[0.2em] ${
                    formData.jobTier === tier.id ? 'text-slate-800' : 'text-slate-500'
                  }`}>{tier.name}</p>
                  <p className="text-xs font-bold text-indigo-600 mt-1 bg-indigo-50 px-3 py-1 rounded-lg w-fit">{tier.price}</p>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed font-bold">{tier.desc}</p>
              </div>

              {formData.jobTier === tier.id && (
                <div className="absolute top-6 right-6">
                  <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-100">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Auto Invite Checkbox */}
        <div className="p-6 bg-white/80 rounded-2xl border-2 border-white shadow-lg shadow-slate-200/10 flex items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0 border border-amber-100 shadow-sm">
               <Zap className="w-6 h-6 text-amber-500 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h5 className="text-sm font-black text-slate-800 uppercase tracking-widest">Tự động mời ứng viên phù hợp</h5>
              <p className="text-[11px] text-slate-400 font-bold max-w-md">AI sẽ tự động gửi thông báo hẹn lịch phỏng vấn đến các ứng viên có điểm Matching &gt;= 85%.</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer scale-110 mr-2">
            <input
              type="checkbox"
              name="autoInviteMatches"
              checked={formData.autoInviteMatches}
              onChange={(e) => setFormData(prev => ({ ...prev, autoInviteMatches: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {/* Auto Reject Setting */}
        <div className="p-6 bg-white/80 rounded-2xl border-2 border-white shadow-lg shadow-slate-200/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mt-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center shrink-0 border border-rose-100 shadow-sm">
               <Shield className="w-6 h-6 text-rose-500" />
            </div>
            <div className="space-y-1">
              <h5 className="text-sm font-black text-slate-800 uppercase tracking-widest">Tự động từ chối hồ sơ kém</h5>
              <p className="text-[11px] text-slate-400 font-bold max-w-md">Điểm tối thiểu. Hệ thống sẽ đánh rớt ngay lập tức nếu AI Matching của hồ sơ dưới mức này.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="number"
              min="0"
              max="100"
              placeholder="VD: 50"
              value={formData.autoRejectThreshold}
              onChange={(e) => setFormData(prev => ({ ...prev, autoRejectThreshold: e.target.value === '' ? '' : Number(e.target.value) }))}
              className="w-24 h-12 px-4 rounded-xl border-2 border-slate-200 focus:border-rose-500 outline-none text-center font-bold text-slate-700 bg-white"
            />
            <span className="text-sm font-bold text-slate-400">%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
