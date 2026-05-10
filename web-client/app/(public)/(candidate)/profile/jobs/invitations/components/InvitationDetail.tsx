import React from "react";
import Link from "next/link";
import {
  Building2, DollarSign, MapPin, Briefcase, Calendar, MessageSquare, ExternalLink, RefreshCw, CheckCircle2, ArrowRight, XCircle
} from "lucide-react";
import { Invitation } from "../types";
import { STATUS_CONFIG } from "./CondensedInvitationCard";
import { formatSalary } from "@/lib/utils";

interface InvitationDetailProps {
  activeInv: Invitation;
  isProcessing: boolean;
  onDecline: (id: string) => Promise<void>;
  onAcceptClick: (inv: Invitation) => void;
}

export const InvitationDetail: React.FC<InvitationDetailProps> = ({
  activeInv,
  isProcessing,
  onDecline,
  onAcceptClick,
}) => {
  const statusCfg = STATUS_CONFIG[activeInv.status];
  const StatusIcon = statusCfg.icon;

  return (
    <div className="space-y-5">
      {/* Full Header Info */}
      <div className="flex gap-4 items-start">
        <div className="w-16 h-16 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-center p-2.5 flex-shrink-0 shadow-sm">
          {activeInv.jobPosting.company.logo ? (
            <img src={activeInv.jobPosting.company.logo} alt=""
              className="max-w-full max-h-full object-contain" />
          ) : (
            <Building2 className="w-8 h-8 text-slate-200" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3 flex-wrap md:flex-nowrap">
            <div>
              <h3 className="font-black text-slate-950 text-[16px] leading-snug hover:text-blue-600 transition-colors">
                <Link href={`/jobs/${activeInv.jobPostingId}`}>
                  {activeInv.jobPosting.title}
                </Link>
              </h3>
              <p className="text-[12px] text-slate-400 font-bold mt-0.5 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-300" />
                {activeInv.jobPosting.company.companyName}
                {activeInv.jobPosting.company.industry && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-400 text-[11px] font-semibold">{activeInv.jobPosting.company.industry}</span>
                  </>
                )}
              </p>
            </div>

            {/* Big Status Badge */}
            <div className={`px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${statusCfg.color} ${statusCfg.bg} ${statusCfg.border}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {statusCfg.label}
            </div>
          </div>

          {/* Job Meta badges */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-100 text-[9px] font-black text-emerald-600 uppercase tracking-wider shadow-sm shadow-emerald-50">
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
              Công việc đã ứng tuyển
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-[9px] font-black text-indigo-600 uppercase tracking-wider shadow-sm shadow-indigo-50">
              <Building2 className="w-2.5 h-2.5 text-indigo-500" />
              Doanh nghiệp xác thực
            </span>
          </div>
        </div>
      </div>

      {/* Meta Specifications */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 py-3 border-y border-slate-50 text-[11px] font-bold text-slate-400">
        <span className="flex items-center gap-2 text-[#1e60ad]">
          <DollarSign className="w-4 h-4" />
          {formatSalary(activeInv.jobPosting.salaryMin, activeInv.jobPosting.salaryMax, activeInv.jobPosting.currency)}
        </span>
        <span className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {activeInv.jobPosting.locationCity}
        </span>
        {activeInv.jobPosting.jobType && (
          <span className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            {activeInv.jobPosting.jobType}
          </span>
        )}
        <span className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Nhận lời mời: {new Date(activeInv.createdAt).toLocaleDateString("vi-VN")}
        </span>
      </div>

      {/* Recruiter Message chat-like box */}
      <div className="px-5 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl relative space-y-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-slate-300" />
          Thư mời phỏng vấn từ Phòng Nhân sự
        </p>
        <p className="text-[13px] text-slate-600 leading-relaxed italic">
          "{activeInv.message || 'Chúng tôi rất ấn tượng với hồ sơ của bạn và muốn hẹn lịch phỏng vấn để trao đổi thêm.'}"
        </p>
      </div>

      {/* Footer detailed action row */}
      <div className="pt-4 border-t border-slate-50 flex items-center justify-between gap-4">
        <Link href={`/jobs/${activeInv.jobPostingId}`}
          className="text-xs text-blue-500 font-extrabold hover:text-blue-700 flex items-center gap-1.5 transition-colors">
          <ExternalLink className="w-4 h-4" />
          Xem chi tiết vị trí công việc
        </Link>

        {activeInv.status === "PENDING" && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onDecline(activeInv.invitationId)}
              disabled={isProcessing}
              className="px-6 py-2.5 text-xs font-black text-slate-400 hover:text-red-500 border border-slate-200 hover:border-red-200 hover:bg-red-50 rounded-2xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              Từ chối
            </button>
            <button
              onClick={() => onAcceptClick(activeInv)}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-[#1e60ad] hover:bg-[#164e8c] text-white text-xs font-black rounded-2xl transition-all shadow-md shadow-blue-50 active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Chọn thời gian phỏng vấn
            </button>
          </div>
        )}

        {activeInv.status === "ACCEPTED" && (
          <Link
            href="/profile/jobs/interviews"
            className="flex items-center gap-1.5 px-6 py-2.5 bg-[#1e60ad] hover:bg-[#164e8c] text-white text-xs font-black rounded-2xl transition-all shadow-md shadow-blue-50 active:scale-95"
          >
            Xem lịch phỏng vấn
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}

        {activeInv.status === "DECLINED" && (
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-2xl">
              <XCircle className="w-4 h-4 text-slate-400" />
              Bạn đã từ chối lời mời phỏng vấn này.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
export default InvitationDetail;
