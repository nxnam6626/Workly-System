import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { GraduationCap, Plus, Trash2 } from 'lucide-react';
import { FormValues } from '@/lib/schemas/cv-onboarding';

export function EducationSection() {
  const { register, control } = useFormContext<FormValues>();

  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({
    control,
    name: 'education',
  });

  return (
    <section className="relative overflow-hidden bg-white/60 backdrop-blur-3xl rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-500">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-amber-100 to-orange-50 text-amber-600 rounded-xl shadow-sm border border-amber-100/50">
            <GraduationCap size={20} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Lịch sử học vấn</h2>
        </div>
        <button
          type="button"
          onClick={() => appendEdu({ school: '', degree: '', major: '' })}
          className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-sm font-bold hover:bg-amber-100 transition-colors"
        >
          <Plus size={16} /> Thêm mới
        </button>
      </div>

      <div className="space-y-6">
        {eduFields.map((field, index) => (
          <div key={field.id} className="relative p-6 bg-white/50 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-sky-200/80 transition-all duration-300 group">
            <button
              type="button"
              onClick={() => removeEdu(index)}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={18} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Trường học</label>
                <input
                  {...register(`education.${index}.school`)}
                  className="w-full px-4 py-2.5 bg-white/80 border border-gray-200 rounded-xl focus:ring-4 focus:ring-sky-500/15 focus:border-sky-500 transition-all outline-none hover:border-gray-300 focus:bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bằng cấp</label>
                <input
                  {...register(`education.${index}.degree`)}
                  className="w-full px-4 py-2.5 bg-white/80 border border-gray-200 rounded-xl focus:ring-4 focus:ring-sky-500/15 focus:border-sky-500 transition-all outline-none hover:border-gray-300 focus:bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chuyên ngành</label>
                <input
                  {...register(`education.${index}.major`)}
                  className="w-full px-4 py-2.5 bg-white/80 border border-gray-200 rounded-xl focus:ring-4 focus:ring-sky-500/15 focus:border-sky-500 transition-all outline-none hover:border-gray-300 focus:bg-white"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
