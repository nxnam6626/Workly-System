'use client';

import React, { useEffect, useState, useMemo } from 'react';
import useSWR from 'swr';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import {
  Plus, Trash2, Star, CheckCircle2, XCircle, Clock,
  ChevronDown, Save, Award, Calendar
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';

const fetcher = (url: string) => api.get(url).then((r) => r.data);

// ── Default criteria (preset, recruiter can modify) ──────────────────
const DEFAULT_CRITERIA = [
  { name: 'Chuyên môn / Nghiệp vụ', score: 0, maxScore: 5 },
  { name: 'Kỹ năng giao tiếp', score: 0, maxScore: 5 },
  { name: 'Tư duy & Giải quyết vấn đề', score: 0, maxScore: 5 },
  { name: 'Thái độ & Văn hóa', score: 0, maxScore: 5 },
  { name: 'Kinh nghiệm thực tế', score: 0, maxScore: 5 },
];

interface Criterion { name: string; score: number; maxScore: number }

interface Props {
  applicationId: string;
  candidateName?: string;
  interviewDate?: string;
  interviewTime?: string;
  roundNumber?: number;
  roundName?: string;
  onRefresh?: () => void;
}

const RESULT_OPTIONS = [
  { value: 'PASS', label: 'Đạt', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100' },
  { value: 'PENDING', label: 'Chờ', icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100' },
  { value: 'FAIL', label: 'Không đạt', icon: XCircle, color: 'text-rose-600 bg-rose-50 border-rose-200 hover:bg-rose-100' },
];

function ScoreDots({ score, max, onChange }: { score: number; max: number; onChange?: (s: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1.5" onMouseLeave={() => setHover(0)}>
      {Array.from({ length: max }).map((_, i) => {
        const val = i + 1;
        const filled = val <= (hover || score);
        return (
          <button
            key={i}
            type="button"
            title={`${val}/${max}`}
            onMouseEnter={() => onChange && setHover(val)}
            onClick={() => onChange?.(val === score ? 0 : val)}
            className={`w-5 h-5 rounded-full border-2 transition-all duration-150 ${
              filled
                ? 'bg-sky-500 border-sky-500 scale-110'
                : 'border-slate-300 bg-white hover:border-sky-400'
            } ${onChange ? 'cursor-pointer' : 'cursor-default'}`}
          />
        );
      })}
    </div>
  );
}

export default function ScorecardPanel({
  applicationId,
  candidateName,
  interviewDate,
  interviewTime,
  roundNumber = 1,
  roundName,
  onRefresh,
}: Props) {
  const { data: evaluations, mutate, isLoading } = useSWR(
    `/evaluations/application/${applicationId}`,
    fetcher
  );

  const [currentRound, setCurrentRound] = useState(roundNumber);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleLocation, setScheduleLocation] = useState('');

  // Calculate max rounds based on evaluation data
  const maxRound = Math.max(1, ...(evaluations?.map((e: any) => e.roundNumber) || []));

  const { user } = useAuthStore();
  
  // My current round evaluation
  const myEval = evaluations?.find((e: any) => e.roundNumber === currentRound && e.recruiter?.user?.userId === user?.userId);

  const [criteria, setCriteria] = useState<Criterion[]>(DEFAULT_CRITERIA);
  const [overallRating, setOverallRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState<'PENDING' | 'PASS' | 'FAIL'>('PENDING');
  const [rName, setRName] = useState(roundName || 'Vòng phỏng vấn');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOthers, setShowOthers] = useState(false);
  const [newCriterionName, setNewCriterionName] = useState('');

  // Load existing eval into form
  useEffect(() => {
    if (myEval) {
      let savedCriteria = myEval.criteriaScores || [];
      if (typeof savedCriteria === 'string') {
        try { savedCriteria = JSON.parse(savedCriteria); } catch { savedCriteria = []; }
      }
      if (!Array.isArray(savedCriteria)) savedCriteria = [];
      
      setCriteria(savedCriteria.length > 0 ? savedCriteria : DEFAULT_CRITERIA);
      setOverallRating(myEval.overallRating || 0);
      setNotes(myEval.notes || '');
      setResult(myEval.result || 'PENDING');
      setRName(myEval.roundName || `Vòng ${currentRound}`);
    } else {
      setCriteria(DEFAULT_CRITERIA);
      setOverallRating(0);
      setNotes('');
      setResult('PENDING');
      setRName(`Vòng ${currentRound}`);
    }
  }, [myEval, currentRound]);

  const avgScore = criteria.length > 0
    ? Math.round((criteria.reduce((sum, c) => sum + (c.maxScore > 0 ? (c.score / c.maxScore) * 5 : 0), 0) / criteria.length) * 10) / 10
    : 0;

  const updateScore = (idx: number, score: number) => {
    setCriteria((prev) => prev.map((c, i) => (i === idx ? { ...c, score } : c)));
  };

  const removeCriterion = (idx: number) => {
    setCriteria((prev) => prev.filter((_, i) => i !== idx));
  };

  const addCriterion = () => {
    if (!newCriterionName.trim()) return;
    setCriteria((prev) => [...prev, { name: newCriterionName.trim(), score: 0, maxScore: 5 }]);
    setNewCriterionName('');
  };

  const roundSessionDate = useMemo(() => {
    const ev = evaluations?.find((e: any) => e.roundNumber === currentRound && e.recruiter?.user?.userId === user?.userId);
    return ev ? ev.sessionDate : interviewDate;
  }, [evaluations, currentRound, interviewDate, user?.userId]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await api.post('/evaluations', {
        applicationId,
        roundNumber: currentRound,
        roundName: rName,
        sessionDate: roundSessionDate,
        criteriaScores: criteria,
        overallRating,
        notes,
        result,
      });
      toast.success('Đã lưu đánh giá!');
      await mutate();
      onRefresh?.();
    } catch {
      toast.error('Lỗi khi lưu đánh giá');
    } finally {
      setIsSubmitting(false);
    }
  };

  const otherEvals = evaluations?.filter((e: any) => e.roundNumber === currentRound && e.evaluationId !== myEval?.evaluationId) || [];

  const roundAvgScore = useMemo(() => {
    const roundEvals = evaluations?.filter((e: any) => e.roundNumber === currentRound) || [];
    let totalScore = 0;
    let totalCriteria = 0;
    roundEvals.forEach((ev: any) => {
      let cr = ev.criteriaScores || [];
      if (typeof cr === 'string') {
        try { cr = JSON.parse(cr); } catch { cr = []; }
      }
      if (!Array.isArray(cr)) cr = [];
      cr.forEach((c: any) => {
        if (c.maxScore > 0) {
          totalScore += (c.score / c.maxScore) * 5;
          totalCriteria++;
        }
      });
    });
    if (totalCriteria === 0) return 0;
    return Math.round((totalScore / totalCriteria) * 10) / 10;
  }, [evaluations, currentRound]);

  const handleScheduleNextRound = async () => {
    if (!scheduleDate || !scheduleTime) return toast.error('Vui lòng chọn ngày và giờ!');

    const scheduleDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
    const now = new Date();

    if (scheduleDateTime <= now) {
      return toast.error('Thời gian hẹn vòng tiếp phải lớn hơn thời điểm hiện tại!');
    }

    if (interviewDate) {
      const currentRoundDateStr = interviewDate.split('T')[0];
      const currentRoundTimeStr = interviewTime || '00:00';
      const currentRoundDateTime = new Date(`${currentRoundDateStr}T${currentRoundTimeStr}`);

      if (scheduleDateTime <= currentRoundDateTime) {
        return toast.error('Thời gian hẹn vòng tiếp phải lớn hơn thời điểm của vòng gần nhất!');
      }
    }

    setIsSubmitting(true);
    try {
      await api.post('/evaluations/schedule-next-round', {
        applicationId,
        interviewDate: scheduleDate,
        interviewTime: scheduleTime,
        interviewLocation: scheduleLocation,
      });
      toast.success('Đã lên lịch vòng tiếp theo!');
      setIsScheduling(false);
      await mutate();
      setCurrentRound(maxRound + 1);
      onRefresh?.();
    } catch {
      toast.error('Lỗi khi lên lịch phỏng vấn');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      
      {/* Round Tabs */}
      <div className="flex items-center gap-1.5 px-4 pt-4 pb-2 overflow-x-auto shrink-0 border-b border-slate-200 bg-white">
        {Array.from({ length: maxRound }).map((_, i) => {
          const r = i + 1;
          const isActive = !isScheduling && currentRound === r;
          return (
            <button
              key={r}
              onClick={() => { setIsScheduling(false); setCurrentRound(r); }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                isActive ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              Vòng {r}
            </button>
          );
        })}
        <button
          onClick={() => setIsScheduling(true)}
          className={`px-3 py-1.5 flex items-center gap-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
            isScheduling ? 'bg-sky-500 text-white shadow-md shadow-sky-200' : 'bg-sky-50 text-sky-600 hover:bg-sky-100'
          }`}
        >
          <Plus size={12} /> Hẹn vòng tiếp
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {isScheduling ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-4">
              <Calendar size={16} className="text-sky-500" />
              Hẹn lịch phỏng vấn tiếp theo
            </h3>
            
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Ngày phỏng vấn <span className="text-rose-500">*</span></label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Giờ phỏng vấn <span className="text-rose-500">*</span></label>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Địa điểm / Link Meeting</label>
              <input
                type="text"
                placeholder="VD: Google Meet link, Phòng họp A..."
                value={scheduleLocation}
                onChange={(e) => setScheduleLocation(e.target.value)}
                className="w-full text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>

            <button
              onClick={handleScheduleNextRound}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 mt-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all active:scale-[0.98] shadow-md shadow-sky-200"
            >
              <Save size={16} />
              {isSubmitting ? 'Đang lưu...' : 'Lưu & Di chuyển ứng viên'}
            </button>
          </div>
        ) : (
          <>
            {/* Round Info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm relative">
          <div className="absolute top-4 right-4 text-right">
            <p className="text-[10px] uppercase font-bold text-slate-400">ĐIỂM TỔNG HỢP VÒNG {currentRound}</p>
            <p className={`text-xl font-black ${
              roundAvgScore >= 4 ? 'text-emerald-600' :
              roundAvgScore >= 2.5 ? 'text-amber-500' :
              roundAvgScore > 0 ? 'text-rose-500' : 'text-slate-300'
            }`}>
              {roundAvgScore > 0 ? `${roundAvgScore}/5` : '—'}
            </p>
          </div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Tên vòng phỏng vấn</label>
          <input
            value={rName}
            onChange={(e) => setRName(e.target.value)}
            className="w-3/4 text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 outline-none"
            placeholder="VD: Vòng kỹ thuật, Vòng văn hóa..."
          />
          {roundSessionDate && (
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
              <Clock size={12} />
              {new Date(roundSessionDate).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          )}
        </div>

        {/* Criteria Scoring */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Award size={15} className="text-sky-500" />
              Tiêu chí đánh giá
            </h3>
            <div className={`text-sm font-bold px-3 py-1 rounded-full ${
              avgScore >= 4 ? 'bg-emerald-50 text-emerald-700' :
              avgScore >= 2.5 ? 'bg-amber-50 text-amber-700' :
              avgScore > 0 ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-500'
            }`}>
              TB: {avgScore > 0 ? `${avgScore}/5` : '—'}
            </div>
          </div>

          <div className="divide-y divide-slate-50">
            {criteria.map((c, idx) => (
              <div key={idx} className="px-4 py-3 flex items-center justify-between gap-3 group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{c.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{c.score}/{c.maxScore} điểm</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <ScoreDots score={c.score} max={c.maxScore} onChange={(s) => updateScore(idx, s)} />
                  <button
                    onClick={() => removeCriterion(idx)}
                    className="p-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all rounded-md hover:bg-rose-50"
                    title="Xóa tiêu chí"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Criterion */}
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex gap-2">
            <input
              value={newCriterionName}
              onChange={(e) => setNewCriterionName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCriterion()}
              placeholder="Thêm tiêu chí mới..."
              className="flex-1 text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-400 outline-none text-slate-700"
            />
            <button
              onClick={addCriterion}
              className="px-3 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors flex items-center gap-1 text-xs font-semibold"
            >
              <Plus size={13} /> Thêm
            </button>
          </div>
        </div>

        {/* Overall Rating */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Đánh giá tổng thể</label>
          <div className="flex items-center gap-2 mb-4" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="focus:outline-none transition-transform hover:scale-110"
                onClick={() => setOverallRating(star === overallRating ? 0 : star)}
                onMouseEnter={() => setHoverRating(star)}
              >
                <Star
                  size={24}
                  className={`transition-colors ${(hoverRating || overallRating) >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
                />
              </button>
            ))}
            {overallRating > 0 && (
              <button onClick={() => setOverallRating(0)} className="text-[10px] text-slate-400 hover:text-slate-600 ml-1 font-medium">
                Xóa
              </button>
            )}
          </div>

          {/* Result */}
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Kết quả</label>
          <div className="flex gap-2">
            {RESULT_OPTIONS.map(({ value, label, icon: Icon, color }) => (
              <button
                key={value}
                onClick={() => setResult(value as any)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-sm font-semibold transition-all ${
                  result === value ? color : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Ghi chú nội bộ</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Nhận xét chi tiết về ứng viên..."
            rows={3}
            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-sky-500 outline-none resize-none text-slate-700 placeholder:text-slate-400"
          />
        </div>

        {/* Other Evaluators */}
        {otherEvals.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              onClick={() => setShowOthers(!showOthers)}
              className="w-full px-4 py-3 flex items-center justify-between text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span>Đánh giá từ {otherEvals.length} người khác</span>
              <ChevronDown size={15} className={`transition-transform ${showOthers ? 'rotate-180' : ''}`} />
            </button>
            {showOthers && (
              <div className="divide-y divide-slate-50 border-t border-slate-100">
                {otherEvals.map((e: any) => {
                  let scores: Criterion[] = e.criteriaScores || [];
                  if (typeof scores === 'string') {
                    try { scores = JSON.parse(scores); } catch { scores = []; }
                  }
                  if (!Array.isArray(scores)) scores = [];

                  const avg = scores.length > 0
                    ? Math.round((scores.reduce((s: number, c: Criterion) => s + (c.maxScore > 0 ? (c.score / c.maxScore) * 5 : 0), 0) / scores.length) * 10) / 10
                    : 0;
                  return (
                    <div key={e.evaluationId} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <img src={e.recruiter?.user?.avatar || '/default-avatar.png'} className="w-7 h-7 rounded-full object-cover border border-slate-100" alt="" />
                          <span className="text-sm font-semibold text-slate-700">{e.recruiter?.fullName}</span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                          e.result === 'PASS' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          e.result === 'FAIL' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {e.result === 'PASS' ? 'Đạt' : e.result === 'FAIL' ? 'Không đạt' : 'Chờ'} · {avg}/5
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {scores.map((c: Criterion, i: number) => (
                          <span key={i} className="text-[10px] px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-slate-600 font-medium">
                            {c.name}: <span className="text-sky-600 font-bold">{c.score}/{c.maxScore}</span>
                          </span>
                        ))}
                      </div>
                      {e.notes && <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-2">{e.notes}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        </>
        )}
      </div>

      {/* Save Footer - Only show if NOT scheduling */}
      {!isScheduling && (
        <div className="p-4 border-t border-slate-200 bg-white">
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all active:scale-[0.98] shadow-md shadow-sky-200"
          >
            <Save size={16} />
            {isSubmitting ? 'Đang lưu...' : myEval ? 'Cập nhật đánh giá' : 'Lưu đánh giá'}
          </button>
          <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">
            Chỉ hiển thị nội bộ trong công ty bạn
          </p>
        </div>
      )}
    </div>
  );
}
