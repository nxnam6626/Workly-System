import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Loader2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title = 'Xác nhận',
  message,
  confirmLabel = 'Đồng ý',
  cancelLabel = 'Hủy',
  isDestructive = true,
  isLoading = false,
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <motion.div 
             initial={{ opacity: 0, scale: 0.95, y: 10 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             exit={{ opacity: 0, scale: 0.95, y: 10 }}
             className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col"
          >
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className={`text-xl font-bold flex items-center gap-2 ${isDestructive ? 'text-red-600' : 'text-slate-800'}`}>
                {isDestructive && <AlertCircle className="w-5 h-5" />}
                {title}
              </h2>
              <button 
                onClick={onCancel}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                disabled={isLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 text-slate-600 leading-relaxed">
              {message}
            </div>

            <div className="px-6 py-5 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
               <button 
                 onClick={onCancel}
                 disabled={isLoading}
                 className="px-5 h-10 rounded-xl border border-slate-200 font-medium text-slate-600 hover:bg-slate-100 transition-colors"
               >
                 {cancelLabel}
               </button>
               <button 
                 onClick={onConfirm}
                 disabled={isLoading}
                 className={`px-5 h-10 rounded-xl text-white font-medium disabled:opacity-50 transition-colors shadow-md flex items-center gap-2 ${
                   isDestructive ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30'
                 }`}
               >
                 {isLoading && <Loader2 className="w-4 h-4 animate-spin"/>}
                 {!isLoading && confirmLabel}
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
