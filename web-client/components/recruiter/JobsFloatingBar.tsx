import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Pause, Trash2, Play, X } from 'lucide-react';
import { ActionType, TabType } from '@/types/job';

interface JobsFloatingBarProps {
  selectedIds: string[];
  activeTab: TabType;
  setIsBulk: (isBulk: boolean) => void;
  setActionState: (state: { id?: string, type: ActionType } | null) => void;
  setSelectedIds: (ids: string[]) => void;
}

export const JobsFloatingBar = ({
  selectedIds,
  activeTab,
  setIsBulk,
  setActionState,
  setSelectedIds
}: JobsFloatingBarProps) => {
  return (
    <AnimatePresence>
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
        >
          <div className="bg-slate-900 text-white rounded-[2rem] shadow-2xl p-4 flex items-center justify-between border border-white/10 backdrop-blur-xl bg-slate-900/90">
            <div className="flex items-center gap-4 pl-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Check className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-indigo-300">Đang chọn</p>
                <p className="text-lg font-bold">{selectedIds.length} <span className="text-slate-400 text-sm font-medium">tin tuyển dụng</span></p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeTab === 'ACTIVE' && (
                <>
                  <button
                    onClick={() => { setIsBulk(true); setActionState({ type: 'PAUSE' }); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-amber-500 text-white rounded-xl font-bold text-xs transition-all uppercase tracking-wider"
                  >
                    <Pause className="w-4 h-4" /> Tạm dừng
                  </button>
                  <button
                    onClick={() => { setIsBulk(true); setActionState({ type: 'CLOSE' }); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-red-500 text-white rounded-xl font-bold text-xs transition-all uppercase tracking-wider"
                  >
                    <Trash2 className="w-4 h-4" /> Kết thúc
                  </button>
                </>
              )}
              {activeTab === 'PAUSED' && (
                <>
                  <button
                    onClick={() => { setIsBulk(true); setActionState({ type: 'RESUME' }); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold text-xs transition-all uppercase tracking-wider shadow-lg shadow-indigo-500/20"
                  >
                    <Play className="w-4 h-4" /> Mở lại
                  </button>
                  <button
                    onClick={() => { setIsBulk(true); setActionState({ type: 'CLOSE' }); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-red-500 text-white rounded-xl font-bold text-xs transition-all uppercase tracking-wider"
                  >
                    <Trash2 className="w-4 h-4" /> Kết thúc
                  </button>
                </>
              )}
              
              <div className="w-px h-8 bg-white/10 mx-2" />
              
              <button
                onClick={() => setSelectedIds([])}
                className="p-2.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all"
                title="Bỏ chọn tất cả"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
