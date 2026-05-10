"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'warning' | 'danger' | 'info';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Xác nhận hành động",
  message,
  confirmLabel = "Đồng ý",
  cancelLabel = "Hủy",
  type = "warning"
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const getColors = () => {
    switch (type) {
      case 'danger': return { bg: 'bg-red-500', text: 'text-red-600', iconBg: 'bg-red-100', btn: 'bg-red-600 hover:bg-red-700 shadow-red-600/20' };
      case 'info': return { bg: 'bg-indigo-500', text: 'text-indigo-600', iconBg: 'bg-indigo-100', btn: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20' };
      default: return { bg: 'bg-amber-500', text: 'text-amber-600', iconBg: 'bg-amber-100', btn: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20' };
    }
  };

  const colors = getColors();

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0f172a]/70 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            className="relative w-full max-w-sm bg-white rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.25)] border border-white/20 overflow-hidden z-10"
          >
            <div className="p-6 text-center flex flex-col items-center">
              <div className={`w-14 h-14 ${colors.iconBg} rounded-2xl flex items-center justify-center mb-4 shadow-inner`}>
                <AlertTriangle className={`w-7 h-7 ${colors.text}`} />
              </div>
              
              <h3 className="text-lg font-black text-slate-900 mb-2 tracking-tight">{title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line px-2">
                {message}
              </p>
            </div>
            
            <div className="flex gap-3 p-4 bg-slate-50/80 border-t border-slate-100">
              <button 
                onClick={onClose}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all active:scale-95"
              >
                {cancelLabel}
              </button>
              <button 
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 py-3 ${colors.btn} text-white rounded-xl font-bold text-sm shadow-lg transition-all active:scale-95 hover:opacity-95`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
