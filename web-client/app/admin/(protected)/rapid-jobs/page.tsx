'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Search, MapPin, Globe, Briefcase, ExternalLink, Play, 
  Loader2, CheckCircle2, XCircle, AlertCircle, Clock, BarChart3, 
  CalendarDays, Layers, PlusCircle, Calendar as CalendarIcon, 
  ChevronRight, Building2, HelpCircle, DollarSign, Users
} from 'lucide-react';
import { StatusBanner } from '@/components/ui/StatusBanner';
import { rapidJobApi, CrawlLog, crawlLogsApi } from '@/lib/admin-api';

// Schedule constants (copy of server's rapid-job.config.ts, simplified)
interface JSearchDailyPlan { theme: string; queries: { query: string; label: string }[]; }

const JSEARCH_WEEKLY_SCHEDULE: Record<number, JSearchDailyPlan> = {
  1: { theme: 'IT & Sáng tạo (UI/UX)', queries: [
    { query: 'internship Vietnam', label: 'General-EN' },
    { query: 'thực tập sinh công nghệ thông tin Việt Nam', label: 'General-VI' },
    { query: 'frontend backend software developer intern Vietnam', label: 'IT-Dev-EN' },
    { query: 'thực tập lập trình viên frontend backend Vietnam', label: 'IT-Dev-VI' },
    { query: 'UI UX designer product design intern Vietnam', label: 'Creative-UIUX-EN' },
    { query: 'thực tập thiết kế UI UX sản phẩm Vietnam', label: 'Creative-UIUX-VI' },
  ]},
  2: { theme: 'Kinh tế & Sales', queries: [
    { query: 'internship Vietnam', label: 'General-EN' },
    { query: 'thực tập sinh kinh tế kinh doanh Việt Nam', label: 'General-VI' },
    { query: 'marketing intern brand communications Vietnam', label: 'Marketing-EN' },
    { query: 'thực tập marketing tiếp thị truyền thông Vietnam', label: 'Marketing-VI' },
    { query: 'sales intern business development account executive Vietnam', label: 'Sales-EN' },
    { query: 'thực tập kinh doanh bán hàng sales Vietnam', label: 'Sales-VI' },
  ]},
  3: { theme: 'Tài chính & Nhân sự', queries: [
    { query: 'internship Vietnam', label: 'General-EN' },
    { query: 'thực tập sinh tài chính nhân sự Việt Nam', label: 'General-VI' },
    { query: 'accounting finance audit banking intern Vietnam', label: 'Finance-EN' },
    { query: 'thực tập kế toán tài chính kiểm toán ngân hàng Vietnam', label: 'Finance-VI' },
    { query: 'HR human resources recruiter admin legal intern Vietnam', label: 'HR-EN' },
    { query: 'thực tập nhân sự hành chính tuyển dụng pháp lý Vietnam', label: 'HR-VI' },
  ]},
  4: { theme: 'IT & Logistics', queries: [
    { query: 'internship Vietnam', label: 'General-EN' },
    { query: 'thực tập sinh công nghệ logistics Việt Nam', label: 'General-VI' },
    { query: 'data analyst mobile developer intern Vietnam', label: 'IT-Data-Mobile-EN' },
    { query: 'thực tập data analyst lập trình mobile Vietnam', label: 'IT-Data-Mobile-VI' },
    { query: 'logistics supply chain import export warehouse intern Vietnam', label: 'Logistics-EN' },
    { query: 'thực tập logistics xuất nhập khẩu chuỗi cung ứng Vietnam', label: 'Logistics-VI' },
  ]},
  5: { theme: 'Kinh tế & Sale (Digital Marketing)', queries: [
    { query: 'internship Vietnam', label: 'General-EN' },
    { query: 'thực tập sinh marketing kinh doanh Việt Nam', label: 'General-VI' },
    { query: 'digital marketing SEO SEM content creator intern Vietnam', label: 'DigitalMarketing-EN' },
    { query: 'thực tập digital marketing SEO content creator Vietnam', label: 'DigitalMarketing-VI' },
    { query: 'sales telesale account executive intern Vietnam', label: 'Sales-Tele-EN' },
    { query: 'thực tập bán hàng telesales kinh doanh Vietnam', label: 'Sales-Tele-VI' },
  ]},
  6: { theme: 'Sáng tạo & Nhân sự (Admin)', queries: [
    { query: 'internship Vietnam', label: 'General-EN' },
    { query: 'thực tập sinh sáng tạo hành chính Việt Nam', label: 'General-VI' },
    { query: 'graphic designer video editor fashion design intern Vietnam', label: 'Creative-Design-EN' },
    { query: 'thực tập thiết kế đồ họa video editor Vietnam', label: 'Creative-Design-VI' },
    { query: 'admin office manager recruiter legal management trainee intern Vietnam', label: 'HR-Admin-EN' },
    { query: 'thực tập hành chính văn phòng nhân sự pháp lý Vietnam', label: 'HR-Admin-VI' },
  ]},
  0: { theme: 'Dự phòng / Địa điểm (Hà Nội & HCM)', queries: [
    { query: 'internship Hanoi Ha Noi', label: 'HaNoi-General' },
    { query: 'software engineer marketing intern Hanoi', label: 'HaNoi-Tech-Marketing' },
    { query: 'thực tập kế toán nhân sự hành chính Hà Nội', label: 'HaNoi-Finance-HR' },
    { query: 'internship Ho Chi Minh City HCMC', label: 'HCM-General' },
    { query: 'software engineer marketing intern Ho Chi Minh', label: 'HCM-Tech-Marketing' },
    { query: 'thực tập kế toán nhân sự hành chính Hồ Chí Minh', label: 'HCM-Finance-HR' },
  ]},
};

const LINKEDIN_LETSCRAPE_SCHEDULE: Record<number, string | null> = {
  1: 'Software Engineer Intern', 2: 'Marketing Trainee Intern',
  3: 'Accounting Finance Intern', 4: 'Data Analyst Intern',
  5: 'Business Development Intern', 6: 'Management Trainee Intern', 0: null,
};

type ProviderStatus = 'IDLE' | 'RUNNING' | 'SUCCESS' | 'ERROR';

const PROVIDERS = [
  {
    id: 'jsearch',
    name: 'JSearch (Google Jobs)',
    description: 'Tìm kiếm qua Google Jobs. Tự động chạy mỗi 4 giờ. Quota: 180 req/tháng.',
    cron: '0 */4 * * *',
    quota: '180 req/tháng',
    icon: Search,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    btnColor: 'bg-blue-600 hover:bg-blue-700 font-semibold',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn (Real-time)',
    description: 'Dữ liệu realtime. Tự động chạy 09:00 sáng T2-T7. Quota: 25 req/tháng.',
    cron: '0 9 * * 1-6',
    quota: '25 req/tháng',
    icon: Briefcase,
    color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    btnColor: 'bg-indigo-600 hover:bg-indigo-700 font-semibold',
  },
  {
    id: 'linkedin-v2',
    name: 'LinkedIn V2 (7 Days)',
    description: 'Việc làm trong 7 ngày. Chạy 08:00 sáng T2 hàng tuần. Quota: 5 req/tháng.',
    cron: '0 8 * * 1',
    quota: '5 req/tháng',
    icon: ExternalLink,
    color: 'bg-violet-50 text-violet-600 border-violet-200',
    btnColor: 'bg-violet-600 hover:bg-violet-700 font-semibold',
  },
  {
    id: 'jpf',
    name: 'Job Posting Feed (JPF)',
    description: 'Ngành kỹ thuật/dịch vụ/giáo dục. Chạy 10:00 sáng Chủ Nhật. Quota: 4-5 req/tháng.',
    cron: '0 10 * * 0',
    quota: '5 req/tháng',
    icon: Globe,
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    btnColor: 'bg-emerald-600 hover:bg-emerald-700 font-semibold',
  },
];

const DAYS_OF_WEEK = [
  { id: 1, label: 'Thứ 2' },
  { id: 2, label: 'Thứ 3' },
  { id: 3, label: 'Thứ 4' },
  { id: 4, label: 'Thứ 5' },
  { id: 5, label: 'Thứ 6' },
  { id: 6, label: 'Thứ 7' },
  { id: 0, label: 'Chủ Nhật' },
];

export default function RapidJobsPage() {
  const currentDay = new Date().getDay();

  // State
  const [stats, setStats] = useState({ totalToday: 0, totalMonth: 0, activeSources: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [providerStatus, setProviderStatus] = useState<Record<string, ProviderStatus>>({
    jsearch: 'IDLE', linkedin: 'IDLE', 'linkedin-v2': 'IDLE', jpf: 'IDLE',
  });
  const [logs, setLogs] = useState<CrawlLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // Preview State
  const [activeTab, setActiveTab] = useState('jsearch');
  const [previewKeyword, setPreviewKeyword] = useState('react developer');
  const [previewLocation, setPreviewLocation] = useState('Vietnam');
  const [previewLimit, setPreviewLimit] = useState('10');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSavingPreview, setIsSavingPreview] = useState(false);
  const [previewResult, setPreviewResult] = useState<any[]>([]);
  const [previewError, setPreviewError] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // UI state
  const [showSchedule, setShowSchedule] = useState(false);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    fetchStats();
    fetchLogs();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await rapidJobApi.getStats();
      setStats(data);
    } catch (e) {
      console.error('Failed to fetch stats', e);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchLogs = async () => {
    try {
      // Assuming rapid jobs have sourceName "RapidAPI Jobs" in CrawlSource
      // but the logs might be mixed. We fetch all and filter by "RapidAPI" strings if needed.
      const data = await crawlLogsApi.getAll();
      setLogs(data.slice(0, 50));
    } catch (e) {
      console.error('Failed to fetch logs', e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleTrigger = async (providerId: string) => {
    setProviderStatus((prev) => ({ ...prev, [providerId]: 'RUNNING' }));
    try {
      switch (providerId) {
        case 'jsearch': await rapidJobApi.triggerJSearch(); break;
        case 'linkedin': await rapidJobApi.triggerLinkedIn(); break;
        case 'linkedin-v2': await rapidJobApi.triggerLinkedInV2(); break;
        case 'jpf': await rapidJobApi.triggerJPF(); break;
      }
      setProviderStatus((prev) => ({ ...prev, [providerId]: 'SUCCESS' }));
      fetchStats();
      fetchLogs();
      setTimeout(() => setProviderStatus((prev) => ({ ...prev, [providerId]: 'IDLE' })), 3000);
    } catch (error: any) {
      setProviderStatus((prev) => ({ ...prev, [providerId]: 'ERROR' }));
      setTimeout(() => setProviderStatus((prev) => ({ ...prev, [providerId]: 'IDLE' })), 3000);
    }
  };

  const handlePreview = async () => {
    setIsPreviewing(true);
    setPreviewResult([]);
    setPreviewError('');

    try {
      let data: any[] = [];
      switch (activeTab) {
        case 'jsearch':
          data = await rapidJobApi.previewJSearch({ q: previewKeyword, country: 'vn' });
          break;
        case 'linkedin':
          data = await rapidJobApi.previewLinkedIn({ q: previewKeyword, location: previewLocation });
          break;
        case 'linkedin-v2':
          data = await rapidJobApi.previewLinkedInV2({ q: previewKeyword, location: previewLocation });
          break;
        case 'jpf':
          data = await rapidJobApi.previewJPF({ limit: previewLimit });
          break;
      }
      setPreviewResult(data);
    } catch (error: any) {
      setPreviewError(error.response?.data?.message || 'Lỗi khi tải dữ liệu preview.');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleSavePreviewJobs = async () => {
    if (!previewResult.length) return;
    setIsSavingPreview(true);
    try {
      const res = await rapidJobApi.savePreviewJobs({
        jobs: previewResult,
        providerId: activeTab,
      });
      // reload stats & logs
      fetchStats();
      fetchLogs();
      setNotification({ 
        type: 'success', 
        message: `Đã lưu thành công ${res.saved}/${res.total} việc làm vào cơ sở dữ liệu!` 
      });
      // clear preview
      setPreviewResult([]);
    } catch (error: any) {
      setNotification({ 
        type: 'error', 
        message: `Lỗi khi lưu: ${error.response?.data?.message || error.message}` 
      });
    } finally {
      setIsSavingPreview(false);
    }
  };

  const getThemeForToday = (providerId: string) => {
    if (providerId === 'jsearch') return JSEARCH_WEEKLY_SCHEDULE[currentDay]?.theme || 'Chưa xác định';
    if (providerId === 'linkedin') return LINKEDIN_LETSCRAPE_SCHEDULE[currentDay] || 'Nghỉ Chủ Nhật';
    if (providerId === 'linkedin-v2') return currentDay === 1 ? 'Quét 100 tin' : 'Chờ đến Thứ 2';
    if (providerId === 'jpf') return currentDay === 0 ? 'Quét 500 tin' : 'Chờ đến Chủ Nhật';
    return '';
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-20 relative px-4 md:px-6">
      {/* Notification Banner */}
      <StatusBanner
        type={notification?.type as any}
        message={notification?.message || null}
        onClose={() => setNotification(null)}
      />
      {/* 1. Hero Stats Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-indigo-600" />
            RapidAPI Jobs Manager
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Hệ thống thu thập việc làm tự động từ RapidAPI. Quản lý cấu hình, quotas và xem lịch trình quét.
          </p>
        </div>
        <button 
          onClick={() => setShowSchedule(!showSchedule)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
            showSchedule ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          {showSchedule ? 'Đóng Lịch Trình' : 'Xem Lịch Quét Tuần'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 shrink-0">
            <Layers className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Thu thập hôm nay</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800">
                {loadingStats ? <Loader2 className="w-5 h-5 animate-spin mt-1" /> : stats.totalToday.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 font-medium">jobs</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Tổng tháng này</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800">
                {loadingStats ? <Loader2 className="w-5 h-5 animate-spin mt-1" /> : stats.totalMonth.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 font-medium">jobs</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 shrink-0">
            <Globe className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Nguồn RapidAPI</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800">4</span>
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-semibold border border-blue-100">
                ACTIVE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Provider Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PROVIDERS.map((p) => {
          const status = providerStatus[p.id];
          const Icon = p.icon;
          const todayTheme = getThemeForToday(p.id);

          return (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative group hover:border-indigo-300 hover:shadow-md transition-all">
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-sm ${p.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  {/* Status Badges */}
                  <AnimatePresence mode="wait">
                    {status === 'RUNNING' && (
                      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                        Đang chạy
                      </motion.div>
                    )}
                    {status === 'SUCCESS' && (
                      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Thành công
                      </motion.div>
                    )}
                    {status === 'ERROR' && (
                      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold border border-red-200 shadow-sm">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Lỗi
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <h3 className="text-lg font-bold text-slate-800 mb-1">{p.name}</h3>
                <div className="flex flex-col gap-2 mb-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{p.cron}</span>
                    <span className="ml-auto text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 whitespace-nowrap">
                      {p.quota}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-xs font-medium text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-100">
                    <CalendarIcon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-amber-600/70 text-[10px] uppercase tracking-wider mb-0.5">Chủ đề hôm nay</span>
                      {todayTheme}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0">
                <button
                  onClick={() => handleTrigger(p.id)}
                  disabled={status === 'RUNNING'}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all shadow-sm text-sm disabled:opacity-70 ${
                    status === 'RUNNING' ? 'bg-slate-100 text-slate-400' : p.btnColor + ' text-white'
                  }`}
                >
                  {status === 'RUNNING' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                  {status === 'RUNNING' ? 'Đang kích hoạt...' : 'Kích Hoạt Chạy Ngay'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Weekly Schedule Visualizer */}
      <AnimatePresence>
        {showSchedule && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm overflow-hidden mt-4">
              <div className="bg-indigo-50/50 px-5 py-4 border-b border-indigo-100 flex items-center gap-3">
                <CalendarDays className="w-5 h-5 text-indigo-600" />
                <h2 className="font-semibold text-indigo-900">Weekly Keyword Rotation Schedule (JSearch & Letscrape)</h2>
              </div>
              
              <div className="flex overflow-x-auto hide-scrollbar p-5 gap-4">
                 {DAYS_OF_WEEK.map((day) => {
                   const isToday = day.id === currentDay;
                   const jsPlan = JSEARCH_WEEKLY_SCHEDULE[day.id];
                   const liTitle = LINKEDIN_LETSCRAPE_SCHEDULE[day.id];

                   return (
                     <div key={day.id} className={`min-w-[280px] flex-1 rounded-xl border p-4 ${
                       isToday ? 'border-indigo-400 shadow-md bg-indigo-50/20' : 'border-slate-200 bg-slate-50'
                     }`}>
                       <div className="flex items-center justify-between mb-4">
                         <h3 className={`font-bold ${isToday ? 'text-indigo-700 text-lg' : 'text-slate-700'}`}>
                           {day.label}
                           {isToday && <span className="ml-2 text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider relative -top-0.5">Hôm nay</span>}
                         </h3>
                       </div>

                       <div className="space-y-4">
                         {/* JSearch Block */}
                         <div className="space-y-2">
                           <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 uppercase tracking-wider">
                             <Search className="w-3.5 h-3.5" /> JSearch
                           </div>
                           <div className="bg-white border rounded-lg p-2.5 shadow-sm text-sm">
                             <p className="font-semibold text-slate-800 mb-2 truncate" title={jsPlan.theme}>🔥 {jsPlan.theme}</p>
                             <div className="flex flex-wrap gap-1.5">
                               {jsPlan.queries.slice(0, 3).map((q, i) => (
                                 <span key={i} className="inline-block bg-slate-100 border border-slate-200 text-slate-600 text-[10px] px-2 py-1 rounded-md max-w-[120px] truncate" title={q.query}>
                                   {q.label}
                                 </span>
                               ))}
                               {jsPlan.queries.length > 3 && (
                                 <span className="inline-block bg-slate-50 text-slate-500 text-[10px] px-2 py-1 rounded-md border border-dashed border-slate-300">
                                   +{jsPlan.queries.length - 3} queries
                                 </span>
                               )}
                             </div>
                           </div>
                         </div>

                         {/* LinkedIn Letscrape Block */}
                         <div className="space-y-2">
                           <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 uppercase tracking-wider">
                             <Briefcase className="w-3.5 h-3.5" /> LinkedIn
                           </div>
                           <div className="bg-white border rounded-lg p-2.5 shadow-sm text-sm">
                             {liTitle ? (
                               <p className="font-medium text-slate-700 text-xs">🚀 {liTitle}</p>
                             ) : (
                               <p className="font-medium text-slate-400 text-xs italic">Nghỉ (Save Quota)</p>
                             )}
                           </div>
                         </div>
                       </div>
                     </div>
                   );
                 })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Preview & Log Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[700px]">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-500" />
              Preview Job Cards (Test APIs)
            </h2>
          </div>

          <div className="p-5 flex flex-col h-full overflow-hidden">
            {/* Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-5 overflow-x-auto hide-scrollbar shrink-0">
              {PROVIDERS.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setActiveTab(p.id); setPreviewResult([]); setPreviewError(''); }}
                  className={`flex-1 min-w-[120px] text-sm font-semibold py-2 px-3 rounded-lg transition-all whitespace-nowrap ${
                    activeTab === p.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
                >
                  {p.name.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Params Form */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5 shrink-0">
              {activeTab !== 'jpf' && (
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={previewKeyword}
                    onChange={e => setPreviewKeyword(e.target.value)}
                    placeholder="Keywords..."
                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
              )}

              {(activeTab === 'linkedin' || activeTab === 'linkedin-v2') && (
                <div className="md:col-span-1 relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={previewLocation}
                    onChange={e => setPreviewLocation(e.target.value)}
                    placeholder="Location..."
                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
              )}

              {activeTab === 'jpf' && (
                <div className="md:col-span-3 relative">
                  <input 
                      type="number" 
                      value={previewLimit}
                      onChange={e => setPreviewLimit(e.target.value)}
                      placeholder="Limit"
                      className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                </div>
              )}
              
              <button
                onClick={handlePreview}
                disabled={isPreviewing}
                className="col-span-1 w-full flex items-center justify-center gap-2 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors disabled:opacity-70"
              >
                {isPreviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Chạy Test
              </button>
            </div>

            {/* Results Grid / List */}
            <div className="flex-1 overflow-y-auto bg-slate-50/50 rounded-xl border border-slate-200 p-2 relative">
              {isPreviewing && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col gap-3 items-center justify-center z-10 rounded-xl">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <p className="text-sm font-medium text-slate-600">Đang cào dữ liệu từ RapidAPI...</p>
                </div>
              )}
              
              {previewError && (
                 <div className="p-6 flex flex-col items-center justify-center text-red-600 h-full">
                    <AlertCircle className="w-10 h-10 mb-3 opacity-50" />
                    <p className="text-sm font-medium">{previewError}</p>
                 </div>
              )}

              {!previewError && previewResult.length > 0 ? (
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 p-3 bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10 shrink-0">
                    <span className="text-sm font-semibold text-slate-700">Preview: {previewResult.length} việc làm</span>
                    <button
                      onClick={handleSavePreviewJobs}
                      disabled={isSavingPreview}
                      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-70"
                    >
                      {isSavingPreview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      Lưu {previewResult.length} Việc Làm Này Tới DB
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 overflow-y-auto">
                    {previewResult.map((job, idx) => {
                      const { jobData, companyData } = job;
                      return (
                        <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col group">
                          <div className="flex gap-3 mb-3">
                            {companyData?.logo ? (
                               <img src={companyData.logo} alt="Logo" className="w-10 h-10 rounded-lg object-contain bg-slate-50 border border-slate-100" />
                            ) : (
                               <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100 text-indigo-500 shrink-0">
                                 <Building2 className="w-5 h-5" />
                               </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-slate-800 text-sm line-clamp-1 leading-tight group-hover:text-indigo-600 transition-colors" title={jobData?.title}>{jobData?.title || 'Unknown Title'}</h4>
                              <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">{companyData?.companyName || 'Unknown Company'}</p>
                            </div>
                          </div>
                          
                          <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap gap-1.5">
                              {jobData?.jobType && (
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">{jobData.jobType}</span>
                              )}
                              {jobData?.experience && (
                                <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold uppercase tracking-wider">{jobData.experience}</span>
                              )}
                            </div>

                            <div className="space-y-1 text-[11px] text-slate-600">
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span className="truncate">{jobData?.locationCity || 'Toàn quốc'}</span>
                              </div>
                              <div className="flex items-center gap-1.5 font-bold text-emerald-600">
                                <DollarSign className="w-3 h-3" />
                                {jobData?.salaryMin || jobData?.salaryMax 
                                  ? `${jobData.salaryMin?.toLocaleString() || '?'} - ${jobData.salaryMax?.toLocaleString() || '?'} ${jobData.currency || 'VND'}`
                                  : 'Thỏa thuận'}
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                                <Users className="w-3 h-3" />
                                <span>Tuyển {jobData?.vacancies || 1} người</span>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-50 flex gap-3 text-[10px] font-bold uppercase tracking-widest">
                                <span className={`flex items-center gap-1 ${jobData.requirements ? 'text-emerald-500' : 'text-slate-300 opacity-50'}`}>
                                  <CheckCircle2 className="w-3 h-3" /> {jobData.requirements ? 'Yêu cầu' : 'Không Y/C'}
                                </span>
                                <span className={`flex items-center gap-1 ${jobData.benefits ? 'text-indigo-500' : 'text-slate-300 opacity-50'}`}>
                                  <CheckCircle2 className="w-3 h-3" /> {jobData.benefits ? 'Quyền lợi' : 'Không QL'}
                                </span>
                            </div>

                            <p className={`text-[11px] line-clamp-2 leading-relaxed italic border-l-2 pl-2 ${jobData?.description ? 'text-slate-500 border-slate-100' : 'text-slate-300 border-slate-50'}`}>
                              {jobData?.description || 'Dữ liệu mô tả trống...'}
                            </p>
                          </div>

                          <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 opacity-60 group-hover:opacity-100 transition-opacity">
                            <a href={jobData?.originalUrl} target="_blank" rel="noreferrer" className="flex-1 text-center py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 uppercase tracking-wider">
                              <ExternalLink className="w-3 h-3" /> Xem gốc
                            </a>
                          </div>
                        </div>
                    );
                  })}
                  </div>
                </div>
              ) : !previewError && !isPreviewing && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <Search className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm font-medium">Nhấn "Chạy Test" để xem trước giao diện các thẻ việc làm</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Activity Log Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[700px] lg:h-auto">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              Lịch Sử Hệ Thống
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3">
            {loadingLogs ? (
               <div className="h-full flex items-center justify-center">
                 <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
               </div>
            ) : logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                 <p className="text-sm">Chưa có hoạt động nào</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {logs.map((log) => (
                    <motion.div
                      key={log.crawlLogId}
                      initial={{ opacity: 0, height: 0, scale: 0.95 }}
                      animate={{ opacity: 1, height: 'auto', scale: 1 }}
                      className={`p-3.5 rounded-xl border relative overflow-hidden ${
                        log.status === 'SUCCESS' 
                          ? 'bg-emerald-50/30 border-emerald-100' 
                          : log.status === 'RUNNING' 
                            ? 'bg-indigo-50/30 border-indigo-100'
                            : 'bg-red-50/30 border-red-100'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800">{log.providerName}</span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {new Date(log.startTime).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        {log.status === 'SUCCESS' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : log.status === 'RUNNING' ? (
                          <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className={`text-xs font-medium ${log.status === 'SUCCESS' ? 'text-emerald-700' : log.status === 'RUNNING' ? 'text-indigo-700' : 'text-red-700'} leading-relaxed`}>
                            {log.status === 'SUCCESS' ? `Cào thành công ${log.itemsProcessed || 0} tin.` : log.errorMessage || 'Đang xử lý dữ liệu...'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
