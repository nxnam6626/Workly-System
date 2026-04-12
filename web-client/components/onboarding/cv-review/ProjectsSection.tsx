import React, { useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Code, Trash2, ChevronDown, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { FormValues } from '@/lib/schemas/cv-onboarding';
import { AutoResizeTextarea } from '@/components/ui/auto-resize-textarea';

export function ProjectsSection() {
  const { register, control, watch } = useFormContext<FormValues>();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const { fields: projectFields, append: appendProject, remove: removeProject } = useFieldArray({
    control,
    name: 'projects',
  });

  const toggle = (i: number) => setOpenIndex(prev => prev === i ? null : i);

  return (
    <section className="relative overflow-hidden bg-white/60 backdrop-blur-3xl rounded-[1.5rem] p-5 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-white transition-all duration-500">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-purple-100 to-indigo-50 text-purple-600 rounded-lg shadow-sm border border-purple-100/50">
            <Code size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 leading-none">Dự án tiêu biểu</h2>
            {projectFields.length > 0 && (
              <p className="text-[10px] text-gray-400 mt-0.5">{projectFields.length} dự án · Nhấn để mở rộng</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            appendProject({ projectName: '', description: '', role: '', technology: '' });
            setOpenIndex(projectFields.length);
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold hover:bg-purple-100 transition-colors"
        >
          <Plus size={12} /> Thêm
        </button>
      </div>

      {projectFields.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
          <Code size={24} className="text-gray-300 mb-2" />
          <p className="text-gray-400 text-xs font-medium">Chưa có dự án nào.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {projectFields.map((field, index) => {
            const isOpen = openIndex === index;
            const projectName = watch(`projects.${index}.projectName`);
            const role = watch(`projects.${index}.role`);
            const technology = watch(`projects.${index}.technology`);

            return (
              <div
                key={field.id}
                className={`rounded-xl border transition-all duration-200 ${isOpen ? 'border-purple-200 bg-white shadow-sm' : 'border-gray-100 bg-white/50 hover:border-gray-200'
                  }`}
              >
                {/* Collapsed header */}
                <div
                  onClick={() => toggle(index)}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isOpen ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {projectName || 'Chưa có tên dự án'}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">
                      {[role, technology].filter(Boolean).join(' · ') || 'Chưa có thông tin'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeProject(index); }}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                    <ChevronDown
                      size={16}
                      className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                </div>

                {/* Expanded form */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 space-y-3">

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tên dự án</label>
                          <input
                            {...register(`projects.${index}.projectName`)}
                            className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 focus:bg-white outline-none transition-all"
                            placeholder="Tên dự án..."
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Vai trò</label>
                          <input
                            {...register(`projects.${index}.role`)}
                            className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 focus:bg-white outline-none transition-all"
                            placeholder="Fullstack, Frontend..."
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Công nghệ sử dụng</label>
                          <AutoResizeTextarea
                            {...register(`projects.${index}.technology`)}
                            rows={1}
                            className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 focus:bg-white outline-none transition-colors"
                            placeholder="React, Node.js, MongoDB..."
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mô tả dự án</label>
                          <AutoResizeTextarea
                            {...register(`projects.${index}.description`)}
                            rows={3}
                            className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 focus:bg-white outline-none transition-colors"
                            placeholder="Mô tả ngắn gọn về dự án..."
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
