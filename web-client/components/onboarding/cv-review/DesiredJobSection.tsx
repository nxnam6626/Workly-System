import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Target, AlertCircle } from 'lucide-react';
import { FormValues } from '@/lib/schemas/cv-onboarding';
import { LOCATIONS } from '@/lib/constants';

interface DesiredJobSectionProps {
  currentProfile?: any;
}

export function DesiredJobSection({ currentProfile }: DesiredJobSectionProps) {
  const { register, watch } = useFormContext<FormValues>();

  const watchedTitle = watch('desiredJob.jobTitle');
  const watchedLocation = watch('desiredJob.location');

  const DiffIndicator = ({ current, newValue }: { current: any, newValue: any }) => {
    if (!current || !newValue) return null;
    const isDifferent = String(current).trim().toLowerCase() !== String(newValue).trim().toLowerCase();
    if (!isDifferent) return null;

    return (
      <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 animate-in fade-in slide-in-from-top-1">
        <AlertCircle size={10} />
        <span>Khác hồ sơ: <b>{current}</b></span>
      </div>
    );
  };

  return (
    <section className="relative overflow-hidden bg-white/60 backdrop-blur-3xl rounded-[1.5rem] p-5 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-2 bg-gradient-to-br from-emerald-100 to-teal-50 text-emerald-600 rounded-lg shadow-sm border border-emerald-100/50">
          <Target size={16} />
        </div>
        <h2 className="text-lg font-bold text-gray-900 leading-none">Công việc mong muốn</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-tight">Vị trí ứng tuyển</label>
          <input
            {...register('desiredJob.jobTitle')}
            className="w-full px-4 py-2 text-sm bg-white/60 border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 focus:bg-white transition-all outline-none"
            placeholder="VD: Frontend Developer, BA..."
          />
          <DiffIndicator current={currentProfile?.desiredJob?.jobTitle} newValue={watchedTitle} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-tight">Mức lương mong muốn</label>
            <input
              {...register('desiredJob.expectedSalary')}
              className="w-full px-4 py-2 text-sm bg-white/60 border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 focus:bg-white transition-all outline-none"
              placeholder="VD: Thỏa thuận, 10-15tr..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-tight">Hình thức làm việc</label>
            <select
              {...register('desiredJob.jobType')}
              className="w-full px-4 py-2 text-sm bg-white/60 border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 focus:bg-white transition-all outline-none appearance-none"
            >
              <option value="">Chọn hình thức</option>
              <option value="FULLTIME">Toàn thời gian</option>
              <option value="PARTTIME">Bán thời gian</option>
              <option value="REMOTE">Làm việc từ xa</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-tight">Chức vụ mong muốn</label>
            <select
              {...register('desiredJob.jobLevel')}
              className="w-full px-4 py-2 text-sm bg-white/60 border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 focus:bg-white transition-all outline-none appearance-none"
            >
              <option value="">Chọn chức vụ</option>
              <option value="INTERN">Thực tập sinh</option>
              <option value="STAFF">Nhân viên/Chuyên viên</option>
              <option value="MANAGER">Trưởng nhóm/Trưởng phòng</option>
              <option value="DIRECTOR">Giám đốc/Cấp cao hơn</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-tight">Địa điểm làm việc</label>
            <div className="relative">
              <select
                {...register('desiredJob.location')}
                className="w-full px-4 py-2 text-sm bg-white/60 border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 focus:bg-white transition-all outline-none appearance-none"
              >
                <option value="">Chọn địa điểm</option>
                {LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <DiffIndicator current={currentProfile?.desiredJob?.location} newValue={watchedLocation} />
          </div>
        </div>

      </div>
    </section>
  );
}
