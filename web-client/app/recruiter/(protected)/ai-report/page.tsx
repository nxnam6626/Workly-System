'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import api from '@/lib/api';
import {
  Sparkles, Lock, Crown, TrendingUp, Brain, Target, Zap,
  AlertCircle, ChevronRight, Send, Loader2, BarChart3,
  Users, Eye, ArrowUp, ArrowDown, Star, Lightbulb,
  BotMessageSquare, RefreshCw, CheckCircle2,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- Paywall Screen ---
function PaywallScreen() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-[70vh] flex items-center justify-center"
    >
      <div className="max-w-lg w-full mx-auto text-center px-4">
        <div className="relative mb-8">
          <div className="w-28 h-28 mx-auto rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-2xl shadow-amber-500/40 relative">
            <Lock className="w-12 h-12 text-white" />
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Crown className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-44 h-44 rounded-full border-2 border-amber-200/50 animate-ping" style={{ animationDuration: '3s' }} />
          </div>
        </div>

        <h2 className="text-3xl font-black text-slate-900 mb-3">AI Report Dashboard</h2>
        <p className="text-slate-500 mb-2 text-lg leading-relaxed">Mở khóa sức mạnh phân tích tuyển dụng chuyên sâu từ AI</p>
        <p className="text-slate-400 text-sm mb-8 max-w-sm mx-auto">
          Nhận gợi ý tối ưu JD, phân tích hiệu suất thực tế, và chat trực tiếp với AI trợ lý — chỉ dành cho gói GROWTH.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-8 text-left">
          {['🎯 Gợi ý tối ưu hóa JD bằng AI thực', '📈 Phân tích dữ liệu JD của bạn', '🤖 Chat với AI Recruiter Assistant', '⚡ Chấm điểm AI cho từng vị trí tuyển dụng'].map((f, i) => (
            <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium text-slate-700">{f}</div>
          ))}
        </div>

        <Link href="/recruiter/billing/plans" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-2xl shadow-xl shadow-amber-500/30 hover:opacity-90 transition-all active:scale-[0.98] text-base">
          <Crown className="w-5 h-5" /> Nâng cấp lên GROWTH ngay
        </Link>
        <p className="mt-4 text-xs text-slate-400">Hoặc <Link href="/recruiter/dashboard" className="text-indigo-500 hover:underline">quay về Dashboard</Link></p>
      </div>
    </motion.div>
  );
}

// --- AI Chat Mini ---
function AiChatMini() {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: 'Xin chào! Tôi là trợ lý AI tuyển dụng. Hỏi tôi bất cứ điều gì về JD, ứng viên, hoặc chiến lược tuyển dụng nhé!' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = async (overrideMsg?: string) => {
    const msg = (overrideMsg !== undefined ? overrideMsg : input).trim();
    if (!msg || loading) return;
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    if (overrideMsg === undefined) setInput('');
    setLoading(true);
    try {
      const res = await api.post('/ai/chat', { message: msg });
      setMessages(prev => [...prev, { role: 'ai', text: res.data.message }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Xin lỗi, AI đang bận. Vui lòng thử lại sau!' }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  return (
    <>
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[420px]">
      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-600 to-indigo-700 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
          <BotMessageSquare className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-sm">AI Recruiter Assistant</p>
          <p className="text-indigo-200 text-xs">Powered by Gemini</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-indigo-100 font-medium">Online</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed overflow-hidden ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white border border-slate-100 text-slate-700 shadow-sm rounded-bl-sm [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-2 [&_strong]:font-bold [&_strong]:text-slate-900'}`}>
                {m.role === 'user' ? (
                  m.text
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                )}
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-white border border-slate-100 rounded-2xl px-4 py-2.5 shadow-sm">
                <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t border-slate-100 bg-white">
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Hỏi AI về chiến lược tuyển dụng..." className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-sm transition-all" />
          <button onClick={() => send()} disabled={!input.trim() || loading} className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-all shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm mt-4">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Câu hỏi gợi ý</p>
      <div className="flex flex-col gap-2">
        {['Phân tích JD đang có ít ứng viên nhất', 'Gợi ý cách viết mô tả JD hấp dẫn hơn', 'Làm thế nào để tăng tỉ lệ apply/view?'].map((q, i) => (
          <button
            key={i}
            onClick={() => send(q)}
            disabled={loading}
            className="text-left text-xs text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-indigo-100 font-medium disabled:opacity-50"
          >
            💡 {q}
          </button>
        ))}
      </div>
    </div>
    </>
  );
}

// --- Insight Card ---
const INSIGHT_CONFIG: Record<string, { icon: any; colorClass: string; borderClass: string; labelBg: string; labelText: string }> = {
  warning: { icon: AlertCircle, colorClass: 'text-amber-600', borderClass: 'border-amber-100 hover:border-amber-200', labelBg: 'bg-amber-50', labelText: 'text-amber-600' },
  tip:     { icon: Lightbulb,   colorClass: 'text-indigo-600', borderClass: 'border-indigo-100 hover:border-indigo-200', labelBg: 'bg-indigo-50', labelText: 'text-indigo-600' },
  success: { icon: CheckCircle2, colorClass: 'text-emerald-600', borderClass: 'border-emerald-100 hover:border-emerald-200', labelBg: 'bg-emerald-50', labelText: 'text-emerald-600' },
};

function InsightCard({ insight, index, jdScores }: { insight: any; index: number; jdScores: any[] }) {
  const cfg = INSIGHT_CONFIG[insight.type] || INSIGHT_CONFIG.tip;
  const Icon = cfg.icon;
  const [showModal, setShowModal] = useState(false);

  // jobRefs = [{id, title}] from rule-based; jobIds = [id,...] from AI or old cache
  const affectedJds: { id: string; title: string; score?: number }[] =
    insight.jobRefs?.length > 0
      ? insight.jobRefs.map((ref: any, i: number) => ({
          id: ref.id,
          title: ref.title,
          score: jdScores?.find((s: any) => s.id === ref.id)?.score ?? jdScores?.[i]?.score,
        }))
      : (insight.jobIds ?? []).map((id: string, i: number) => ({
          id,
          title: jdScores?.[i]?.title ?? `JD #${i + 1}`,
          score: jdScores?.[i]?.score,
        }));

  const hasAffectedJds = affectedJds.length > 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 + index * 0.1 }}
        className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex gap-4 items-start ${cfg.borderClass}`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.labelBg} ${cfg.colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-bold text-slate-900 text-sm">{insight.title}</p>
            {insight.priority === 'high' && <span className="text-[10px] font-black uppercase tracking-wider text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">Ưu tiên</span>}
          </div>
          <p className="text-slate-500 text-xs leading-relaxed">{insight.desc}</p>
          {hasAffectedJds && (
            <p className="text-xs text-slate-400 mt-1">{affectedJds.length} JD cần cải thiện</p>
          )}
        </div>
        <button
          onClick={() => hasAffectedJds ? setShowModal(true) : undefined}
          className={`shrink-0 flex items-center gap-0.5 text-xs font-bold ${cfg.labelText} hover:underline`}
        >
          {hasAffectedJds ? 'Xem danh sách' : 'Xem'} <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </motion.div>

      {/* Affected JDs Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden"
            >
              <div className={`px-6 py-4 border-b border-slate-100 flex items-center gap-3 ${cfg.labelBg}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cfg.colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900 text-sm">{insight.title}</p>
                  <p className="text-xs text-slate-500">{affectedJds.length} JD cần cải thiện</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-white/60 transition-colors text-slate-400 hover:text-slate-600">
                  <ChevronRight className="w-4 h-4 rotate-[270deg]" />
                </button>
              </div>
              <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
                {affectedJds.map((jd: any, i: number) => (
                  <Link
                    key={jd.id}
                    href={`/recruiter/jobs/${jd.id}`}
                    onClick={() => setShowModal(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group"
                  >
                    <span className="text-xs font-bold text-slate-400 w-5">{i + 1}</span>
                    <span className="flex-1 text-sm font-medium text-slate-700 truncate group-hover:text-indigo-700">
                      {jd.title}
                    </span>
                    {jd.score != null && (
                      <span className={`text-xs font-black ${jd.score >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>{jd.score}đ</span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                  </Link>
                ))}
              </div>
              <div className="px-6 py-3 border-t border-slate-100 flex justify-between items-center">
                <p className="text-xs text-slate-400">{insight.desc}</p>
                <Link href="/recruiter/jobs" onClick={() => setShowModal(false)} className="text-xs text-indigo-600 font-bold hover:underline shrink-0 ml-4">Xem tất cả JD</Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


// --- Main Page ---
export default function AiReportPage() {
  const [loading, setLoading] = useState(true);
  const [canView, setCanView] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [data, setData] = useState<any>(null);

  const checkAccess = async () => {
    try {
      const res = await api.get('/subscriptions/current');
      const sub = res.data;
      setCanView(sub?.canViewAIReport === true && new Date() <= new Date(sub.expiryDate));
    } catch {
      setCanView(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchInsights = async (isRefresh = false) => {
    if (isRefresh) {
      const lastRefresh = localStorage.getItem('ai_last_refresh');
      if (lastRefresh && Date.now() - parseInt(lastRefresh) < 5 * 60 * 1000) {
        const minutesLeft = Math.ceil((5 * 60 * 1000 - (Date.now() - parseInt(lastRefresh))) / 60000);
        toast.error(`Vui lòng đợi ${minutesLeft} phút nữa để phân tích lại!`, { id: 'ai-refresh' });
        return;
      }
    }

    setAnalysing(true);
    if (isRefresh) toast.loading('AI đang phân tích dữ liệu thực tế của bạn...', { id: 'ai-refresh' });
    try {
      const res = await api.get('/ai/recruiter-insights');
      setData(res.data);
      if (isRefresh) {
        localStorage.setItem('ai_last_refresh', Date.now().toString());
        toast.success('Đã cập nhật phân tích AI!', { id: 'ai-refresh' });
      }
    } catch (e: any) {
      toast.error('Không thể tải dữ liệu AI. Thử lại sau!', { id: 'ai-refresh' });
    } finally {
      setAnalysing(false);
    }
  };

  useEffect(() => {
    checkAccess().then(() => {
      if (canView) fetchInsights();
    });
  }, []);

  useEffect(() => {
    if (canView && !data) fetchInsights();
  }, [canView]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
        <span className="font-medium">Đang kiểm tra quyền truy cập...</span>
      </div>
    );
  }

  if (!canView) return <PaywallScreen />;

  const stats = data?.stats;
  const insights: any[] = data?.insights || [];
  const jdScores: any[] = data?.jdScores || [];
  const summary: string = data?.summary || '';

  const statCards = [
    { label: 'Tin Đang Mở', value: stats?.activeJobs ?? '—', icon: Target, color: 'indigo' },
    { label: 'Tổng Lượt Xem JD', value: stats?.totalViews?.toLocaleString() ?? '—', icon: Eye, color: 'blue' },
    { label: 'Tỉ Lệ Apply / View', value: stats?.avgApplyRate != null ? `${stats.avgApplyRate}%` : '—', icon: TrendingUp, color: 'amber' },
    { label: 'Tổng Ứng Viên', value: stats?.totalApplicants?.toLocaleString() ?? '—', icon: Users, color: 'emerald' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Crown className="w-3 h-3" /> GROWTH
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {data?.ruleBasedFallback ? '• Phân tích tự động (AI tạm giới hạn)' : '• Phân tích bởi AI'}
            </span>
            {data?.fromCache && (
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                📦 Cache {data?.cachedAt ? `• ${new Date(data.cachedAt).toLocaleString('vi-VN')}` : ''}
                {data?.stale ? ' · ⚠️ Stale' : ''}
              </span>
            )}
            {data?.ruleBasedFallback && !data?.fromCache && (
              <span className="text-xs text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                ⚡ Phân tích cục bộ
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <Brain className="w-7 h-7 text-indigo-600" /> AI Report Dashboard
          </h1>
          {summary && !analysing && (
            <p className="text-slate-500 mt-1 max-w-xl text-sm">{summary}</p>
          )}
        </div>
        <button
          onClick={() => fetchInsights(true)}
          disabled={analysing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium text-sm transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${analysing ? 'animate-spin' : ''}`} />
          {analysing ? 'AI đang phân tích...' : 'Làm mới'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 group hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${s.color}-50 text-${s.color}-600 group-hover:scale-110 transition-transform`}>
                <s.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mb-1">
              {analysing ? <span className="inline-block w-12 h-6 bg-slate-100 rounded animate-pulse" /> : s.value}
            </p>
            <p className="text-xs text-slate-500 font-medium leading-tight">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Insights + JD Scores */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" /> Gợi ý từ Gemini AI
            <span className="text-xs font-normal text-slate-400">(Dựa trên dữ liệu tuyển dụng thực tế của bạn)</span>
          </h2>

          {analysing ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex gap-4 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-3 bg-slate-50 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : insights.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center text-slate-400 shadow-sm">
              <Sparkles className="w-10 h-10 mx-auto mb-3 text-slate-200" />
              <p className="font-medium">Không có gợi ý nào</p>
              <p className="text-xs mt-1">Hãy thêm JD và đăng tin để AI có dữ liệu phân tích.</p>
            </div>
          ) : (
            insights.map((ins: any, i: number) => <InsightCard key={i} insight={ins} index={i} jdScores={jdScores} />)
          )}

          {/* JD Score Table */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <h3 className="font-bold text-slate-800 text-sm">Điểm AI cho từng JD</h3>
            </div>
            {analysing ? (
              <div className="divide-y divide-slate-100">
                {[1, 2, 3].map(i => (
                  <div key={i} className="px-6 py-3.5 flex items-center gap-4 animate-pulse">
                    <div className="w-5 h-3 bg-slate-100 rounded" />
                    <div className="flex-1 h-3 bg-slate-100 rounded" />
                    <div className="w-24 h-3 bg-slate-100 rounded" />
                  </div>
                ))}
              </div>
            ) : jdScores.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-400 text-sm">Chưa có JD nào để chấm điểm.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {jdScores.map((jd: any, i: number) => (
                  <div key={i} className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-50 transition-colors group">
                    <span className="text-xs font-bold text-slate-400 w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-slate-800 truncate">{jd.title}</span>
                        {jd.trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
                        {jd.trend === 'down' && <ArrowDownRight className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">{jd.reason}</p>
                      
                      {/* Hiển thị điểm mạnh và điểm yếu */}
                      <div className="flex flex-col gap-1.5 mt-2">
                        {jd.strengths && jd.strengths.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {jd.strengths.map((s: string, idx: number) => (
                              <span key={`s-${idx}`} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-medium rounded border border-emerald-100 line-clamp-1 break-words">{s}</span>
                            ))}
                          </div>
                        )}
                        {jd.weaknesses && jd.weaknesses.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {jd.weaknesses.map((w: string, idx: number) => (
                              <span key={`w-${idx}`} className="px-1.5 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-medium rounded border border-rose-100 line-clamp-1 break-words">{w}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className={`h-2 rounded-full transition-all ${jd.score >= 80 ? 'bg-emerald-500' : jd.score >= 60 ? 'bg-amber-400' : 'bg-rose-400'}`} style={{ width: `${jd.score}%` }} />
                      </div>
                      <span className={`text-xs font-black w-8 text-right ${jd.score >= 80 ? 'text-emerald-600' : jd.score >= 60 ? 'text-amber-600' : 'text-rose-500'}`}>{jd.score}</span>
                      {jd.trend === 'up' ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : jd.trend === 'down' ? <ArrowDown className="w-3 h-3 text-rose-400" /> : <span className="w-3 h-3" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: AI Chat */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <BotMessageSquare className="w-4 h-4 text-indigo-500" /> Trợ lý AI
          </h2>
          <AiChatMini />
        </div>
      </div>
    </motion.div>
  );
}
