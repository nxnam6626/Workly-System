'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, Download, CheckCircle, XCircle, Clock, Eye, Calendar } from 'lucide-react';
import api, { getFileUrl } from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth';
import { useSocketStore } from '@/stores/socket';
import { InterviewScheduleModal } from './InterviewScheduleModal';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('ALL');
  const { accessToken } = useAuthStore();
  const { socket } = useSocketStore();
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [accessToken]);

  useEffect(() => {
    if (!socket) return;
    const handleNotification = (msg: any) => {
      if (msg.title?.includes('Hồ sơ') || msg.title?.includes('Đơn ứng tuyển') || msg.title?.includes('Tin tuyển dụng')) {
        fetchApplications();
      }
    };
    socket.on('notification', handleNotification);
    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket]);

  const fetchApplications = async () => {
    if (!accessToken) return;
    try {
      const { data } = await api.get('/applications/recruiter');
      setApplications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string, interviewDetails?: any) => {
    try {
      if (interviewDetails) {
        setIsSubmitting(true);
      }
      await api.patch(`/applications/${id}/status`, { status, ...interviewDetails });
      setApplications(applications.map(app => app.applicationId === id ? { ...app, appStatus: status } : app));
      toast.success(status === 'INTERVIEWING' ? 'Đã hẹn lịch phỏng vấn!' : 'Cập nhật trạng thái thành công');
      setIsModalOpen(false);
      setSelectedApp(null);
    } catch (error) {
      console.error(error);
      toast.error('Cập nhật trạng thái thất bại');
    } finally {
      if (interviewDetails) {
        setIsSubmitting(false);
      }
    }
  };

  const handleUnlock = async (id: string) => {
    try {
       const toastId = toast.loading('Đang xử lý mở khóa...');
       const { data } = await api.post(`/applications/${id}/unlock`);
       // Refresh list after unlock
       await fetchApplications();
       toast.success('Mở khóa ứng viên thành công!', { id: toastId });
    } catch (error: any) {
       console.error(error);
       toast.error(error.response?.data?.message || 'Không thể mở khóa ứng viên');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
      case 'REVIEWED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'INTERVIEWING': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 'Đã Tuyển';
      case 'REJECTED': return 'Từ Chối';
      case 'REVIEWED': return 'Đã Xem';
      case 'INTERVIEWING': return 'Đang Phỏng Vấn';
      default: return 'Chờ Duyệt';
    }
  };

  const filteredApps = applications.filter(app => {
    const term = search.toLowerCase();
    const candidateName = app.candidate?.fullName?.toLowerCase() || '';
    const jobTitle = app.jobPosting?.title?.toLowerCase() || '';
    const matchesSearch = !search || candidateName.includes(term) || jobTitle.includes(term);
    
    if (!matchesSearch) return false;
    if (filterTab === 'ALL') return true;
    if (filterTab === 'SUITABLE') return app.aiMatchScore >= 70;
    if (filterTab === 'UNLOCKED') return app.isUnlocked;
    if (filterTab === 'PENDING') return app.appStatus === 'PENDING';
    if (filterTab === 'ACCEPTED') return app.appStatus === 'ACCEPTED';
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <FileText className="h-8 w-8 text-indigo-600" />
            Quản Lý Đơn Ứng Tuyển
          </h1>
          <p className="text-slate-500 mt-2">Xem xét và đánh giá hồ sơ ứng viên gửi đến các vị trí đang tuyển.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm theo tên ứng viên hoặc vị trí..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm shadow-sm"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
             <button onClick={() => setFilterTab('ALL')} className={`px-4 py-2 rounded-lg border text-sm font-medium whitespace-nowrap transition-colors ${filterTab === 'ALL' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Tất Cả</button>
             <button onClick={() => setFilterTab('SUITABLE')} className={`px-4 py-2 rounded-lg border text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${filterTab === 'SUITABLE' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200' : 'bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100'}`}>Phù Hợp Nhất</button>
             <button onClick={() => setFilterTab('UNLOCKED')} className={`px-4 py-2 rounded-lg border text-sm font-medium whitespace-nowrap transition-colors ${filterTab === 'UNLOCKED' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-200' : 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100'}`}>Đã Mở Khoá</button>
             <button onClick={() => setFilterTab('PENDING')} className={`px-4 py-2 rounded-lg border text-sm font-medium whitespace-nowrap transition-colors ${filterTab === 'PENDING' ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-200' : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'}`}>Chờ Duyệt</button>
             <button onClick={() => setFilterTab('ACCEPTED')} className={`px-4 py-2 rounded-lg border text-sm font-medium whitespace-nowrap transition-colors ${filterTab === 'ACCEPTED' ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200' : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'}`}>Đã Tuyển</button>
          </div>
        </div>
        
        <div className="divide-y divide-slate-100">
          {loading ? (
             <div className="p-8 text-center text-slate-400">Đang tải hồ sơ...</div>
          ) : applications.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Chưa có đơn ứng tuyển nào.</div>
          ) : filteredApps.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Không có hồ sơ nào phù hợp với bộ lọc này.</div>
          ) : filteredApps.map((app) => (
            <div key={app.applicationId} className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row gap-6 items-start md:items-center justify-between group">
              
              <div className="flex gap-4 items-start flex-1 min-w-0">
                <div className="w-12 h-12 rounded-full bg-indigo-100 border-2 border-white shadow-sm flex items-center justify-center shrink-0">
                   {app.candidate?.user?.avatar ? (
                     <img src={app.candidate.user.avatar} className="w-full h-full rounded-full object-cover" />
                   ) : (
                     <span className="font-bold text-indigo-600 text-lg uppercase">{(app.candidate?.fullName || 'U').charAt(0)}</span>
                   )}
                </div>
                <div className="space-y-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 text-lg truncate">{app.candidate?.fullName}</h3>
                  <p className="text-slate-500 text-sm flexitems-center gap-2">
                    <span className="font-medium text-slate-700">Ứng tuyển: </span> {app.jobPosting?.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                     <p className="text-slate-400 text-xs flex items-center gap-1.5">
                       <Clock className="w-3.5 h-3.5" />
                       {new Date(app.applyDate).toLocaleDateString('vi-VN')}
                       {app.desiredLocation && (
                         <>
                           <span className="mx-1">•</span>
                           <span className="text-blue-600 font-medium whitespace-nowrap">Nơi làm việc: {app.desiredLocation}</span>
                         </>
                       )}
                     </p>
                     {app.aiMatchScore != null && (
                       <span className="px-2 py-0.5 ml-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded text-xs font-semibold">
                         AI Match: {app.aiMatchScore}%
                       </span>
                     )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                 <span className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${getStatusColor(app.appStatus)}`}>
                    {getStatusLabel(app.appStatus)}
                 </span>
                 
                 <div className="h-8 w-px bg-slate-200 hidden md:block mx-1"></div>

                 {app.isUnlocked ? (
                   <a 
                     href={getFileUrl(app.cvSnapshotUrl)} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                   >
                     <Eye className="w-4 h-4" /> Xem CV
                   </a>
                 ) : (
                   <button 
                     onClick={() => handleUnlock(app.applicationId)}
                     className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer shadow-sm"
                   >
                     Mở Khóa (50 xu)
                   </button>
                 )}

                 {app.appStatus === 'PENDING' && (
                   <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => { setSelectedApp(app); setIsModalOpen(true); }} title="Hẹn phỏng vấn" className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 flex items-center justify-center transition-colors">
                       <Clock className="w-5 h-5" />
                     </button>
                     <button onClick={() => updateStatus(app.applicationId, 'REJECTED')} title="Từ chối" className="w-9 h-9 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 flex items-center justify-center transition-colors">
                       <XCircle className="w-5 h-5" />
                     </button>
                   </div>
                 )}

                 {app.appStatus === 'INTERVIEWING' && (
                   <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                     <button 
                       onClick={() => { setSelectedApp(app); setIsModalOpen(true); }} 
                       title="Dời Lịch" 
                       className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 flex items-center justify-center transition-colors"
                     >
                       <Calendar className="w-5 h-5" />
                     </button>
                     <button onClick={() => updateStatus(app.applicationId, 'ACCEPTED')} title="Đã Tuyển" className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 flex items-center justify-center transition-colors">
                       <CheckCircle className="w-5 h-5" />
                     </button>
                     <button onClick={() => updateStatus(app.applicationId, 'REJECTED')} title="Từ Chối" className="w-9 h-9 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 flex items-center justify-center transition-colors">
                       <XCircle className="w-5 h-5" />
                     </button>
                   </div>
                 )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <InterviewScheduleModal
        isOpen={isModalOpen}
        candidateName={selectedApp?.candidate?.fullName || ''}
        isSubmitting={isSubmitting}
        initialData={selectedApp?.interviewDate ? {
          date: new Date(selectedApp.interviewDate).toISOString().split('T')[0],
          time: selectedApp.interviewTime || '',
          location: selectedApp.interviewLocation || ''
        } : undefined}
        onClose={() => { setIsModalOpen(false); setSelectedApp(null); }}
        onSubmit={(date, time, location) => {
          if (selectedApp) {
            updateStatus(selectedApp.applicationId, 'INTERVIEWING', { interviewDate: date, interviewTime: time, interviewLocation: location });
          }
        }}
      />
    </motion.div>
  );
}
