"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Loader2, FileText, CheckCircle, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { profileApi } from "@/lib/profile-api";

interface VerificationUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemName: string;
  type: "degree" | "certification";
  onSuccess: () => void;
}

export function VerificationUploadModal({
  isOpen,
  onClose,
  itemId,
  itemName,
  type,
  onSuccess,
}: VerificationUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("Tệp tải lên không được vượt quá 10MB.");
        setFile(null);
        return;
      }
      setError(null);
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Vui lòng chọn tệp tài liệu minh chứng.");
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      if (type === "certification") {
        await profileApi.verifyCertification(itemId, file);
      } else {
        await profileApi.verifyDegree(itemId, file);
      }
      toast.success("Đã tải tài liệu xác minh lên thành công! Đang chờ quản trị viên duyệt.");
      onSuccess();
      handleClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Lỗi khi tải minh chứng lên.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 md:p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden z-10 shadow-[0_24px_64px_rgba(0,0,0,0.2)] border border-slate-100"
          >
            {/* Top color bar */}
            <div className="h-1.5 bg-gradient-to-r from-rose-500 to-rose-400" />

            {/* Header */}
            <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Xác minh năng lực</h3>
                <p className="text-xs text-slate-400 mt-0.5">Tải tệp minh chứng cho: <span className="font-semibold text-rose-500">{itemName}</span></p>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  file
                    ? "border-rose-300 bg-rose-50/20"
                    : "border-slate-200 hover:border-rose-400 bg-slate-50/50 hover:bg-white"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, application/pdf"
                  className="hidden"
                />

                {file ? (
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center mx-auto">
                      <FileText className="w-6 h-6 text-rose-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 line-clamp-1">{file.name}</p>
                      <p className="text-xs text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                    <span className="inline-block text-[10px] bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Tệp đã chọn</span>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">Chọn hoặc Kéo tệp vào đây</p>
                      <p className="text-xs text-slate-400">Hỗ trợ PNG, JPG, hoặc PDF (Tối đa 10MB)</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Warnings/Error */}
              {error && (
                <div className="p-3 bg-red-50 rounded-xl flex items-start gap-2.5 text-xs text-red-600 font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="p-3.5 bg-rose-50/50 rounded-xl flex items-start gap-2.5 text-[11px] text-rose-700 leading-normal">
                <CheckCircle className="w-4 h-4 flex-shrink-0 text-rose-500 mt-0.5" />
                <span>
                  Bằng cách nộp tài liệu này, bạn xác nhận rằng thông tin bằng cấp/chứng chỉ là hoàn toàn chính xác. Hệ thống sẽ kiểm duyệt tài liệu và cập nhật huy hiệu xác minh trên hồ sơ của bạn.
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 pt-2 bg-slate-50/50 border-t border-slate-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={isUploading || !file}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-40 shadow-sm"
                style={{ background: "linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)" }}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tải lên...
                  </>
                ) : (
                  "Nộp minh chứng"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
