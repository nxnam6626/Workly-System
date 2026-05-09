import React, { useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Languages, Heart, Info, Plus, X, Globe, Lightbulb } from 'lucide-react';
import { FormValues } from '@/lib/schemas/cv-onboarding';
import { motion, AnimatePresence } from 'framer-motion';

export function AdditionalInfoSection() {
  const { control, register, formState: { errors }, watch, setValue } = useFormContext<FormValues>();
  
  const { fields: languageFields, append: appendLanguage, remove: removeLanguage } = useFieldArray({
    control,
    name: 'languages'
  });

  const { fields: otherInfoFields, append: appendOtherInfo, remove: removeOtherInfo } = useFieldArray({
    control,
    name: 'otherInfo'
  });

  const [newInterest, setNewInterest] = useState('');
  const interests = watch('interests') || [];

  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setValue('interests', [...interests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const removeInterest = (index: number) => {
    setValue('interests', interests.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Languages Section */}
      <section className="bg-white/60 backdrop-blur-3xl rounded-[1.5rem] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-100 to-sky-50 text-blue-600 rounded-xl shadow-sm border border-blue-100/50">
              <Globe size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Ngoại ngữ</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Các ngôn ngữ bạn có thể sử dụng</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => appendLanguage({ language: '', level: '' })}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-bold text-[11px] transition-all border border-blue-100 shadow-sm"
          >
            <Plus size={14} />
            Thêm
          </button>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {languageFields.map((field, index) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={field.id} 
                className="flex flex-col sm:flex-row gap-3 items-start p-4 bg-gray-50/50 border border-gray-100 rounded-2xl group hover:border-blue-200 hover:bg-white transition-all shadow-sm"
              >
                <div className="flex-1 w-full space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ngôn ngữ</label>
                  <input
                    {...register(`languages.${index}.language`)}
                    placeholder="Ví dụ: Tiếng Anh"
                    className="w-full px-4 py-2 text-sm bg-white border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all outline-none font-medium"
                  />
                </div>
                <div className="flex-1 w-full space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Trình độ / Chứng chỉ</label>
                  <input
                    {...register(`languages.${index}.level`)}
                    placeholder="Ví dụ: IELTS 7.5, Lưu loát..."
                    className="w-full px-4 py-2 text-sm bg-white border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeLanguage(index)}
                  className="sm:mt-6 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all self-end sm:self-center"
                >
                  <X size={18} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {languageFields.length === 0 && (
            <div className="py-8 flex flex-col items-center justify-center text-center bg-gray-50/30 rounded-2xl border border-dashed border-gray-200">
              <Globe size={24} className="text-gray-300 mb-2" />
              <p className="text-xs text-gray-400 font-medium">Chưa có thông tin ngoại ngữ.</p>
            </div>
          )}
        </div>
      </section>

      {/* Interests Section */}
      <section className="bg-white/60 backdrop-blur-3xl rounded-[1.5rem] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-gradient-to-br from-rose-100 to-orange-50 text-rose-600 rounded-xl shadow-sm border border-rose-100/50">
            <Heart size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Sở thích</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Chia sẻ đam mê và thói quen của bạn</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex gap-2 p-2 bg-gray-50/50 border border-gray-100 rounded-2xl">
            <input
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
              placeholder="Thêm sở thích (VD: Đọc sách, Đá bóng...)"
              className="flex-1 px-4 py-2.5 text-sm bg-white border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-400 transition-all outline-none"
            />
            <button
              type="button"
              onClick={addInterest}
              className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-500/20 hover:-translate-y-0.5"
            >
              Thêm
            </button>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <AnimatePresence>
              {interests.map((interest, index) => (
                <motion.span
                  layout
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  key={interest}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-150 rounded-full text-xs font-bold text-gray-700 shadow-sm group hover:border-rose-200 hover:bg-rose-50/30 transition-all"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  {interest}
                  <button
                    type="button"
                    onClick={() => removeInterest(index)}
                    className="p-0.5 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>
            {interests.length === 0 && (
              <p className="w-full text-center py-4 text-xs text-gray-400 italic">Chia sẻ một vài sở thích để nhà tuyển dụng hiểu bạn hơn.</p>
            )}
          </div>
        </div>
      </section>

      {/* Other Info Section */}
      <section className="bg-white/60 backdrop-blur-3xl rounded-[1.5rem] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-100 to-yellow-50 text-amber-600 rounded-xl shadow-sm border border-amber-100/50">
              <Lightbulb size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Thông tin khác</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Giải thưởng, hoạt động ngoại khóa hoặc thông tin khác</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => appendOtherInfo({ header: '', content: '' })}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg font-bold text-[11px] transition-all border border-amber-100 shadow-sm"
          >
            <Plus size={14} />
            Thêm mục
          </button>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {otherInfoFields.map((field, index) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={field.id} 
                className="p-5 bg-gray-50/50 border border-gray-100 rounded-[1.5rem] space-y-4 relative group hover:bg-white hover:border-amber-200 transition-all shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => removeOtherInfo(index)}
                  className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <X size={18} />
                </button>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-tight">Tiêu đề</label>
                  <input
                    {...register(`otherInfo.${index}.header`)}
                    placeholder="Ví dụ: Giải thưởng, Hoạt động xã hội..."
                    className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 transition-all outline-none font-bold text-gray-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-tight">Nội dung chi tiết</label>
                  <textarea
                    {...register(`otherInfo.${index}.content`)}
                    placeholder="Mô tả chi tiết nội dung này..."
                    rows={3}
                    className="w-full px-4 py-3 text-sm bg-white border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 transition-all outline-none resize-none leading-relaxed"
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {otherInfoFields.length === 0 && (
            <div className="py-10 flex flex-col items-center justify-center text-center bg-gray-50/30 rounded-[1.5rem] border border-dashed border-gray-200">
              <Lightbulb size={24} className="text-gray-300 mb-2" />
              <p className="text-xs text-gray-400 font-medium">Chưa có thông tin bổ sung.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
