'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, CheckCircle2, Loader2, AlertCircle, Sparkles, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CvDropzoneProps {
  onUpload: (file: File) => void;
  onManualEntry: () => void;
  isLoading: boolean;
  apiError?: any;
  onClearError?: () => void;
}

import { AIScanner } from '@/components/ui/ai-scanner';

export const CvDropzone: React.FC<CvDropzoneProps> = ({ onUpload, onManualEntry, isLoading, apiError, onClearError }) => {
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const droppedFile = acceptedFiles[0];
    if (droppedFile) {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(droppedFile.type)) {
        setLocalError('Vui lòng tải lên tệp định dạng PDF hoặc Word (.doc, .docx).');
        return;
      }
      setFile(droppedFile);
      setLocalError(null);
    }
  }, []);

  const dropzone = useDropzone({
    onDrop,
    accept: { 
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false,
    disabled: isLoading,
    noClick: file !== null || !!apiError,
    noKeyboard: file !== null || !!apiError,
  });

  const removeFile = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFile(null);
    setLocalError(null);
    onClearError?.();
  };

  const handleChangeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeFile();
    setTimeout(() => dropzone.open(), 100);
  };

  const handleRetry = (e?: React.MouseEvent) => {
    removeFile(e);
    setTimeout(() => dropzone.open(), 100);
  };

  const handleManualUpload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (file) {
      onUpload(file);
    }
  };

  const displayError = localError || (typeof apiError === 'string' ? apiError : apiError?.message);

  return (
    <div className="w-full max-w-lg mx-auto">
      <div
        {...dropzone.getRootProps()}
        className={`relative group overflow-hidden rounded-[2rem] border-2 border-dashed transition-all duration-700 min-h-[320px] flex flex-col items-center justify-center p-6 bg-white/40 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]
          ${dropzone.isDragActive ? 'border-sky-500 bg-sky-50/50 scale-[1.01] shadow-[0_20px_50px_rgba(14,165,233,0.1)] ring-8 ring-sky-500/5' : 'border-gray-200/60 hover:border-sky-300/80 hover:bg-white/60'}
          ${displayError ? 'border-rose-200 bg-rose-50/30' : ''}
          ${(isLoading || file || apiError) ? 'cursor-default pointer-events-auto' : 'cursor-pointer'}
          ${isLoading ? 'opacity-95' : ''}
        `}
      >
        <input {...dropzone.getInputProps()} />

        <AnimatePresence mode="wait">
          {apiError ? (
            <DropzoneError 
              error={apiError} 
              onRetry={handleRetry} 
              onManualEntry={onManualEntry}
              key="api-error" 
            />
          ) : isLoading ? (
            <DropzoneLoading onManualEntry={onManualEntry} key="loading" />
          ) : file ? (
            <DropzonePreview
              file={file}
              onRemove={removeFile}
              onChangeFile={handleChangeFile}
              onUpload={handleManualUpload}
              key="preview"
            />
          ) : (
            <DropzoneIdle isDragActive={dropzone.isDragActive} onManualEntry={onManualEntry} key="idle" />
          )}
        </AnimatePresence>

        {localError && !isLoading && !apiError && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute bottom-8 left-0 right-0 px-8 pointer-events-none"
          >
            <div className="flex items-center justify-center gap-2.5 max-w-sm mx-auto p-4 bg-white/90 backdrop-blur-md border border-rose-100 rounded-2xl text-rose-600 text-[13px] font-bold shadow-xl shadow-rose-500/5 ring-1 ring-rose-500/10">
              <AlertCircle size={18} strokeWidth={2.5} className="shrink-0" />
              <span>{localError}</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// --- INTERNAL SUB-COMPONENTS ---

function DropzoneIdle({ isDragActive, onManualEntry }: { isDragActive: boolean; onManualEntry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center text-center space-y-5"
    >
      <div className="relative">
        <motion.div
          animate={isDragActive ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
          className={`p-5 rounded-[1.5rem] transition-all duration-700 ${isDragActive ? 'bg-sky-500 text-white scale-110 shadow-2xl shadow-sky-500/40 rotate-6' : 'bg-gradient-to-br from-sky-50 to-white text-sky-500 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-sky-500/10 border border-sky-100/50'}`}
        >
          <Upload size={36} strokeWidth={1.5} className={isDragActive ? 'animate-pulse' : ''} />
        </motion.div>
        {!isDragActive && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white"
          >
            <Sparkles size={10} fill="currentColor" />
          </motion.div>
        )}
      </div>

      <div className="space-y-1.5">
        <h3 className={`text-lg font-black transition-colors tracking-tight ${isDragActive ? 'text-sky-600' : 'text-slate-900'}`}>
          {isDragActive ? 'Thả để bóc tách ngay!' : 'Tải lên CV của bạn'}
        </h3>
        <p className="text-slate-500 max-w-[280px] mx-auto text-[12px] leading-relaxed font-medium">
          Hệ thống AI sẽ tự động đọc và nhận diện kỹ năng, kinh nghiệm từ file PDF/Word.
        </p>
      </div>

      <div className={`flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl text-[14px] font-black transition-all duration-500 shadow-lg
        ${isDragActive
          ? 'bg-sky-500 text-white shadow-sky-500/30 scale-105'
          : 'bg-slate-900 text-white hover:bg-sky-600 hover:shadow-sky-500/20 hover:-translate-y-1'
        }`}
      >
        <Upload size={16} strokeWidth={2.5} />
        <span>Chọn tệp tin</span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onManualEntry();
        }}
        className="text-[12px] font-bold text-slate-400 hover:text-sky-500 transition-colors underline underline-offset-4 decoration-slate-200 hover:decoration-sky-500/30"
      >
        Hoặc nhập thủ công
      </button>
    </motion.div>
  );
}

function DropzoneError({ error, onRetry, onManualEntry }: { error: any; onRetry: () => void; onManualEntry: () => void }) {
  const message = typeof error === 'string' ? error : error.message;
  const missingFields = error.missingFields || [];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      className="flex flex-col items-center text-center space-y-6 p-4"
    >
      <div className="relative">
        <div className="p-6 rounded-[2rem] bg-rose-50 text-rose-500 border border-rose-100 shadow-xl shadow-rose-500/5">
          <AlertCircle size={48} strokeWidth={1.5} />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-black text-slate-900 tracking-tight">
          Phân tích thất bại
        </h3>
        <p className="text-rose-600/80 max-w-sm mx-auto text-[13px] font-bold leading-relaxed px-4 py-2 bg-rose-50/50 rounded-xl border border-rose-100/50">
          {message}
        </p>
        
        {missingFields.length > 0 && (
          <div className="text-left bg-white/50 backdrop-blur-sm rounded-2xl border border-rose-100/50 p-4 w-full max-w-xs mx-auto space-y-2">
            <p className="text-[11px] font-black text-rose-500 uppercase tracking-widest text-center">Các trường còn thiếu:</p>
            <div className="grid grid-cols-1 gap-1.5">
              {missingFields.map((field: string, i: number) => (
                <div key={i} className="flex items-center gap-2 text-[12px] text-slate-600 font-bold">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  {field}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <button
          onClick={onRetry}
          className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[14px] font-black hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
        >
          Thử tệp khác
        </button>
        <button
          onClick={onManualEntry}
          className="px-8 py-3 bg-white text-slate-900 border border-slate-200 rounded-2xl text-[14px] font-black hover:bg-slate-50 transition-all shadow-sm active:scale-95"
        >
          Nhập thủ công
        </button>
      </div>
    </motion.div>
  );
}

function DropzoneLoading({ onManualEntry }: { onManualEntry: () => void }) {
  const steps = [
    'Đang đọc cấu trúc tệp...',
    'Trích xuất văn bản thô...',
    'AI đang nhận diện CV...',
    'Bóc tách thông tin chi tiết...',
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center w-full max-w-sm mx-auto gap-8"
    >
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <AIScanner />
          <motion.div
            animate={{ 
              boxShadow: ['0 0 20px rgba(14,165,233,0.1)', '0 0 40px rgba(14,165,233,0.3)', '0 0 20px rgba(14,165,233,0.1)'] 
            }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 rounded-full"
          />
        </div>

        <div className="text-center space-y-1">
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Hệ thống đang xử lý</h3>
          <p className="text-xs text-slate-400 font-medium">Vui lòng đợi trong giây lát...</p>
        </div>
      </div>

      <div className="w-full space-y-2.5">
        {steps.map((label, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 1.5, duration: 0.5 }}
            className="flex items-center gap-3 px-4 py-2 bg-white/60 border border-sky-100/50 rounded-2xl shadow-sm backdrop-blur-sm"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ repeat: Infinity, duration: 2, delay: i * 0.5 }}
              className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)]"
            />
            <span className="text-[13px] text-slate-600 font-bold">{label}</span>
          </motion.div>
        ))}
      </div>

      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 10, ease: 'linear' }}
          className="h-full bg-gradient-to-r from-sky-400 to-sky-600 rounded-full"
        />
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onManualEntry();
        }}
        className="text-[11px] font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
      >
        Dừng lại & Nhập thủ công
      </button>
    </motion.div>
  );
}

function DropzonePreview({ file, onRemove, onChangeFile, onUpload }: { file: File, onRemove: (e: React.MouseEvent) => void, onChangeFile: (e: React.MouseEvent) => void, onUpload: (e: React.MouseEvent) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="flex flex-col items-center gap-6 w-full max-w-[300px]"
    >
      <div className="w-full relative p-6 rounded-[2rem] bg-white border border-slate-200/60 shadow-2xl shadow-slate-200/40 flex flex-col items-center group/file overflow-hidden">
        <div className="relative mb-5">
          <div className="w-16 h-16 bg-sky-50 rounded-2xl border border-sky-100 flex items-center justify-center shadow-sm group-hover/file:-translate-y-1 transition-transform duration-500">
            <FileText size={32} className="text-sky-500" strokeWidth={1.5} />
          </div>
        </div>

        <button
          onClick={onRemove}
          className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-md border border-slate-100 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100 shadow-sm transition-all z-20 group/close"
        >
          <X size={16} strokeWidth={2.5} className="group-hover/close:rotate-90 transition-transform" />
        </button>

        <div className="space-y-2 w-full text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
             <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full border border-emerald-100 flex items-center gap-1.5 uppercase tracking-wider">
               <CheckCircle2 size={12} strokeWidth={3} /> Sẵn sàng
             </span>
          </div>
          <h3 className="text-[15px] font-black text-slate-900 truncate px-2" title={file.name}>{file.name}</h3>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
            {(file.size / 1024 / 1024).toFixed(2)} MB • {file.name.split('.').pop()}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 w-full">
        <button
          onClick={onUpload}
          className="w-full py-3 px-6 bg-slate-900 hover:bg-sky-600 text-white rounded-2xl font-black text-[14px] flex items-center justify-center gap-2.5 shadow-xl shadow-slate-200 hover:shadow-sky-500/25 hover:-translate-y-0.5 transition-all duration-300 whitespace-nowrap"
        >
          <BrainCircuit size={18} />
          <span>Bắt đầu phân tích</span>
        </button>

        <button
          onClick={onChangeFile}
          className="py-2 text-[12px] font-bold text-slate-400 hover:text-slate-900 transition-colors flex items-center gap-1.5 group/retry"
        >
          <span className="opacity-0 group-hover/retry:opacity-100 transition-opacity">←</span>
          Chọn tệp khác
        </button>
      </div>
    </motion.div>
  );
}

