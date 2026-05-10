"use client";

import React, { useState, useEffect, useMemo } from "react";
import { BellOff, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { ProfilePageShell, ProfileSearchBar } from "@/components/candidates/ProfilePageShell";
import toast from "react-hot-toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";

import { Invitation } from "./types";
import { CondensedInvitationCard } from "./components/CondensedInvitationCard";
import { InvitationDetail } from "./components/InvitationDetail";
import { ProposedSlotsSchedulerModal } from "./components/ProposedSlotsSchedulerModal";

const FILTERS = ["Tất cả", "Chờ phản hồi", "Đã chấp nhận", "Đã từ chối"];
const FILTER_MAP: Record<string, string | null> = {
  "Tất cả": null,
  "Chờ phản hồi": "PENDING",
  "Đã chấp nhận": "ACCEPTED",
  "Đã từ chối": "DECLINED",
};

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("Tất cả");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"NEWEST" | "OLDEST">("NEWEST");
  const confirm = useConfirm();

  // Scheduling states
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);
  const [selectedInvitationId, setSelectedInvitationId] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        const res = await api.get("/candidates/me/invitations");
        const items = res.data.items || res.data || [];
        setInvitations(items);
      } catch (error) {
        console.error("Error fetching invitations:", error);
        setInvitations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchInvitations();
  }, []);

  const handleAcceptClick = (inv: Invitation) => {
    setSelectedInvitation(inv);
    setIsSchedulerOpen(true);
  };

  const handleConfirmSchedule = async (finalSlot: string) => {
    if (!selectedInvitation) return;
    const id = selectedInvitation.invitationId;
    setProcessingId(id);
    setIsSchedulerOpen(false);

    if (id.startsWith("inv-")) {
      setInvitations(prev =>
        prev.map(inv => inv.invitationId === id ? { ...inv, status: "ACCEPTED" } : inv)
      );
      toast.success(`Đặt lịch phỏng vấn thành công lúc: ${finalSlot}!`);
      setProcessingId(null);
      return;
    }

    try {
      await api.patch(`/candidates/me/invitations/${id}/status`, {
        status: "ACCEPTED",
        scheduledTime: finalSlot
      });
      setInvitations(prev =>
        prev.map(inv => inv.invitationId === id ? { ...inv, status: "ACCEPTED" } : inv)
      );
      toast.success(`Đặt lịch phỏng vấn thành công lúc: ${finalSlot}!`);
    } catch (error) {
      toast.error("Có lỗi xảy ra khi chấp nhận lời mời");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (id: string) => {
    const ok = await confirm({
      title: "Từ chối lời mời?",
      message: "Lời mời sẽ bị từ chối. Nhà tuyển dụng sẽ không nhận được thông báo về lý do.",
      confirmText: "Từ chối",
      variant: "danger",
    });
    if (!ok) return;
    setProcessingId(id);

    if (id.startsWith("inv-")) {
      setInvitations(prev =>
        prev.map(inv => inv.invitationId === id ? { ...inv, status: "DECLINED" } : inv)
      );
      toast.success("Đã từ chối lời mời.");
      setProcessingId(null);
      return;
    }

    try {
      await api.patch(`/candidates/me/invitations/${id}/status`, { status: "DECLINED" });
      setInvitations(prev =>
        prev.map(inv => inv.invitationId === id ? { ...inv, status: "DECLINED" } : inv)
      );
      toast.success("Đã từ chối lời mời.");
    } catch (error) {
      toast.error("Có lỗi xảy ra khi từ chối lời mời");
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = useMemo(() => {
    const statusFilter = FILTER_MAP[activeFilter];
    const result = invitations.filter(inv => {
      const matchSearch = !searchTerm ||
        inv.jobPosting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.jobPosting.company.companyName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchFilter = !statusFilter || inv.status === statusFilter;
      return matchSearch && matchFilter;
    });

    return [...result].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === "NEWEST" ? dateB - dateA : dateA - dateB;
    });
  }, [invitations, searchTerm, activeFilter, sortBy]);

  useEffect(() => {
    if (filtered.length > 0) {
      const activeExists = filtered.some((inv: Invitation) => inv.invitationId === selectedInvitationId);
      if (!activeExists) {
        setSelectedInvitationId(filtered[0].invitationId);
      }
    } else {
      setSelectedInvitationId(null);
    }
  }, [filtered, selectedInvitationId]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    invitations.forEach(inv => { c[inv.status] = (c[inv.status] || 0) + 1; });
    return c;
  }, [invitations]);

  return (
    <ProfilePageShell
      title={
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-500 text-[12px] font-medium">
            <Link href="/" className="hover:text-[#1e60ad] transition-colors">Trang chủ</Link>
            <span>/</span>
            <Link href="/profile" className="hover:text-[#1e60ad] transition-colors">Quản lý hồ sơ</Link>
            <span>/</span>
            <span className="text-slate-400">Lời mời phỏng vấn</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">
            Lời mời phỏng vấn
          </h1>
        </div>
      }
      subtitle={`${invitations.length} cơ hội phỏng vấn đặc quyền dành riêng cho bạn`}
      action={
        <ProfileSearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Tìm theo tên việc, công ty..."
          accentColor="focus:border-emerald-400"
        />
      }
      filters={
        <>
          {FILTERS.map(f => {
            const statusKey = FILTER_MAP[f];
            const count = statusKey ? (counts[statusKey] || 0) : invitations.length;
            const isActive = activeFilter === f;
            return (
              <button key={f} onClick={() => setActiveFilter(f)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-150 border active:scale-95 ${isActive
                  ? "bg-slate-900 text-white border-slate-900 shadow-md"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700"
                  }`}>
                {f}
                {count > 0 && (
                  <span className={`text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                    }`}>{count}</span>
                )}
              </button>
            );
          })}
        </>
      }
    >
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-5">
            <span className="text-sm font-bold text-slate-800">Sắp xếp</span>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer text-[13px] font-semibold text-slate-600 select-none">
                <input
                  type="radio"
                  name="sort"
                  checked={sortBy === "OLDEST"}
                  onChange={() => setSortBy("OLDEST")}
                  className="w-4 h-4 text-[#1e60ad] focus:ring-[#1e60ad] border-slate-300"
                />
                Cũ nhất
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-[13px] font-semibold text-slate-600 select-none">
                <input
                  type="radio"
                  name="sort"
                  checked={sortBy === "NEWEST"}
                  onChange={() => setSortBy("NEWEST")}
                  className="w-4 h-4 text-[#1e60ad] focus:ring-[#1e60ad] border-slate-300"
                />
                Mới nhất
              </label>
            </div>
          </div>
          <span className="text-[13px] text-slate-400 font-bold">
            {filtered.length} kết quả phù hợp
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-xl bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded-lg w-3/4" />
                    <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
                    <div className="h-3 bg-slate-100 rounded-lg w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="popLayout" initial={false}>
            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* LEFT COLUMN: Master */}
                <div className="md:col-span-4 space-y-2.5 max-h-[78vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                  {filtered.map((inv: Invitation) => (
                    <CondensedInvitationCard
                      key={inv.invitationId}
                      inv={inv}
                      isSelected={selectedInvitationId === inv.invitationId}
                      onClick={() => setSelectedInvitationId(inv.invitationId)}
                    />
                  ))}
                </div>

                {/* RIGHT COLUMN: Detail */}
                <div className="md:col-span-8 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm sticky top-6">
                  {(() => {
                    const activeInv = filtered.find((inv: Invitation) => inv.invitationId === selectedInvitationId) || filtered[0];
                    if (!activeInv) return null;

                    return (
                      <InvitationDetail
                        activeInv={activeInv}
                        isProcessing={processingId === activeInv.invitationId}
                        onDecline={handleDecline}
                        onAcceptClick={handleAcceptClick}
                      />
                    );
                  })()}
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm p-20 text-center space-y-6"
              >
                <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
                  <BellOff className="w-9 h-9 text-slate-200" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900">
                    {searchTerm || activeFilter !== "Tất cả"
                      ? "Không tìm thấy kết quả"
                      : "Chưa có lời mời nào"}
                  </h3>
                  <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
                    {searchTerm || activeFilter !== "Tất cả"
                      ? "Thử thay đổi từ khóa hoặc bộ lọc."
                      : "Hãy cập nhật hồ sơ đầy đủ và bật trạng thái 'Sẵn sàng tìm việc' để nhà tuyển dụng có thể tìm thấy bạn!"}
                  </p>
                </div>
                {!searchTerm && activeFilter === "Tất cả" && (
                  <Link href="/profile"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-slate-900 text-white text-sm font-bold rounded-2xl hover:bg-[#1e60ad] transition-all shadow-lg group/cta">
                    Cập nhật hồ sơ ngay
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/cta:translate-x-0.5" />
                  </Link>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {isSchedulerOpen && selectedInvitation && (
          <ProposedSlotsSchedulerModal
            isOpen={isSchedulerOpen}
            onClose={() => setIsSchedulerOpen(false)}
            selectedInvitation={selectedInvitation}
            onConfirm={handleConfirmSchedule}
            isProcessing={processingId === selectedInvitation.invitationId}
          />
        )}
      </AnimatePresence>
    </ProfilePageShell>
  );
}
