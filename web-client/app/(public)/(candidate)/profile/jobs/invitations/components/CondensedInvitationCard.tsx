import React from "react";
import { motion } from "framer-motion";
import { Building2, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Invitation } from "../types";

export const STATUS_CONFIG = {
  PENDING: {
    label: "Chờ phản hồi",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    accentColor: "#F59E0B",
  },
  ACCEPTED: {
    label: "Đã chấp nhận",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    accentColor: "#10B981",
  },
  DECLINED: {
    label: "Đã từ chối",
    icon: XCircle,
    color: "text-slate-400",
    bg: "bg-slate-50",
    border: "border-slate-200",
    accentColor: "#94A3B8",
  },
} as const;

interface CondensedInvitationCardProps {
  inv: Invitation;
  isSelected: boolean;
  onClick: () => void;
}

const CondensedInvitationCardComponent: React.FC<CondensedInvitationCardProps> = ({ inv, isSelected, onClick }) => {
  const statusCfg = STATUS_CONFIG[inv.status];
  const StatusIcon = statusCfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.18 }}
      onClick={onClick}
      className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 relative overflow-hidden flex flex-col gap-3 ${
        isSelected
          ? "border-blue-600 bg-blue-50/20 shadow-sm"
          : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"
      } ${inv.status === "DECLINED" ? "opacity-60" : ""}`}
    >
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
      )}

      <div className="flex gap-3 items-center">
        <div className="w-10 h-10 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center p-1.5 flex-shrink-0">
          {inv.jobPosting.company.logo ? (
            <img src={inv.jobPosting.company.logo} alt=""
              className="max-w-full max-h-full object-contain" />
          ) : (
            <Building2 className="w-5 h-5 text-slate-200" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="font-extrabold text-slate-800 text-xs leading-tight truncate">
            {inv.jobPosting.title}
          </h4>
          <p className="text-[11px] text-slate-400 font-bold truncate mt-0.5">
            {inv.jobPosting.company.companyName}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-50 pt-2.5">
        <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${statusCfg.color} ${statusCfg.bg} ${statusCfg.border}`}>
          <StatusIcon className="w-3 h-3" />
          {statusCfg.label}
        </span>
        <span className="text-[10px] text-slate-400 font-bold">
          {new Date(inv.createdAt).toLocaleDateString("vi-VN")}
        </span>
      </div>
    </motion.div>
  );
};

export const CondensedInvitationCard = React.memo(CondensedInvitationCardComponent);
