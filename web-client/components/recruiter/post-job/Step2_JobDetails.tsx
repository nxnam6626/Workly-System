import React from 'react';
import { motion } from 'framer-motion';
import { Plus, X as CloseIcon, Brain, Cpu, Star, Info, Clock } from 'lucide-react';
import { JobFormData } from '@/types/job';

interface Step2Props {
  formData: JobFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  hardSkillInput: string;
  setHardSkillInput: (val: string) => void;
  softSkillInput: string;
  setSoftSkillInput: (val: string) => void;
  addSkill: (type: 'hard' | 'soft', skill: string) => void;
  removeSkill: (type: 'hard' | 'soft', skill: string) => void;
}

export const Step2_JobDetails = ({
  formData,
  handleChange,
  hardSkillInput,
  setHardSkillInput,
  softSkillInput,
  setSoftSkillInput,
  addSkill,
  removeSkill
}: Step2Props) => {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-4">
      {/* Kinh nghiệm */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
             <Star className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Kinh nghiệm ứng viên</h3>
            <p className="text-xs text-slate-400 font-medium">Xác định tiêu chuẩn kinh nghiệm tối thiểu</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Mức kinh nghiệm</label>
            <select 
              name="experience" 
              value={formData.experience} 
              onChange={handleChange} 
              className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold text-slate-700"
            >
              <option value="Không yêu cầu">Không yêu cầu kinh nghiệm</option>
              <option value="Dưới 1 năm">Dưới 1 năm</option>
              <option value="1 năm">1 năm</option>
              <option value="2 năm">2 năm</option>
              <option value="3 năm">3 năm</option>
              <option value="4 năm">4 năm</option>
              <option value="5 năm">5 năm</option>
              <option value="Trên 5 năm">Trên 5 năm</option>
            </select>
          </div>
        </div>
      </div>

      {/* Kỹ năng chuyên môn */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-500" /> Kỹ năng chuyên môn <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-500 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
            <Info className="w-3 h-3" /> QUAN TRỌNG ĐỂ MATCHING
          </div>
        </div>
        
        <div className="relative group">
          <input
            type="text"
            value={hardSkillInput}
            onChange={(e) => setHardSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSkill('hard', hardSkillInput);
                setHardSkillInput('');
              }
            }}
            className="w-full h-16 pl-6 pr-20 rounded-2xl border-2 border-slate-100 bg-slate-50 outline-none focus:bg-white focus:border-indigo-500 shadow-sm transition-all font-semibold text-slate-700"
            placeholder="Nhập kỹ năng (VD: ReactJS, Figma, SQL...) và nhấn Enter"
          />
          <button
            type="button"
            onClick={() => {
              addSkill('hard', hardSkillInput);
              setHardSkillInput('');
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-4 h-10 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase flex items-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> Thêm
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {formData.hardSkills.length === 0 && (
            <p className="text-xs text-slate-300 italic ml-1">Chưa có kỹ năng nào được thêm...</p>
          )}
          {formData.hardSkills.map(skill => (
            <motion.span 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              key={skill} 
              className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-black uppercase flex items-center gap-3 border-2 border-indigo-100/50 group"
            >
              {skill}
              <button 
                type="button" 
                onClick={() => removeSkill('hard', skill)} 
                className="text-indigo-300 hover:text-rose-500 transition-colors"
              >
                <CloseIcon className="w-3.5 h-3.5" />
              </button>
            </motion.span>
          ))}
        </div>
      </div>

      {/* Kỹ năng mềm */}
      <div className="space-y-4">
        <label className="text-sm font-bold text-slate-700 flex items-center gap-2 px-1">
          <Brain className="w-5 h-5 text-purple-500" /> Kỹ năng mềm bổ trợ
        </label>
        
        <div className="relative group">
          <input
            type="text"
            value={softSkillInput}
            onChange={(e) => setSoftSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSkill('soft', softSkillInput);
                setSoftSkillInput('');
              }
            }}
            className="w-full h-14 pl-6 pr-20 rounded-2xl border-2 border-slate-100 bg-slate-50 outline-none focus:bg-white focus:border-purple-500 transition-all font-semibold text-slate-700"
            placeholder="VD: Giao tiếp, Tư duy phản biện..."
          />
          <button
            type="button"
            onClick={() => {
              addSkill('soft', softSkillInput);
              setSoftSkillInput('');
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-800 text-white rounded-xl flex items-center justify-center hover:bg-slate-900 transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {formData.softSkills.map(skill => (
            <motion.span 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              key={skill} 
              className="px-4 py-2 bg-white text-slate-600 rounded-xl text-xs font-black uppercase flex items-center gap-3 border-2 border-slate-100"
            >
              {skill}
              <button 
                type="button" 
                onClick={() => removeSkill('soft', skill)} 
                className="text-slate-300 hover:text-rose-500 transition-colors"
              >
                <CloseIcon className="w-3.5 h-3.5" />
              </button>
            </motion.span>
          ))}
        </div>
      </div>

      {/* Ràng buộc thời gian (SLA) */}
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
    </motion.div>
  );
};
