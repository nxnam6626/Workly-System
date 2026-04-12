'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone, DropzoneState } from 'react-dropzone';
import { Upload, FileText, X, CheckCircle2, Loader2, AlertCircle, Sparkles, Bot, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CvDropzoneProps {
  onUpload: (file: File) => void;
  isLoading: boolean;
}

import { AIScanner } from '@/components/ui/ai-scanner';

export const CvDropzone: React.FC<CvDropzoneProps> = ({ onUpload, isLoading }) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const droppedFile = acceptedFiles[0];
    if (droppedFile) {
      if (droppedFile.type !== 'application/pdf') {
        setError('Vui lòng chỉ tải lên tệp định dạng PDF.');
        return;
      }
      setFile(droppedFile);
      setError(null);
    }
  }, []);

  const dropzone = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    disabled: isLoading,
    noClick: file !== null,
    noKeyboard: file !== null,
  });

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setError(null);
  };

  const handleChangeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    dropzone.open();
  };

  const handleManualUpload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...dropzone.getRootProps()}
        className={`relative group cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-500 min-h-[300px] flex flex-col items-center justify-center p-8 bg-white/60 backdrop-blur-md shadow-sm
          ${dropzone.isDragActive ? 'border-sky-500 bg-sky-50/80 scale-[1.02] shadow-[0_0_40px_rgba(14,165,233,0.15)] ring-4 ring-sky-500/10' : 'border-gray-200 hover:border-sky-300 hover:bg-gray-50/80'}
          ${error ? 'border-red-400 bg-red-50/80' : ''}
          ${(isLoading || file) ? 'cursor-default pointer-events-auto' : ''}
          ${isLoading ? 'opacity-90' : ''}
        `}
      >
        <input {...dropzone.getInputProps()} />

        <AnimatePresence mode="wait">
          {!file && !isLoading && <DropzoneIdle isDragActive={dropzone.isDragActive} key="idle" />}
          {isLoading && <DropzoneLoading key="loading" />}
          {file && !isLoading && (
            <DropzonePreview
              file={file}
              onRemove={removeFile}
              onChangeFile={handleChangeFile}
              onUpload={handleManualUpload}
              key="preview"
            />
          )}
        </AnimatePresence>

        {error && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-6 left-0 right-0 px-8 pointer-events-none"
          >
            <div className="flex items-center justify-center gap-2 max-w-sm mx-auto p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-medium shadow-sm">
              <AlertCircle size={18} strokeWidth={2.5} className="shrink-0" />
              <span>{error}</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// --- INTERNAL SUB-COMPONENTS ---

function DropzoneIdle({ isDragActive }: { isDragActive: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col items-center text-center space-y-4"
    >
      <div className={`p-4 rounded-full transition-all duration-500 ${isDragActive ? 'bg-sky-500 text-white scale-110 shadow-lg shadow-sky-500/30' : 'bg-sky-50 text-sky-500 group-hover:scale-105 group-hover:bg-sky-100 group-hover:shadow-md'}`}>
        <Upload size={44} strokeWidth={1.5} className={isDragActive ? 'animate-bounce' : ''} />
      </div>
      <div className="space-y-1.5">
        <h3 className={`text-xl font-bold transition-colors tracking-tight ${isDragActive ? 'text-sky-600' : 'text-gray-900'}`}>
          {isDragActive ? 'Thả CV vào đây!' : 'Kéo thả CV của bạn vào đây'}
        </h3>
        <p className="text-gray-500 max-w-sm mx-auto text-sm leading-relaxed">
          Tải lên CV định dạng PDF. AI sẽ tự động bóc tách thông tin giúp bạn hoàn thiện hồ sơ.
        </p>
      </div>
      <div className={`mt-5 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-sm
        ${isDragActive
          ? 'bg-sky-500 text-white shadow-sky-500/25'
          : 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow-md hover:-translate-y-0.5 group-hover:bg-sky-600'
        }`}
      >
        <Upload size={16} strokeWidth={2.5} />
        <span>Chọn tệp trên máy tính</span>
      </div>
    </motion.div>
  );
}

function DropzoneLoading() {
  const steps = [
    'Đọc và nhận dạng nội dung CV...',
    'Trích xuất kỹ năng & kinh nghiệm...',
    'Phân tích học vấn & dự án...',
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center w-full max-w-sm mx-auto gap-5"
    >
      {/* Header section: Animation on left, Text on right */}
      <div className="flex items-center justify-center w-full mb-2 gap-5 px-2">
        <AIScanner />

        {/* Title & description */}
        <div className="text-left space-y-1">
          <h3 className="text-base font-bold text-gray-900 tracking-tight">AI đang phân tích CV của bạn</h3>
          <p className="text-xs text-gray-400">Quá trình này có thể mất vài giây</p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="w-full space-y-2">
        {steps.map((label, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 1.8, duration: 0.4 }}
            className="flex items-center gap-2.5 px-3 py-1.5 bg-white border border-gray-100 rounded-xl shadow-sm"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 1.8 + 0.2, type: 'spring' }}
              className="w-4 h-4 rounded-full bg-sky-100 flex items-center justify-center shrink-0"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            </motion.div>
            <span className="text-xs text-gray-700 font-medium">{label}</span>
          </motion.div>
        ))}
      </div>

      {/* Simple progress bar */}
      <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden mt-1">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 8, ease: 'linear' }}
          className="h-full bg-sky-500 rounded-full"
        />
      </div>
    </motion.div>
  );
}

function DropzonePreview({ file, onRemove, onChangeFile, onUpload }: { file: File, onRemove: (e: React.MouseEvent) => void, onChangeFile: (e: React.MouseEvent) => void, onUpload: (e: React.MouseEvent) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col sm:flex-row items-center sm:items-stretch justify-center gap-5 w-full max-w-lg mx-auto p-1"
    >


      <div className="w-full sm:w-1/2 relative p-5 rounded-[1.25rem] bg-gradient-to-b from-white to-sky-50/50 border border-sky-100 shadow-[0_4px_20px_rgb(0,0,0,0.04)] flex flex-col items-center group/file cursor-default hover:shadow-[0_4px_20px_rgb(14,165,233,0.08)] transition-all">
        <div className="relative mb-3">
          <div className="absolute inset-0 bg-sky-200 blur-xl opacity-20 rounded-full"></div>
          <FileText className="w-12 h-12 text-sky-500 drop-shadow-sm group-hover/file:scale-105 transition-transform duration-500 relative z-10" strokeWidth={1.5} />
        </div>

        <button
          onClick={onRemove}
          className="absolute top-2.5 right-2.5 p-1 bg-white border border-gray-200 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 shadow-sm transition-all z-20 tooltip"
          title="Hủy tệp này"
        >
          <X size={14} strokeWidth={2.5} />
        </button>

        <div className="space-y-1 w-full text-center">
          <p className="text-[10px] font-black text-sky-600 flex items-center justify-center gap-1 bg-sky-50 inline-flex px-2 py-0.5 rounded-full border border-sky-100 uppercase tracking-wider">
            <CheckCircle2 size={12} strokeWidth={3} /> Đã chọn thành công
          </p>
          <h3 className="text-sm font-bold text-gray-900 truncate px-1 mt-1" title={file.name}>{file.name}</h3>
          <p className="text-xs text-gray-500 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB <span className="mx-1 font-bold opacity-30">•</span> PDF</p>
        </div>
      </div>
      <div className="flex flex-col justify-center items-center w-full sm:w-1/2 space-y-3">
        <button
          onClick={onUpload}
          className="w-full max-w-[180px] py-2.5 text-[13px] bg-black hover:bg-sky-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 hover:shadow-sky-500/30 hover:-translate-y-0.5 transition-all duration-300 group/btn"
        >
          <span>Bắt đầu phân tích</span>
        </button>

        <button
          onClick={onChangeFile}
          className="text-[11px] font-semibold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-wide underline underline-offset-4"
        >
          Chọn tệp khác
        </button>
      </div>
    </motion.div>
  );
}

