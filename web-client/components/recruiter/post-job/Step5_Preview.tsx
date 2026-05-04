import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, DollarSign, Calendar, Briefcase, Info, CheckCircle2, Bot, Star, ListChecks, Award } from 'lucide-react';
import { JobFormData } from '@/types/job';

interface Step5Props {
  formData: JobFormData;
  companyProfile: any;
  branches: any[];
}

export const Step5_Preview = ({
  formData,
  companyProfile,
  branches
}: Step5Props) => {
  const selectedBranches = branches.filter(b => formData.branchIds.includes(b.branchId));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10 pb-6">
      {/* Header Preview Card */}
      <div className="p-10 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[3rem] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl border border-white/30 flex items-center justify-center flex-shrink-0 shadow-xl">
            <Briefcase className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-3xl font-black tracking-tight">{formData.title || 'Chưa nhập tiêu đề'}</h3>
              <span className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full backdrop-blur-md border ${
                formData.jobTier === 'URGENT' ? 'bg-rose-500/80 text-white border-rose-300/50' :
                formData.jobTier === 'PROFESSIONAL' ? 'bg-amber-500/80 text-white border-amber-300/50' :
                'bg-white/20 text-white border-white/30'
              }`}>
                {formData.jobTier === 'URGENT' ? 'Tuyển Gấp' : formData.jobTier === 'PROFESSIONAL' ? 'Nổi Bật' : 'Tin Thường'}
              </span>
            </div>
            <div className="flex flex-wrap gap-6 text-sm font-bold text-indigo-100">
              <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {selectedBranches.length > 0 ? `${selectedBranches[0].city} (+${selectedBranches.length - 1} địa điểm)` : 'Chưa chọn địa điểm'}</span>
              <span className="flex items-center gap-2"><DollarSign className="w-4 h-4" /> {formData.salaryMin && formData.salaryMax ? `${formData.salaryMin.toLocaleString()} - ${formData.salaryMax.toLocaleString()} VNĐ` : 'Thỏa thuận'}</span>
              <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {formData.jobType}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 ml-1">
               Mô tả chi tiết
            </h4>
            <div className="text-sm text-slate-700 leading-relaxed bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm whitespace-pre-wrap min-h-[150px] font-medium">
              {formData.description || <span className="text-slate-300 italic">Chưa có mô tả nội dung...</span>}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 ml-1 text-emerald-500">
               Quyền lợi & Đãi ngộ
            </h4>
            <div className="text-sm text-slate-700 leading-relaxed bg-emerald-50/20 p-8 rounded-[2rem] border border-emerald-100 whitespace-pre-wrap min-h-[100px] font-medium">
              {formData.benefits || <span className="text-slate-300 italic">Chưa có thông tin quyền lợi...</span>}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 ml-1 text-amber-500">
               Yêu cầu chuyên môn
            </h4>
            <div className="text-sm text-slate-700 leading-relaxed bg-amber-50/20 p-8 rounded-[2rem] border border-amber-100 whitespace-pre-wrap min-h-[150px] font-medium">
              {formData.requirements || <span className="text-slate-300 italic">Chưa có thông tin yêu cầu...</span>}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 ml-1">
               Kỹ năng cần có
            </h4>
            <div className="flex flex-wrap gap-2.5 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              {formData.hardSkills.length === 0 && formData.softSkills.length === 0 && (
                 <span className="text-slate-300 text-xs italic">Chưa thêm kỹ năng nào.</span>
              )}
              {formData.hardSkills.map(skill => (
                <span key={skill} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">
                  {skill}
                </span>
              ))}
              {formData.softSkills.map(skill => (
                <span key={skill} className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Info Summary */}
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white space-y-4">
            <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tổng hợp thông tin</h5>
            <div className="grid grid-cols-2 gap-6">
               <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Cấp bậc</p>
                  <p className="text-xs font-black">{formData.jobLevel}</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Kinh nghiệm</p>
                  <p className="text-xs font-black">{formData.experience}</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Số lượng</p>
                  <p className="text-xs font-black">{formData.vacancies} vị trí</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Địa điểm</p>
                  <p className="text-xs font-black">{selectedBranches.length} chi nhánh</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Warning/Info Alert before submit */}
      <div className="p-8 bg-amber-50/50 rounded-[2.5rem] border-2 border-amber-100 flex items-start gap-6">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-amber-200 shrink-0 shadow-sm">
           <Info className="w-6 h-6 text-amber-500" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-black text-amber-800 uppercase tracking-tight">Xác nhận thông tin lần cuối</p>
          <p className="text-xs text-amber-700/80 leading-relaxed font-bold">
            Tin tuyển dụng của bạn sẽ được gửi tới đội ngũ kiểm duyệt. Bạn vẫn có thể chỉnh sửa sau khi tin được đăng, nhưng tin sẽ cần duyệt lại nếu có thay đổi quan trọng.
          </p>
        </div>
      </div>
    </motion.div>
  );
};
