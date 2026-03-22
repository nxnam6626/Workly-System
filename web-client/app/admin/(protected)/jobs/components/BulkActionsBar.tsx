'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Trash2, XCircle, Loader2 } from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  onBulkApprove: () => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  isProcessing: boolean;
}

export default function BulkActionsBar({
  selectedCount,
  onBulkApprove,
  onBulkDelete,
  onClearSelection,
  isProcessing,
}: BulkActionsBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="flex items-center justify-between p-3 bg-indigo-600 rounded-xl text-white shadow-lg overflow-hidden"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-sm">{selectedCount}</div>
            <span className="text-sm font-semibold text-white">Tin tuyển dụng đã chọn</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onBulkApprove}
              disabled={isProcessing}
              className="px-4 py-1.5 bg-white text-indigo-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Duyệt tất cả
            </button>
            <button
              onClick={onBulkDelete}
              disabled={isProcessing}
              className="px-4 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-400 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Xóa đã chọn
            </button>
            <button onClick={onClearSelection} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
