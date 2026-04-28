import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { User, Phone, Briefcase, GraduationCap, Trash2, AlertCircle } from 'lucide-react';
import { FormValues } from '@/lib/schemas/cv-onboarding';

interface BasicInfoSectionProps {
  currentProfile?: any;
}

export function BasicInfoSection({ currentProfile }: BasicInfoSectionProps) {
  const { register, control, formState: { errors } } = useFormContext<FormValues>();

  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({
    control,
    name: 'education',
  });
  
  const { watch } = useFormContext<FormValues>();
  const watchedName = watch('fullName');
  const watchedPhone = watch('phone');
  const watchedGpa = watch('gpa');
  const watchedExp = watch('totalYearsExp');

  const DiffIndicator = ({ field, current, newValue }: { field: string, current: any, newValue: any }) => {
    if (!current || !newValue) return null;
    const isDifferent = String(current).trim().toLowerCase() !== String(newValue).trim().toLowerCase();
    if (!isDifferent) return null;

    return (
      <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 animate-in fade-in slide-in-from-top-1">
        <AlertCircle size={10} />
        <span>Khác với hồ sơ: <b>{current}</b></span>
      </div>
    );
  };

  return (
    <section className="relative overflow-hidden bg-white/60 backdrop-blur-3xl rounded-[1.5rem] p-5 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-2 bg-gradient-to-br from-sky-100 to-blue-50 text-sky-600 rounded-lg shadow-sm border border-sky-100/50">
          <User size={16} />
        </div>
        <h2 className="text-lg font-bold text-gray-900 leading-none">Thông tin cơ bản</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-tight">Họ và tên</label>
          <div className="relative">
            <input
              {...register('fullName')}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white/60 border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-sky-500/15 focus:border-sky-500 focus:bg-white transition-all outline-none"
              placeholder="Nguyễn Văn A"
            />
            <User size={16} className="absolute left-3 top-2 text-gray-400" />
          </div>
          {errors.fullName && <p className="text-[10px] text-red-500 italic ml-1">{errors.fullName.message}</p>}
          <DiffIndicator field="fullName" current={currentProfile?.fullName} newValue={watchedName} />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-tight">Số điện thoại</label>
          <div className="relative">
            <input
              {...register('phone')}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white/60 border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-sky-500/15 focus:border-sky-500 focus:bg-white transition-all outline-none"
              placeholder="09xx xxx xxx"
            />
            <Phone size={16} className="absolute left-3 top-2 text-gray-400" />
          </div>
          {errors.phone && <p className="text-[10px] text-red-500 italic ml-1">{errors.phone.message}</p>}
          <DiffIndicator field="phone" current={currentProfile?.user?.phoneNumber} newValue={watchedPhone} />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-2">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-tight">GPA</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                {...register('gpa', { valueAsNumber: true })}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white/60 border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-sky-500/15 focus:border-sky-500 focus:bg-white transition-all outline-none"
                placeholder="3.6"
              />
              <span className="absolute left-3 top-2.5 text-gray-400 font-black text-[10px]">GPA</span>
            </div>
            <DiffIndicator field="gpa" current={currentProfile?.gpa} newValue={watchedGpa} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-tight">Kinh nghiệm</label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                {...register('totalYearsExp', { valueAsNumber: true })}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white/60 border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-sky-500/15 focus:border-sky-500 focus:bg-white transition-all outline-none"
              />
              <Briefcase size={16} className="absolute left-3 top-2 text-gray-400" />
            </div>
            <DiffIndicator field="totalYearsExp" current={currentProfile?.totalYearsExp} newValue={watchedExp} />
          </div>
        </div>
      </div>

      <div className="pt-5 mt-2 border-t border-slate-200/60">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-amber-100 to-orange-50 text-amber-600 rounded-lg shadow-sm border border-amber-100/50">
              <GraduationCap size={14} />
            </div>
            <h3 className="text-sm font-bold text-gray-800">Lịch sử Học vấn</h3>
          </div>
          <button
            type="button"
            onClick={() => appendEdu({ school: '', degree: '', major: '' })}
            className="text-xs font-bold text-sky-600 hover:text-white bg-sky-50 hover:bg-sky-500 px-2.5 py-1.5 rounded-lg transition-colors border border-sky-100 hover:border-sky-500 shadow-sm"
          >
            + Thêm
          </button>
        </div>

        <div className="space-y-3">
          {eduFields.map((field, index) => (
            <div key={field.id} className="relative bg-slate-50/80 backdrop-blur-sm p-3.5 rounded-xl border border-slate-200/80 hover:border-sky-200 transition-colors group shadow-sm">
              <button
                type="button"
                onClick={() => removeEdu(index)}
                className="absolute top-2.5 right-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 p-1 rounded-md transition-colors"
                title="Xóa học vấn"
              >
                <Trash2 size={16} />
              </button>

              <div className="space-y-2.5 pr-8">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Trường học / Cơ sở đào tạo</label>
                  <input
                    {...register(`education.${index}.school`)}
                    className="w-full px-3 py-2 text-sm font-medium bg-white border border-gray-200/80 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all outline-none"
                    placeholder="VD: Đại học Công Nghiệp..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Chuyên ngành</label>
                    <input
                      {...register(`education.${index}.major`)}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-200/80 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all outline-none"
                      placeholder="Khoa học máy tính"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Bằng cấp</label>
                    <input
                      {...register(`education.${index}.degree`)}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-200/80 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all outline-none"
                      placeholder="Cử nhân"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
          {eduFields.length === 0 && (
            <p className="text-xs text-center text-gray-400 font-medium italic mt-2">
              Bạn chưa khai báo trường đại học nào.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
