'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Trash2,
  Loader2,
  Tag,
  AlertCircle,
  Filter,
  Star,
} from 'lucide-react';
import {
  filterRulesApi,
  FilterRule,
  CreateFilterRuleDto,
} from '@/lib/crawler-admin';

interface Props {
  sourceId: number;
  sourceName: string;
  onClose: () => void;
}

const emptyRule: CreateFilterRuleDto = {
  keyword: '',
  action: 'EXCLUDE',
  minReliabilityScore: undefined,
};

export default function FilterRulesModal({ sourceId, sourceName, onClose }: Props) {
  const [rules, setRules] = useState<FilterRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState<CreateFilterRuleDto>({ ...emptyRule });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const fetchRules = async () => {
    setIsLoading(true);
    try {
      const data = await filterRulesApi.getBySource(sourceId);
      setRules(data);
    } catch {
      setError('Không tải được danh sách rules.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [sourceId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.keyword.trim()) return;
    setIsSubmitting(true);
    setError('');
    try {
      await filterRulesApi.create(sourceId, {
        ...form,
        minReliabilityScore: form.minReliabilityScore
          ? Number(form.minReliabilityScore)
          : undefined,
      });
      setForm({ ...emptyRule });
      await fetchRules();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thêm được rule.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await filterRulesApi.delete(id);
      setRules((rs) => rs.filter((r) => r.id !== id));
    } catch {
      setError('Không xóa được rule.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
      />

      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed z-50 inset-x-0 mx-auto top-[10%] w-full max-w-xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Filter className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Bộ Lọc</h2>
              <p className="text-xs text-slate-500">{sourceName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Existing Rules */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
              Rules hiện tại ({rules.length})
            </h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : rules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <Filter className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">Chưa có rule nào. Thêm rule bên dưới.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {rules.map((rule) => (
                  <motion.div
                    key={rule.id}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Tag className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-sm font-medium text-slate-800 truncate">
                        {rule.keyword}
                      </span>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${
                          rule.action === 'EXCLUDE'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {rule.action}
                      </span>
                      {rule.minReliabilityScore !== undefined && (
                        <span className="shrink-0 flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                          <Star className="w-3 h-3" />
                          ≥ {rule.minReliabilityScore}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      disabled={deletingId === rule.id}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                    >
                      {deletingId === rule.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Add Rule Form */}
          <div className="border-t border-slate-200 pt-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
              Thêm Rule Mới
            </h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Từ khoá (VD: Senior, Gấp...)"
                    value={form.keyword}
                    onChange={(e) => setForm((f) => ({ ...f, keyword: e.target.value }))}
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                  />
                </div>
                <select
                  value={form.action}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, action: e.target.value as 'INCLUDE' | 'EXCLUDE' }))
                  }
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                >
                  <option value="EXCLUDE">EXCLUDE</option>
                  <option value="INCLUDE">INCLUDE</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 shrink-0" />
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.5}
                  placeholder="Min AI Score (0–10, tuỳ chọn)"
                  value={form.minReliabilityScore ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      minReliabilityScore: e.target.value ? parseFloat(e.target.value) : undefined,
                    }))
                  }
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !form.keyword.trim()}
                className="flex w-full items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Thêm Rule
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
