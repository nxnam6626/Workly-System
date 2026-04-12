import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FileText } from 'lucide-react';
import { FormValues } from '@/lib/schemas/cv-onboarding';
import { AutoResizeTextarea } from '@/components/ui/auto-resize-textarea';

export function SummarySection() {
  const { register } = useFormContext<FormValues>();

  return (
    <section className="relative overflow-hidden bg-white/60 backdrop-blur-3xl rounded-[1.5rem] p-5 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-white transition-all duration-500">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-2 bg-gradient-to-br from-rose-100 to-red-50 text-rose-600 rounded-lg shadow-sm border border-rose-100/50">
          <FileText size={16} />
        </div>
        <h2 className="text-lg font-bold text-gray-900 leading-none">Giới thiệu bản thân</h2>
      </div>

      <div className="space-y-1">
        <AutoResizeTextarea
          {...register('summary')}
          rows={3}
          className="w-full px-4 py-3 text-sm bg-white/80 border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-sky-500/15 focus:border-sky-500 focus:bg-white transition-colors outline-none"
          placeholder="Viết một đoạn giới thiệu ngắn gọn về bản thân, mục tiêu nghề nghiệp và định hướng điểm mạnh của bạn..."
        />
      </div>
    </section>
  );
}
