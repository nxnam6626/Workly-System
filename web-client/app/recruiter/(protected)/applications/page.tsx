'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, XCircle, Clock, CheckCircle, Users, FileText, Star, ChevronRight, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth';
import { useSocketStore } from '@/stores/socket';
import { useWalletStore } from '@/stores/wallet';
import { UnlockConfirmModal } from '@/components/recruiter/UnlockConfirmModal';
import { ApplicationDrawer } from '@/components/recruiter/ApplicationDrawer';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PENDING:             { label: 'Chờ duyệt',    cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  REVIEWING:           { label: 'Đang xem',      cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  INTERVIEWING:        { label: 'Phỏng vấn',    cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  INTERVIEW_CONFIRMED: { label: 'Đã chốt lịch', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  ACCEPTED:            { label: 'Đã tuyển',     cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED:            { label: 'Từ chối',      cls: 'bg-red-50 text-red-700 border-red-200' },
};

const TABS = [
  { key: 'ALL',        label: 'Tất cả' },
  { key: 'PENDING',    label: 'Chờ duyệt' },
  { key: 'INTERVIEWING', label: 'Phỏng vấn' },
  { key: 'ACCEPTED',   label: 'Đã tuyển' },
  { key: 'REJECTED',   label: 'Từ chối' },
];

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('ALL');
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockingAppIds, setUnlockingAppIds] = useState<string[]>([]);
  const [unlockingName, setUnlockingName] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);

  const { accessToken } = useAuthStore();
  const { socket } = useSocketStore();
  const wallet = useWalletStore((s) => s.wallet);
  const fetchWallet = useWalletStore((s) => s.fetchWallet);

  useEffect(() => {
    fetchAll();
    fetchWallet();
    api.get('/subscriptions/current').then(({ data }) => setSubscription(data)).catch(() => {});
  }, [accessToken]);

  useEffect(() => {
    if (!socket) return;
    const handler = () => fetchAll();
    socket.on('notification', handler);
    socket.on('dashboard.sync', handler);
    return () => { socket.off('notification', handler); socket.off('dashboard.sync', handler); };
  }, [socket]);

  const fetchAll = async () => {
    if (!accessToken) return;
    try {
      const { data } = await api.get('/applications/recruiter');
      setApplications(Array.isArray(data) ? data : []);
    } catch { } finally { setLoading(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/applications/${id}/status`, { status });
      setApplications(prev => prev.map(a => a.applicationId === id ? { ...a, appStatus: status } : a));
      setSelectedApp((prev: any) => prev?.applicationId === id ? { ...prev, appStatus: status } : prev);
      toast.success('Cập nhật thành công');
    } catch { toast.error('Cập nhật thất bại'); }
  };

  const updateBulkStatus = async (status: string) => {
    if (!selectedIds.length) return;
    try {
      await api.patch('/applications/bulk-status', { applicationIds: selectedIds, status });
      setApplications(prev => prev.map(a => selectedIds.includes(a.applicationId) ? { ...a, appStatus: status } : a));
      toast.success(`Đã cập nhật ${selectedIds.length} đơn`);
      setSelectedIds([]);
    } catch { toast.error('Thao tác thất bại'); }
  };

  const handleUnlock = (appId: string, name: string) => {
    setUnlockingAppIds([appId]);
    setUnlockingName(name);
    setShowUnlockModal(true);
  };

  const confirmUnlock = async () => {
    setIsUnlocking(true);
    try {
      for (const id of unlockingAppIds) await api.post(`/applications/${id}/unlock`);
      await fetchAll();
      await fetchWallet();
      setShowUnlockModal(false);
      toast.success('Mở khóa thành công!');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Mở khóa thất bại');
    } finally { setIsUnlocking(false); setUnlockingAppIds([]); }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return applications.filter(app => {
      const name = app.candidate?.fullName?.toLowerCase() || '';
      const title = app.jobPosting?.title?.toLowerCase() || '';
      if (q && !name.includes(q) && !title.includes(q)) return false;
      if (tab === 'ALL') return true;
      return app.appStatus === tab;
    });
  }, [applications, search, tab]);

  // Stats
  const stats = useMemo(() => ({
    total:       applications.length,
    pending:     applications.filter(a => a.appStatus === 'PENDING').length,
    interviewing:applications.filter(a => a.appStatus === 'INTERVIEWING').length,
    accepted:    applications.filter(a => a.appStatus === 'ACCEPTED').length,
  }), [applications]);

  const toggleId = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <FileText className="w-7 h-7 text-indigo-600" /> Quản lý đơn ứng tuyển
            </h1>
            <p className="text-slate-500 text-sm mt-1">Xem xét, đánh giá và xử lý hồ sơ ứng viên</p>
          </div>
          <button onClick={fetchAll} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all">
            <RefreshCw className={`w-4.5 h-4.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Tổng đơn', value: stats.total, icon: Users, color: 'text-slate-600 bg-slate-50 border-slate-200' },
            { label: 'Chờ duyệt', value: stats.pending, icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-100' },
            { label: 'Phỏng vấn', value: stats.interviewing, icon: Star, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
            { label: 'Đã tuyển', value: stats.accepted, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`flex items-center gap-4 p-5 rounded-2xl border ${color} bg-white`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{value}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-slate-50/50">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm ứng viên hoặc vị trí..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    tab === t.key ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-white border border-slate-200 text-slate-500 hover:border-indigo-100 hover:text-indigo-600'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-3 w-10">
                    <input type="checkbox" onChange={e => setSelectedIds(e.target.checked ? filtered.map(a => a.applicationId) : [])}
                      checked={selectedIds.length === filtered.length && filtered.length > 0}
                      className="rounded border-slate-300 text-indigo-600" />
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ứng viên</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Vị trí</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden lg:table-cell">Ngày nộp</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Match</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={7} className="px-6 py-16 text-center text-slate-400 text-sm">Đang tải...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-16 text-center text-slate-400 text-sm">Không có đơn nào.</td></tr>
                ) : filtered.map((app, idx) => {
                  const st = STATUS_MAP[app.appStatus] ?? { label: app.appStatus, cls: 'bg-slate-100 text-slate-500 border-slate-200' };
                  const score = app.aiMatchScore ?? 0;
                  const isSelected = selectedIds.includes(app.applicationId);
                  return (
                    <motion.tr key={app.applicationId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                      className={`group hover:bg-slate-50/80 transition-colors cursor-pointer ${isSelected ? 'bg-indigo-50/40' : ''}`}
                      onClick={() => setSelectedApp(app)}>
                      <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleId(app.applicationId)}
                          className="rounded border-slate-300 text-indigo-600" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center overflow-hidden shrink-0">
                            {app.isUnlocked && app.candidate?.user?.avatar
                              ? <img src={app.candidate.user.avatar} className="w-full h-full object-cover" />
                              : <span className="font-black text-indigo-600 text-sm">{(app.candidate?.fullName || 'U')[0].toUpperCase()}</span>}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{app.candidate?.fullName}</p>
                            {app.desiredLocation && <p className="text-xs text-slate-400">{app.desiredLocation}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <p className="text-sm text-slate-600 font-medium max-w-[200px] truncate">{app.jobPosting?.title}</p>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <p className="text-xs text-slate-400 font-medium">{new Date(app.applyDate).toLocaleDateString('vi-VN')}</p>
                      </td>
                      <td className="px-4 py-4">
                        {score > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${score >= 70 ? 'bg-emerald-500' : score >= 50 ? 'bg-indigo-500' : 'bg-amber-500'}`} style={{ width: `${score}%` }} />
                            </div>
                            <span className={`text-xs font-black ${score >= 70 ? 'text-emerald-600' : score >= 50 ? 'text-indigo-600' : 'text-amber-600'}`}>{score}%</span>
                          </div>
                        ) : <span className="text-xs text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[11px] font-black ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="px-4 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {app.appStatus === 'PENDING' && (
                            <>
                              <button onClick={() => updateStatus(app.applicationId, 'INTERVIEWING')} title="Hẹn phỏng vấn"
                                className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                                <Clock className="w-4 h-4" />
                              </button>
                              <button onClick={() => updateStatus(app.applicationId, 'REJECTED')} title="Từ chối"
                                className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {app.appStatus === 'INTERVIEWING' && (
                            <>
                              <button onClick={() => updateStatus(app.applicationId, 'ACCEPTED')} title="Đã tuyển"
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button onClick={() => updateStatus(app.applicationId, 'REJECTED')} title="Từ chối"
                                className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button onClick={() => setSelectedApp(app)} className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-5 border border-slate-700">
          <span className="text-sm font-bold">Đã chọn <span className="text-indigo-400">{selectedIds.length}</span></span>
          <div className="w-px h-5 bg-slate-700" />
          <button onClick={() => updateBulkStatus('INTERVIEWING')} className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-sm font-black transition-colors">
            <Clock className="w-4 h-4" /> Hẹn PV
          </button>
          <button onClick={() => updateBulkStatus('REJECTED')} className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-sm font-black transition-colors">
            <XCircle className="w-4 h-4" /> Từ chối
          </button>
          <button onClick={() => setSelectedIds([])} className="text-slate-400 hover:text-white transition-colors text-xs">Hủy</button>
        </motion.div>
      )}

      {/* Side Drawer */}
      {selectedApp && (
        <ApplicationDrawer
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onStatusChange={updateStatus}
          onUnlock={handleUnlock}
        />
      )}

      {/* Unlock Modal */}
      <UnlockConfirmModal
        isOpen={showUnlockModal && unlockingAppIds.length > 0}
        onClose={() => setShowUnlockModal(false)}
        onConfirm={confirmUnlock}
        isUnlocking={isUnlocking}
        candidateName={unlockingName}
        unlockCount={unlockingAppIds.length}
        wallet={wallet}
        subscription={subscription}
      />
    </div>
  );
}
