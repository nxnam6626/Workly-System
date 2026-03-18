'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  ClipboardList,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  Search,
  Activity,
  Package,
} from 'lucide-react';
import { crawlLogsApi, crawlSourcesApi, CrawlLog, CrawlSource, CrawlLogStatus } from '@/lib/crawler-admin';

const STATUS_CONFIG: Record<
  CrawlLogStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  RUNNING: { label: 'Đang chạy', color: 'bg-blue-100 text-blue-700', icon: Activity },
  SUCCESS: { label: 'Thành công', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  FAILED: { label: 'Thất bại', color: 'bg-red-100 text-red-700', icon: XCircle },
};

function StatusBadge({ status }: { status: CrawlLogStatus }) {
  const { label, color, icon: Icon } = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function durationStr(start: string, end?: string) {
  if (!end) return '—';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export default function CrawlLogsPage() {
  const [logs, setLogs] = useState<CrawlLog[]>([]);
  const [sources, setSources] = useState<CrawlSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSourceId, setSelectedSourceId] = useState<number | ''>('');
  const [statusFilter, setStatusFilter] = useState<CrawlLogStatus | ''>('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLogs = useCallback(async () => {
    setError('');
    try {
      const data = await crawlLogsApi.getAll(
        selectedSourceId !== '' ? Number(selectedSourceId) : undefined
      );
      setLogs(data);
    } catch {
      setError('Không tải được lịch sử quét.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSourceId]);

  // Initial fetch + sources list
  useEffect(() => {
    setIsLoading(true);
    fetchLogs();
    crawlSourcesApi.getAll().then(setSources).catch(() => {});
  }, [fetchLogs]);

  // Auto-refresh every 30s if any log is RUNNING
  useEffect(() => {
    const hasRunning = logs.some((l) => l.status === 'RUNNING');
    if (hasRunning) {
      intervalRef.current = setInterval(fetchLogs, 30000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [logs, fetchLogs]);

  const filtered = logs.filter((log) => {
    const matchStatus = statusFilter === '' || log.status === statusFilter;
    const matchSearch =
      search === '' ||
      log.sourceName.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const stats = {
    total: logs.length,
    success: logs.filter((l) => l.status === 'SUCCESS').length,
    failed: logs.filter((l) => l.status === 'FAILED').length,
    running: logs.filter((l) => l.status === 'RUNNING').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lịch Sử Quét</h1>
          <p className="text-sm text-slate-500 mt-1">
            Giám sát các lần chạy crawler — tự động làm mới nếu có job đang chạy
          </p>
        </div>
        <button
          onClick={() => { setIsLoading(true); fetchLogs(); }}
          className="flex items-center gap-1.5 px-3 py-2 text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-100 text-sm font-medium transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Tổng Lịch Sử', value: stats.total, color: 'bg-indigo-50 text-indigo-600', icon: ClipboardList },
          { label: 'Thành Công', value: stats.success, color: 'bg-emerald-50 text-emerald-600', icon: CheckCircle2 },
          { label: 'Thất Bại', value: stats.failed, color: 'bg-red-50 text-red-600', icon: XCircle },
          { label: 'Đang Chạy', value: stats.running, color: 'bg-blue-50 text-blue-600', icon: Activity },
        ].map(({ label, value, color, icon: Icon }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4"
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

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filters toolbar */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-slate-100">
          {/* Search */}
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên nguồn..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>

          {/* Source filter */}
          <div className="relative">
            <select
              value={selectedSourceId}
              onChange={(e) =>
                setSelectedSourceId(e.target.value === '' ? '' : Number(e.target.value))
              }
              className="pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 appearance-none"
            >
              <option value="">Tất cả nguồn</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.sourceName}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Status chips */}
          <div className="flex gap-1.5">
            {(['', 'RUNNING', 'SUCCESS', 'FAILED'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  statusFilter === s
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {s === '' ? 'Tất cả' : STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>

          <span className="text-sm text-slate-400 ml-auto">{filtered.length} bản ghi</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <ClipboardList className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">Chưa có lịch sử quét nào</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left">Thời gian bắt đầu</th>
                  <th className="px-5 py-3 text-left">Nguồn</th>
                  <th className="px-5 py-3 text-left">Trạng thái</th>
                  <th className="px-5 py-3 text-right">Tin xử lý</th>
                  <th className="px-5 py-3 text-right">Thời gian chạy</th>
                  <th className="px-5 py-3 text-right">Chi tiết lỗi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((log) => (
                  <>
                    <tr
                      key={log.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        log.status === 'FAILED' ? 'cursor-pointer' : ''
                      }`}
                      onClick={() =>
                        log.status === 'FAILED' &&
                        setExpandedId(expandedId === log.id ? null : log.id)
                      }
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(log.startedAt)}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-800">{log.sourceName}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={log.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 text-slate-700 font-semibold">
                          <Package className="w-3.5 h-3.5 text-slate-400" />
                          {log.itemsProcessed.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right text-slate-500 font-mono text-xs">
                        {durationStr(log.startedAt, log.finishedAt)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {log.status === 'FAILED' && (
                          <button className="text-xs text-red-500 hover:underline">
                            {expandedId === log.id ? 'Ẩn bớt ▲' : 'Xem lỗi ▼'}
                          </button>
                        )}
                      </td>
                    </tr>
                    {/* Expanded error row */}
                    {expandedId === log.id && log.errorMessage && (
                      <tr key={`err-${log.id}`}>
                        <td colSpan={6} className="px-5 pb-4 pt-0">
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-red-50 border border-red-200 rounded-xl p-4 font-mono text-xs text-red-700 whitespace-pre-wrap"
                          >
                            {log.errorMessage}
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
