'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { useEffect } from 'react';
import { create } from 'zustand';

interface AlertPopupState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onConfirm?: () => void;
  show: (options: Omit<AlertPopupState, 'isOpen' | 'show' | 'hide'>) => void;
  hide: () => void;
}

export const useAlertPopup = create<AlertPopupState>((set) => ({
  isOpen: false,
  title: '',
  message: '',
  type: 'info',
  onConfirm: undefined,
  show: (options) => set({ ...options, isOpen: true }),
  hide: () => set({ isOpen: false, onConfirm: undefined }),
}));

export const globalAlert = {
  success: (title: string, message: string, onConfirm?: () => void) => 
    useAlertPopup.getState().show({ title, message, type: 'success', onConfirm }),
  error: (title: string, message: string, onConfirm?: () => void) => 
    useAlertPopup.getState().show({ title, message, type: 'error', onConfirm }),
  warning: (title: string, message: string, onConfirm?: () => void) => 
    useAlertPopup.getState().show({ title, message, type: 'warning', onConfirm }),
  info: (title: string, message: string, onConfirm?: () => void) => 
    useAlertPopup.getState().show({ title, message, type: 'info', onConfirm }),
};

export function AlertPopup() {
  const { isOpen, title, message, type, onConfirm, hide } = useAlertPopup();

  // Auto close success after 3s if no confirm action expected
  useEffect(() => {
    if (isOpen && type === 'success' && !onConfirm) {
      const timer = setTimeout(() => hide(), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, type, onConfirm, hide]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-16 h-16 text-emerald-500" />;
      case 'error':
        return <XCircle className="w-16 h-16 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-16 h-16 text-amber-500" />;
      case 'info':
        return <Info className="w-16 h-16 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success': return 'bg-emerald-500 hover:bg-emerald-600';
      case 'error': return 'bg-red-500 hover:bg-red-600';
      case 'warning': return 'bg-amber-500 hover:bg-amber-600';
      case 'info': return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={hide}
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl pointer-events-auto text-center relative"
            >
              <button 
                onClick={hide}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex justify-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                >
                  {getIcon()}
                </motion.div>
              </div>

              <h2 className="text-2xl font-bold text-slate-800 mb-2">{title}</h2>
              <p className="text-slate-600 mb-8 whitespace-pre-wrap">{message}</p>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    hide();
                    onConfirm?.();
                  }}
                  className={`px-8 py-3 rounded-xl text-white font-bold transition-colors w-full ${getBgColor()}`}
                >
                  {type === 'success' && !onConfirm ? 'Tuyệt vời' : 'Đóng'}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
