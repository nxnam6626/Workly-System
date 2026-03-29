'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';

interface StatusBannerProps {
  type: 'success' | 'error' | 'info';
  message: string | null;
  onClose?: () => void;
}

const icons = {
  success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
  error: <XCircle className="w-5 h-5 text-rose-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
};

const styles = {
  success: 'bg-emerald-50 border-emerald-100 text-emerald-800',
  error: 'bg-rose-50 border-rose-100 text-rose-800',
  info: 'bg-blue-50 border-blue-100 text-blue-800',
};

export function StatusBanner({ type, message, onClose }: StatusBannerProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
          animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          className={`overflow-hidden border rounded-xl flex items-start gap-3 p-4 ${styles[type]}`}
        >
          <div className="mt-0.5">{icons[type]}</div>
          <div className="flex-grow">
            <p className="text-sm font-medium leading-relaxed">{message}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
