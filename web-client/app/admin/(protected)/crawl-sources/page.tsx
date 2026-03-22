'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  RefreshCw,
  Globe,
  Pencil,
  Trash2,
  Filter,
  Loader2,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  X,
} from 'lucide-react';
import { crawlSourcesApi, CrawlSource } from '@/lib/crawler-admin';
import SourceFormModal from './SourceFormModal';
import FilterRulesModal from './FilterRulesModal';

export default function CrawlSourcesPage() {
  const [sources, setSources] = useState<CrawlSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // Modals
  const [formModal, setFormModal] = useState<{ open: boolean; source: CrawlSource | null }>({
    open: false,
    source: null,
  });
  const [filterModal, setFilterModal] = useState<{ open: boolean; source: CrawlSource | null }>({
    open: false,
    source: null,
  });
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchSources = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await crawlSourcesApi.getAll();
      setSources(data);
    } catch {
      setError('Không tải được danh sách nguồn cào.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const handleDelete = async (source: CrawlSource) => {
    if (!confirm(`Xóa nguồn "${source.sourceName}"? Thao tác này không thể hoàn tác.`)) return;
    setDeletingId(source.id);
    try {
      await crawlSourcesApi.delete(source.id);
      setSources((s) => s.filter((x) => x.id !== source.id));
    } catch {
      setError('Không xóa được nguồn.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggle = async (source: CrawlSource) => {
    setTogglingId(source.id);
    try {
      const updated = await crawlSourcesApi.update(source.id, { isActive: !source.isActive });
      setSources((s) => s.map((x) => (x.id === source.id ? updated : x)));
    } catch {
      setError('Không cập nhật được trạng thái.');
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = sources.filter(
    (s) =>
      s.sourceName.toLowerCase().includes(search.toLowerCase()) ||
      s.baseUrl.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: sources.length,
    active: sources.filter((s) => s.isActive).length,
    inactive: sources.filter((s) => !s.isActive).length,
  };

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nguồn Cào Dữ Liệu</h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý các nguồn cào tin tuyển dụng tự động
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchSources}
            className="flex items-center gap-1.5 px-3 py-2 text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-100 text-sm font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button
            onClick={() => setFormModal({ open: true, source: null })}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-semibold transition-colors shadow shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            Thêm Nguồn
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Tổng Nguồn',
            value: stats.total,
            icon: Globe,
            color: 'bg-indigo-50 text-indigo-600',
            border: 'border-indigo-100',
          },
          {
            label: 'Đang Hoạt Động',
            value: stats.active,
            icon: CheckCircle2,
            color: 'bg-emerald-50 text-emerald-600',
            border: 'border-emerald-100',
          },
          {
            label: 'Đã Tắt',
            value: stats.inactive,
            icon: XCircle,
            color: 'bg-slate-50 text-slate-500',
            border: 'border-slate-100',
          },
        ].map(({ label, value, icon: Icon, color, border }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-2xl border ${border} p-5 flex items-center gap-4`}
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500 font-medium">{label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2.5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table toolbar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc URL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>
          <span className="text-sm text-slate-400">{filtered.length} nguồn</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Globe className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">
                {search ? 'Không tìm thấy nguồn phù hợp' : 'Chưa có nguồn cào nào'}
              </p>
              {!search && (
                <button
                  onClick={() => setFormModal({ open: true, source: null })}
                  className="mt-4 text-sm text-indigo-600 hover:underline font-medium"
                >
                  + Thêm nguồn đầu tiên
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left">Tên Nguồn</th>
                  <th className="px-5 py-3 text-left">URL Cơ Sở</th>
                  <th className="px-5 py-3 text-left">Lịch Cron</th>
                  <th className="px-5 py-3 text-left">JS Render</th>
                  <th className="px-5 py-3 text-center">Trạng Thái</th>
                  <th className="px-5 py-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <AnimatePresence>
                  {filtered.map((source) => (
                    <motion.tr
                      key={source.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                            <Globe className="w-4 h-4 text-indigo-600" />
                          </div>
                          <span className="font-semibold text-slate-800">{source.sourceName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <a
                          href={source.baseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-500 hover:text-indigo-600 hover:underline truncate block max-w-[200px]"
                        >
                          {source.baseUrl}
                        </a>
                      </td>
                      <td className="px-5 py-4">
                        {source.config ? (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <code className="text-xs bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                              {source.config.schedule}
                            </code>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs">Chưa cấu hình</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            source.config?.renderJs
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {source.config?.renderJs ? 'Puppeteer' : 'Cheerio'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => handleToggle(source)}
                          disabled={togglingId === source.id}
                          className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                            source.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                          } disabled:opacity-60`}
                        >
                          {togglingId === source.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-white absolute top-1 left-1/2 -translate-x-1/2" />
                          ) : (
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                                source.isActive ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end items-center gap-1">
                          <button
                            onClick={() => setFilterModal({ open: true, source })}
                            title="Bộ lọc"
                            className="p-2 rounded-lg text-slate-400 hover:bg-violet-50 hover:text-violet-600 transition-colors"
                          >
                            <Filter className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setFormModal({ open: true, source })}
                            title="Chỉnh sửa"
                            className="p-2 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(source)}
                            disabled={deletingId === source.id}
                            title="Xóa"
                            className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                          >
                            {deletingId === source.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Source Form Modal */}
      {formModal.open && (
        <SourceFormModal
          source={formModal.source}
          onClose={() => setFormModal({ open: false, source: null })}
          onSaved={fetchSources}
        />
      )}

      {/* Filter Rules Modal */}
      {filterModal.open && filterModal.source && (
        <FilterRulesModal
          sourceId={filterModal.source.id}
          sourceName={filterModal.source.sourceName}
          onClose={() => setFilterModal({ open: false, source: null })}
        />
      )}
    </div>
  );
}
