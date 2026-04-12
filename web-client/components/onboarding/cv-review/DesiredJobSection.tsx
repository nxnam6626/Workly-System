import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Target } from 'lucide-react';
import { FormValues } from '@/lib/schemas/cv-onboarding';

export function DesiredJobSection() {
  const { register } = useFormContext<FormValues>();

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
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-tight">Mức lương</label>
            <input
              {...register('desiredJob.expectedSalary')}
              className="w-full px-4 py-2 text-sm bg-white/60 border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 focus:bg-white transition-all outline-none"
              placeholder="VD: Thỏa thuận, 10-15tr..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-tight">Hình thức</label>
            <select
              {...register('desiredJob.jobType')}
              className="w-full px-4 py-2 text-sm bg-white/60 border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 focus:bg-white transition-all outline-none appearance-none"
            >
              <option value="">Chọn hình thức</option>
              <option value="FULL_TIME">Toàn thời gian</option>
              <option value="PART_TIME">Bán thời gian</option>
              <option value="INTERNSHIP">Thực tập sinh</option>
              <option value="FREELANCE">Freelance</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-tight">Địa điểm làm việc</label>
          <input
            {...register('desiredJob.location')}
            className="w-full px-4 py-2 text-sm bg-white/60 border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 focus:bg-white transition-all outline-none"
            placeholder="VD: TP. Hồ Chí Minh..."
          />
        </div>
      </div>
    </section>
  );
}
