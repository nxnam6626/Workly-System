'use client';

import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, MapPin, Crown, Zap, Shield, CheckCircle2, Navigation, Target, Scale, Globe, ChevronUp, ChevronDown, Clock, Info } from 'lucide-react';
import { JobFormData } from '@/types/job';

interface Step4Props {
  formData: JobFormData;
  setFormData: React.Dispatch<React.SetStateAction<JobFormData>>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  userPlan: string;
}

type MatchMode = 'STRICT' | 'BALANCED' | 'BROAD';

const MATCH_MODES: {
  value: MatchMode;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  inviteThreshold: number;
  rejectThreshold: number;
  inviteColor: string;
  rejectColor: string;
  gradient: string;
  bgActive: string;
  borderActive: string;
  desc: string;
  pill: string;
}[] = [
  {
    value: 'STRICT',
    label: 'Chặt chẽ',
    sublabel: 'Tuyển 1 vị trí quan trọng',
    icon: Target,
    inviteThreshold: 85,
    rejectThreshold: 65,
    inviteColor: 'text-rose-600',
    rejectColor: 'text-rose-400',
    gradient: 'from-rose-500 to-orange-500',
    bgActive: 'bg-rose-50',
    borderActive: 'border-rose-400',
    desc: 'AI chỉ mời ứng viên điểm rất cao. Loại ngay hồ sơ yếu.',
    pill: 'bg-rose-100 text-rose-700',
  },
  {
    value: 'BALANCED',
    label: 'Cân bằng',
    sublabel: 'Mặc định cho hầu hết vị trí',
    icon: Scale,
    inviteThreshold: 70,
    rejectThreshold: 45,
    inviteColor: 'text-indigo-600',
    rejectColor: 'text-indigo-400',
    gradient: 'from-indigo-500 to-violet-500',
    bgActive: 'bg-indigo-50',
    borderActive: 'border-indigo-400',
    desc: 'Mời ứng viên phù hợp tốt. Giữ lại hồ sơ tiềm năng.',
    pill: 'bg-indigo-100 text-indigo-700',
  },
  {
    value: 'BROAD',
    label: 'Mở rộng',
    sublabel: 'Tuyển số lượng lớn',
    icon: Globe,
    inviteThreshold: 55,
    rejectThreshold: 25,
    inviteColor: 'text-emerald-600',
    rejectColor: 'text-emerald-400',
    gradient: 'from-emerald-500 to-teal-500',
    bgActive: 'bg-emerald-50',
    borderActive: 'border-emerald-400',
    desc: 'Mở rộng pool ứng viên tối đa. Ít loại hồ sơ.',
    pill: 'bg-emerald-100 text-emerald-700',
  },
];

function ThresholdSlider({
  label,
  description,
  value,
  onChange,
  color,
  icon: Icon,
  iconBg,
  trackColor,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
  icon: React.ElementType;
  iconBg: string;
  trackColor: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-700 uppercase tracking-widest">{label}</p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onChange(Math.max(0, value - 5))}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </button>
          <span className={`text-2xl font-black ${color} w-14 text-center tabular-nums`}>{value}%</span>
          <button
            type="button"
            onClick={() => onChange(Math.min(100, value + 5))}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <ChevronUp className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      <div className="relative h-3 rounded-full bg-slate-100 overflow-hidden cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = Math.round(((e.clientX - rect.left) / rect.width) * 100 / 5) * 5;
          onChange(Math.min(100, Math.max(0, pct)));
        }}
      >
        <motion.div
          className={`h-full rounded-full ${trackColor}`}
          initial={false}
          animate={{ width: `${value}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white border-2 shadow-md transition-[left] duration-200"
          style={{ left: `${value}%`, borderColor: 'currentColor' }}
        />
      </div>

      <div className="flex justify-between text-[9px] text-slate-300 font-bold uppercase tracking-wider px-0.5">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

export const Step4_JobTier = ({
  formData,
  setFormData,
  handleChange,
  userPlan,
}: Step4Props) => {

  const currentMode = MATCH_MODES.find(m => m.value === formData.matchMode) ?? MATCH_MODES[1];

  const handleSelectMode = useCallback((mode: MatchMode) => {
    const cfg = MATCH_MODES.find(m => m.value === mode)!;
    setFormData(prev => ({
      ...prev,
      matchMode: mode,
      autoInviteThreshold: cfg.inviteThreshold,
      autoRejectThreshold: cfg.rejectThreshold,
    }));
  }, [setFormData]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12 pb-6">

      {/* Ràng buộc thời gian (SLA) */}
      {false && (
        <div className="bg-slate-900 p-8 rounded-[2rem] text-white space-y-6 shadow-xl shadow-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
               <Clock className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Cam kết phản hồi (SLA)</h3>
              <p className="text-xs text-slate-400 font-medium">Tăng uy tín công ty bằng cách cam kết thời gian phản hồi</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-200 ml-1">Hạn phản hồi hồ sơ</label>
                <span className="text-[10px] font-black text-sky-400 uppercase bg-sky-400/10 px-2 py-0.5 rounded-md">Sau khi ứng tuyển</span>
              </div>
              <div className="relative">
                <input 
                  type="number"
                  name="slaApplicationDays"
                  value={formData.slaApplicationDays}
                  onChange={handleChange}
                  min={1}
                  max={30}
                  className="w-full h-14 pl-6 pr-14 rounded-2xl bg-white/5 border border-white/10 outline-none focus:border-sky-500 focus:bg-white/10 transition-all font-bold text-lg"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-slate-500 uppercase">Ngày</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-200 ml-1">Hạn thông báo kết quả</label>
                <span className="text-[10px] font-black text-emerald-400 uppercase bg-emerald-400/10 px-2 py-0.5 rounded-md">Sau khi phỏng vấn</span>
              </div>
              <div className="relative">
                <input 
                  type="number"
                  name="slaInterviewDays"
                  value={formData.slaInterviewDays}
                  onChange={handleChange}
                  min={1}
                  max={30}
                  className="w-full h-14 pl-6 pr-14 rounded-2xl bg-white/5 border border-white/10 outline-none focus:border-emerald-500 focus:bg-white/10 transition-all font-bold text-lg"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-slate-500 uppercase">Ngày</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex gap-4 items-start">
             <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
             <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                 Hệ thống sẽ tự động hiển thị thời gian dự kiến phản hồi cho ứng viên. 
               <br />
               <span className="text-white font-bold mx-1">Lưu ý:</span> Việc quá hạn phản hồi thường xuyên có thể làm giảm điểm uy tín của công ty trên nền tảng.
             </p>
          </div>
        </div>
      )}

      {/* ── Job Tier ── */}
      <div className="space-y-8 bg-slate-50/40 p-6 rounded-3xl border border-slate-100 shadow-inner">
        <div className="space-y-1.5 text-center">
          <h4 className="text-xl font-black text-slate-800 uppercase tracking-[0.2em]">Hạng tin tuyển dụng</h4>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Tăng hiệu quả tiếp cận với các gói ưu tiên</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { id: 'BASIC', name: 'Tin Thường', icon: Shield, price: 'Miễn phí', desc: 'Hiển thị cơ bản trên trang tìm kiếm việc làm.', bg: 'bg-slate-500' },
            { id: 'PROFESSIONAL', name: 'Nổi Bật', icon: Crown, price: '1 Lượt PRO', desc: 'Ưu tiên hiển thị phía trên các tin thường.', bg: 'bg-indigo-600' },
            { id: 'URGENT', name: 'Tuyển Gấp', icon: Zap, price: '1 Lượt VIP', desc: 'Gắn badge "Tuyển gấp", hiển thị ưu tiên cao nhất.', bg: 'bg-rose-600' },
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
                  <p className={`text-xs font-black uppercase tracking-[0.2em] ${formData.jobTier === tier.id ? 'text-slate-800' : 'text-slate-500'}`}>
                    {tier.name}
                  </p>
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
      </div>

      {/* ── Match Mode Selector ── */}
      <div className="space-y-6">
        <div className="ml-1 space-y-1">
          <h4 className="text-sm font-black text-slate-700 uppercase tracking-[0.18em] flex items-center gap-2">
            <Scale className="w-4 h-4 text-indigo-500" />
            Mức độ phù hợp khi lọc ứng viên
          </h4>
          <p className="text-xs text-slate-400 font-medium">
            Chọn mức độ khắt khe của AI khi đề xuất và lọc hồ sơ. Các ngưỡng bên dưới sẽ tự động điều chỉnh, bạn có thể chỉnh lại thủ công.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MATCH_MODES.map(mode => {
            const isActive = formData.matchMode === mode.value;
            return (
              <button
                key={mode.value}
                type="button"
                onClick={() => handleSelectMode(mode.value)}
                className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 relative group ${
                  isActive
                    ? `${mode.borderActive} ${mode.bgActive} shadow-lg scale-[1.02]`
                    : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {/* header */}
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${mode.gradient} shadow-md`}>
                    <mode.icon className="w-5 h-5 text-white" />
                  </div>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    </motion.div>
                  )}
                </div>

                <p className="text-sm font-black text-slate-800 tracking-tight">{mode.label}</p>
                <p className={`text-[10px] font-bold mt-0.5 ${isActive ? 'text-slate-500' : 'text-slate-400'}`}>{mode.sublabel}</p>
                <p className={`text-[11px] mt-2 leading-relaxed font-medium ${isActive ? 'text-slate-600' : 'text-slate-400'}`}>{mode.desc}</p>

                {/* thresholds preview */}
                <div className="mt-3 flex gap-2">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${mode.pill}`}>
                    Mời ≥{mode.inviteThreshold}%
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                    Từ chối &lt;{mode.rejectThreshold}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Threshold Controls ── */}
      <div className="space-y-8 bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest">Tuỳ chỉnh ngưỡng AI</h4>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Đã áp dụng mức <span className={`font-black px-1.5 py-0.5 rounded-md text-[10px] ${currentMode.pill}`}>{currentMode.label}</span>. Điều chỉnh lại nếu cần.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleSelectMode(formData.matchMode as MatchMode)}
            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-50"
          >
            ↺ Đặt lại
          </button>
        </div>

        {/* AutoInvite toggle + slider */}
        <div className="space-y-5 p-5 rounded-2xl bg-amber-50/60 border border-amber-100">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h5 className="text-xs font-black text-slate-800 uppercase tracking-widest">Tự động mời ứng viên</h5>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">AI gửi lời mời phỏng vấn khi điểm đạt ngưỡng</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                name="autoInviteMatches"
                checked={formData.autoInviteMatches}
                onChange={(e) => setFormData(prev => ({ ...prev, autoInviteMatches: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
            </label>
          </div>

          <AnimatePresence>
            {formData.autoInviteMatches && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-4">
                  <ThresholdSlider
                    label="Ngưỡng tự động mời"
                    description={`Gửi lời mời khi điểm AI ≥ ${formData.autoInviteThreshold}%`}
                    value={formData.autoInviteThreshold}
                    onChange={(v) => setFormData(prev => ({ ...prev, autoInviteThreshold: v }))}
                    color="text-amber-600"
                    icon={Zap}
                    iconBg="bg-amber-100"
                    trackColor="bg-gradient-to-r from-amber-400 to-orange-400"
                  />
                </div>
                
                {/* Auto Invite Pricing Description */}
                <div className="mt-5 p-4 rounded-xl bg-indigo-50/80 border border-indigo-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
                    <span className="text-indigo-600 font-black text-sm">💰</span>
                  </div>
                  <div>
                    <h6 className="text-[11px] font-bold text-indigo-900 uppercase tracking-wide">Chi phí tự động mở khoá</h6>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      Khi AI tìm thấy ứng viên đạt ngưỡng và tự gửi lời mời, hệ thống sẽ tự động trừ <strong>1 lượt mở khoá CV</strong> (hoặc <strong>30 Xu</strong> nếu hết lượt) vào ví của bạn cho mỗi hồ sơ.
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1 italic">
                      * Bạn có thể tắt tính năng này bất cứ lúc nào nếu muốn duyệt thủ công.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* AutoReject slider */}
        <div className="space-y-5 p-5 rounded-2xl bg-rose-50/60 border border-rose-100">
          <ThresholdSlider
            label="Tự động từ chối hồ sơ kém"
            description={`Loại ngay hồ sơ có điểm AI < ${formData.autoRejectThreshold || 0}%`}
            value={Number(formData.autoRejectThreshold) || 0}
            onChange={(v) => setFormData(prev => ({ ...prev, autoRejectThreshold: v }))}
            color="text-rose-600"
            icon={Shield}
            iconBg="bg-rose-100"
            trackColor="bg-gradient-to-r from-rose-400 to-pink-400"
          />
          {Number(formData.autoRejectThreshold) === 0 && (
            <p className="text-[10px] text-slate-400 font-medium">💡 Ngưỡng = 0% nghĩa là không tự động từ chối hồ sơ nào.</p>
          )}
        </div>

        {/* Warning khi invite < reject */}
        <AnimatePresence>
          {formData.autoInviteMatches &&
            Number(formData.autoRejectThreshold) > 0 &&
            formData.autoInviteThreshold <= Number(formData.autoRejectThreshold) && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200"
            >
              <span className="text-lg shrink-0">⚠️</span>
              <p className="text-[11px] text-red-600 font-bold">
                Ngưỡng mời ({formData.autoInviteThreshold}%) đang thấp hơn hoặc bằng ngưỡng từ chối ({formData.autoRejectThreshold}%).
                AI sẽ không thể mời ứng viên nào — hãy điều chỉnh lại.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
