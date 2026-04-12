import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Code, X, Plus } from 'lucide-react';
import { FormValues } from '@/lib/schemas/cv-onboarding';

const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;

const LEVEL_CONFIG = {
  BEGINNER: { label: 'Cơ bản', bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400', order: 3 },
  INTERMEDIATE: { label: 'Khá', bg: 'bg-sky-50', text: 'text-sky-600', dot: 'bg-sky-500', order: 2 },
  ADVANCED: { label: 'Tốt', bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500', order: 1 },
};

export function SkillsSection() {
  const { formState: { errors }, watch, setValue } = useFormContext<FormValues>();
  const [newSkill, setNewSkill] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<typeof LEVELS[number]>('BEGINNER');
  const [duplicateMsg, setDuplicateMsg] = useState('');

  // Editing state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const skills = watch('skills') || [];

  const handleSubmitSkill = () => {
    if (newSkill.trim()) {
      const skillName = newSkill.trim();

      if (editingIndex !== null) {
        if (skills.some((s, i) => i !== editingIndex && s.skillName.toLowerCase() === skillName.toLowerCase())) {
          setDuplicateMsg(`"${skillName}" đã tồn tại trong danh sách`);
          setTimeout(() => setDuplicateMsg(''), 2500);
          return;
        }
        const newSkills = [...skills];
        newSkills[editingIndex] = { skillName, level: newSkillLevel };
        setValue('skills', newSkills);
        setEditingIndex(null);
      } else {
        if (skills.some(s => s.skillName.toLowerCase() === skillName.toLowerCase())) {
          setDuplicateMsg(`"${skillName}" đã tồn tại trong danh sách`);
          setTimeout(() => setDuplicateMsg(''), 2500);
          return;
        }
        setValue('skills', [{ skillName, level: newSkillLevel }, ...skills]);
      }
      
      setNewSkill('');
      setNewSkillLevel('BEGINNER');
      setDuplicateMsg('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmitSkill();
    } else if (e.key === 'Escape' && editingIndex !== null) {
      handleCancelEdit();
    }
  };

  const removeSkill = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setValue('skills', skills.filter((_, i) => i !== index));
    if (editingIndex === index) {
      handleCancelEdit();
    }
  };

  const handleEditClick = (index: number) => {
    setEditingIndex(index);
    setNewSkill(skills[index].skillName);
    setNewSkillLevel(skills[index].level as typeof LEVELS[number]);
    setDuplicateMsg('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setNewSkill('');
    setNewSkillLevel('BEGINNER');
    setDuplicateMsg('');
  };

  // Sort skills: ADVANCED → INTERMEDIATE → BEGINNER, then alphabetically
  const sortedSkills = [...skills]
    .map((s, i) => ({ ...s, originalIndex: i }))
    .sort((a, b) => {
      const orderA = (LEVEL_CONFIG[a.level as keyof typeof LEVEL_CONFIG] || LEVEL_CONFIG.BEGINNER).order;
      const orderB = (LEVEL_CONFIG[b.level as keyof typeof LEVEL_CONFIG] || LEVEL_CONFIG.BEGINNER).order;
      if (orderA !== orderB) return orderA - orderB;
      return a.skillName.localeCompare(b.skillName);
    });

  return (
    <section className="relative overflow-hidden bg-white/60 backdrop-blur-3xl rounded-[1.5rem] p-5 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-indigo-100 to-violet-50 text-indigo-600 rounded-lg shadow-sm border border-indigo-100/50">
            <Code size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 leading-none">Kỹ năng chuyên môn</h2>
            {skills.length > 0 && (
              <p className="text-[10px] text-gray-400 mt-0.5">{skills.length} kỹ năng · Nhấn cấp độ để thay đổi</p>
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit Input Panel */}
      <div className={`mb-5 p-3 rounded-2xl border transition-all duration-300 ${
        editingIndex !== null ? 'bg-indigo-50/50 border-indigo-200' : 'bg-gray-50/50 border-gray-100'
      }`}>
        <div className="flex flex-col xl:flex-row gap-3 items-start xl:items-center">
          {/* Input Area */}
          <div className="relative flex-1 w-full">
            <Plus size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-transform duration-300 ${
              editingIndex !== null ? 'text-indigo-400 rotate-45' : 'text-gray-400'
            }`} />
            <input
              value={newSkill}
              onChange={(e) => { setNewSkill(e.target.value); setDuplicateMsg(''); }}
              onKeyDown={handleKeyDown}
              className={`w-full pl-10 pr-4 py-2.5 text-sm bg-white border rounded-xl focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-400 transition-all outline-none ${
                duplicateMsg ? 'border-amber-300 shadow-[0_0_0_4px_rgba(252,211,77,0.15)]' : 'border-gray-200 shadow-sm'
              }`}
              placeholder={editingIndex !== null ? "Đổi tên kỹ năng (Enter để lưu)..." : "Tên kỹ năng (VD: React, Node.js)..."}
            />
          </div>

          {/* Controls Area: Segmented Level Picker & Buttons */}
          <div className="flex items-center justify-between xl:justify-start w-full xl:w-auto gap-3">
            {/* Level segmented control */}
            <div className="flex items-center p-1 bg-white border border-gray-200 rounded-xl shadow-sm shrink-0">
              {LEVELS.map(level => {
                 const config = LEVEL_CONFIG[level];
                 const isActive = newSkillLevel === level;
                 return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setNewSkillLevel(level)}
                      className={`px-3 sm:px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 ${
                        isActive ? `${config.bg} ${config.text} shadow-sm ring-1 ring-inset ring-${config.text.split('-')[1]}-200` : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {config.label}
                    </button>
                 );
              })}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
               {editingIndex !== null && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3 py-2 text-gray-500 bg-white border border-gray-200 rounded-xl text-xs font-bold hover:bg-gray-50 hover:text-gray-700 transition-colors"
                >
                  Hủy
                </button>
              )}
              <button
                type="button"
                onClick={handleSubmitSkill}
                className={`px-4 py-2 shadow-md rounded-xl text-xs font-bold transition-all ${
                  editingIndex !== null 
                    ? 'bg-indigo-600 text-white shadow-indigo-500/20 hover:bg-indigo-700 hover:-translate-y-0.5' 
                    : 'bg-slate-800 text-white shadow-slate-800/20 hover:bg-slate-900 hover:-translate-y-0.5'
                }`}
              >
                {editingIndex !== null ? 'Cập nhật' : 'Thêm'}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {duplicateMsg && (
          <div className="mt-2.5 mx-1 pt-2.5 border-t border-amber-200/50 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <p className="text-[11px] text-amber-600 font-bold uppercase tracking-wide">
              {duplicateMsg}
            </p>
          </div>
        )}
      </div>

      {/* Skills as chips */}
      {skills.length === 0 ? (
        <div className="py-6 flex flex-col items-center justify-center text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
          <Code size={20} className="text-gray-300 mb-1.5" />
          <p className="text-xs text-gray-400 font-medium">Chưa có kỹ năng nào.</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {sortedSkills.map((skill) => {
            const config = LEVEL_CONFIG[skill.level as keyof typeof LEVEL_CONFIG] || LEVEL_CONFIG.BEGINNER;
            const origIdx = skill.originalIndex;

            return (
              <div
                key={`${skill.skillName}-${origIdx}`}
                onClick={() => handleEditClick(origIdx)}
                className={`group flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 border rounded-full shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                  editingIndex === origIdx ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20' : 'bg-white border-gray-150'
                }`}
                title="Nhấn để sửa kỹ năng"
              >
                {/* Skill name */}
                <span className="text-xs font-semibold text-gray-700 pointer-events-none">{skill.skillName}</span>

                {/* Level badge */}
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold pointer-events-none ${config.bg} ${config.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                  {config.label}
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={(e) => removeSkill(origIdx, e)}
                  className="p-0.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {errors.skills && <p className="text-[10px] text-red-500 italic mt-2">{errors.skills.message}</p>}
    </section>
  );
}
