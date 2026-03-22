'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Globe,
  Clock,
  Code2,
  Zap,
  FlaskConical,
  Save,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  testCrawl,
  crawlSourcesApi,
  CrawlSource,
  CreateCrawlSourceDto,
  CrawledJobPreview,
} from '@/lib/crawler-admin';

interface Props {
  source?: CrawlSource | null;
  onClose: () => void;
  onSaved: () => void;
}

const initialForm: CreateCrawlSourceDto = {
  sourceName: '',
  baseUrl: '',
  isActive: true,
  schedule: '0 2 * * *',
  titleSelector: '',
  descriptionSelector: '',
  salarySelector: '',
  renderJs: false,
};

function LabeledInput({
  label,
  hint,
  icon: Icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-700">{label}</label>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      <div className="relative">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Icon className="h-4 w-4 text-slate-400" />
          </div>
        )}
        <input
          {...props}
          className={`block w-full rounded-xl border border-slate-200 bg-white py-2.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-colors ${
            Icon ? 'pl-10 pr-4' : 'px-4'
          } ${props.className ?? ''}`}
        />
      </div>
    </div>
  );
}

export default function SourceFormModal({ source, onClose, onSaved }: Props) {
  const isEdit = !!source;
  const [form, setForm] = useState<CreateCrawlSourceDto>(
    source
      ? {
          sourceName: source.sourceName,
          baseUrl: source.baseUrl,
          isActive: source.isActive,
          schedule: source.config?.schedule ?? '0 2 * * *',
          titleSelector: source.config?.titleSelector ?? '',
          descriptionSelector: source.config?.descriptionSelector ?? '',
          salarySelector: source.config?.salarySelector ?? '',
          renderJs: source.config?.renderJs ?? false,
        }
      : initialForm
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<CrawledJobPreview[] | null>(null);
  const [testError, setTestError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [showConfig, setShowConfig] = useState(true);

  const set = (k: keyof CreateCrawlSourceDto, v: any) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleTestCrawl = async () => {
    setIsTesting(true);
    setTestResults(null);
    setTestError('');
    try {
      const results = await testCrawl({
        baseUrl: form.baseUrl,
        titleSelector: form.titleSelector,
        descriptionSelector: form.descriptionSelector,
        salarySelector: form.salarySelector,
        renderJs: form.renderJs,
      });
      setTestResults(results);
    } catch (err: any) {
      setTestError(
        err.response?.data?.message || err.message || 'Crawl thử thất bại.'
      );
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    setIsSubmitting(true);
    try {
      if (isEdit && source) {
        await crawlSourcesApi.update(source.id, form);
      } else {
        await crawlSourcesApi.create(form);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setSaveError(
        err.response?.data?.message || err.message || 'Lưu thất bại.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
      />

      {/* Drawer */}
      <motion.div
        key="drawer"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {isEdit ? 'Chỉnh sửa Nguồn Cào' : 'Thêm Nguồn Cào Mới'}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Cấu hình URL và CSS Selectors để bắt đầu crawl
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* ── Section 1: Source Info ── */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Thông tin Nguồn
            </h3>

            <LabeledInput
              label="Tên hiển thị"
              placeholder="VD: VietnamWorks IT"
              icon={Globe}
              value={form.sourceName}
              onChange={(e) => set('sourceName', e.target.value)}
              required
            />

            <LabeledInput
              label="URL cơ sở (baseUrl)"
              placeholder="https://vietnamworks.com/it-jobs"
              icon={Globe}
              type="url"
              value={form.baseUrl}
              onChange={(e) => set('baseUrl', e.target.value)}
              required
            />

            {/* isActive toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-sm font-semibold text-slate-700">Kích hoạt Cron Job</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bật để tự động chạy theo lịch
                </p>
              </div>
              <button
                type="button"
                onClick={() => set('isActive', !form.isActive)}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                  form.isActive ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    form.isActive ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </section>

          {/* ── Section 2: Crawl Config ── */}
          <section className="space-y-4">
            <button
              type="button"
              onClick={() => setShowConfig((s) => !s)}
              className="flex items-center justify-between w-full"
            >
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Cấu hình Cào (CSS Selectors)
              </h3>
              {showConfig ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            <AnimatePresence initial={false}>
              {showConfig && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden space-y-4"
                >
                  <LabeledInput
                    label="Lịch chạy (Cron)"
                    hint='VD: "0 2 * * *" = 2h sáng mỗi ngày. Dùng crontab.guru để kiểm tra.'
                    placeholder="0 2 * * *"
                    icon={Clock}
                    value={form.schedule}
                    onChange={(e) => set('schedule', e.target.value)}
                    required
                  />

                  <LabeledInput
                    label="Selector Tiêu đề (titleSelector)"
                    placeholder="h2.job-title a"
                    icon={Code2}
                    value={form.titleSelector}
                    onChange={(e) => set('titleSelector', e.target.value)}
                    required
                  />

                  <LabeledInput
                    label="Selector Mô tả (descriptionSelector)"
                    placeholder=".job-description"
                    icon={Code2}
                    value={form.descriptionSelector}
                    onChange={(e) => set('descriptionSelector', e.target.value)}
                    required
                  />

                  <LabeledInput
                    label="Selector Lương (salarySelector)"
                    hint="Không bắt buộc"
                    placeholder=".salary-range"
                    icon={Code2}
                    value={form.salarySelector}
                    onChange={(e) => set('salarySelector', e.target.value)}
                  />

                  {/* renderJs toggle */}
                  <div className="flex items-start justify-between p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <p className="text-sm font-semibold text-slate-700">
                          Render JavaScript (Puppeteer)
                        </p>
                      </div>
                      <p className="text-xs text-amber-700/70 mt-1 leading-relaxed">
                        Tắt = dùng Cheerio (nhanh). Bật = dùng Puppeteer (chậm hơn, dùng cho SPA / React / Next.js cần render JS).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => set('renderJs', !form.renderJs)}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none shrink-0 mt-0.5 ${
                        form.renderJs ? 'bg-amber-500' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                          form.renderJs ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* ── Test Crawl Button ── */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleTestCrawl}
                      disabled={isTesting || !form.baseUrl || !form.titleSelector}
                      className="flex items-center gap-2 px-4 py-2.5 bg-violet-50 border border-violet-200 text-violet-700 rounded-xl text-sm font-semibold hover:bg-violet-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isTesting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Đang cào thử...
                        </>
                      ) : (
                        <>
                          <FlaskConical className="w-4 h-4" />
                          🧪 Chạy Thử (Preview)
                        </>
                      )}
                    </button>
                    <p className="text-xs text-slate-400 mt-1.5">
                      Kiểm tra selector trước khi lưu. Backend sẽ cào thật và trả về ~5 tin mẫu.
                    </p>
                  </div>

                  {/* Test Error */}
                  {testError && (
                    <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      {testError}
                    </div>
                  )}

                  {/* Test Results Preview Table */}
                  {testResults !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-emerald-200 bg-emerald-50 overflow-hidden"
                    >
                      <div className="flex items-center gap-2 px-4 py-3 bg-emerald-100 border-b border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-semibold text-emerald-800">
                          Preview — {testResults.length} tin mẫu
                        </span>
                      </div>
                      {testResults.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-slate-500 text-center">
                          Không tìm thấy tin nào. Kiểm tra lại URL và Selector.
                        </p>
                      ) : (
                        <div className="divide-y divide-emerald-200/60">
                          {testResults.map((job, i) => (
                            <div key={i} className="px-4 py-3 space-y-0.5">
                              <p className="text-sm font-semibold text-slate-800 line-clamp-1">
                                {job.title || <span className="text-slate-400 italic">Không có tiêu đề</span>}
                              </p>
                              {job.salary && (
                                <p className="text-xs text-emerald-700">{job.salary}</p>
                              )}
                              {job.description && (
                                <p className="text-xs text-slate-500 line-clamp-2">{job.description}</p>
                              )}
                              {job.originalUrl && (
                                <a
                                  href={job.originalUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline mt-0.5"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Xem nguồn gốc
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Save error */}
          {saveError && (
            <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {saveError}
            </div>
          )}
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-100 transition-colors"
          >
            Hủy
          </button>
          <button
            form=""
            type="button"
            onClick={handleSubmit as any}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-md shadow-indigo-500/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEdit ? 'Cập nhật' : 'Tạo Nguồn'}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
