'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Plus, Search, MoreVertical, Edit, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useAuthStore } from '@/stores/auth';
import { useSocketStore } from '@/stores/socket';
import Link from 'next/link';

export default function JobsManagementPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { accessToken } = useAuthStore();
  const { socket } = useSocketStore();

  useEffect(() => {
    fetchJobs();
  }, [accessToken]);

  useEffect(() => {
    if (!socket) return;
    const handleNotification = (msg: any) => {
      if (msg.title?.includes('Tin tuyển dụng')) {
        fetchJobs();
      }
    };
    socket.on('notification', handleNotification);
    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket]);

  const fetchJobs = async () => {
    if (!accessToken) return;
    try {
      const { data } = await api.get('/job-postings/my-jobs');
      setJobs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteJob = async () => {
    if(!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/job-postings/${deleteId}`);
      setJobs(jobs.filter(j => j.jobPostingId !== deleteId));
      toast.success('Xóa tin tuyển dụng thành công');
    } catch (error) {
       console.error(error);
       toast.error('Xóa thất bại');
    } finally {
       setDeleting(false);
       setDeleteId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-indigo-600" />
            Quản Lý Tin Tuyển Dụng
          </h1>
          <p className="text-slate-500 mt-2">Theo dõi và cập nhật các vị trí đang tuyển của công ty.</p>
        </div>
        <Link
          href="/recruiter/post-job"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-5 h-5" /> Đăng Tin Mới
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm công việc..." 
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">Vị trí tuyển dụng</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Hồ sơ</th>
                <th className="px-6 py-4">Ngày đăng</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                 <tr><td colSpan={5} className="p-6 text-center text-slate-400">Đang tải biểu mẫu...</td></tr>
              ) : jobs.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-slate-400">Bạn chưa có tin tuyển dụng nào.</td></tr>
              ) : jobs.map((job) => (
                <tr key={job.jobPostingId} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{job.title}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      job.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                      job.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-indigo-600">{job.applications?.length || 0} ứng viên</td>
                  <td className="px-6 py-4 text-slate-400">{new Date(job.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteId(job.jobPostingId)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        title="Xóa tin tuyển dụng"
        message="Bạn có chắc chắn muốn xóa tin tuyển dụng này? Hành động này không thể hoàn tác và tất cả ứng viên của tin này sẽ bị mất."
        confirmLabel="Xóa tin"
        onConfirm={deleteJob}
        onCancel={() => setDeleteId(null)}
        isLoading={deleting}
      />
    </motion.div>
  );
}
