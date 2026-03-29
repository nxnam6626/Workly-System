"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  CheckCircle,
  FileText,
  ArrowRight,
  Sparkles,
  Shield,
  Loader2,
  X,
} from "lucide-react";
import api from "@/lib/api";

export default function CvSetupPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const ACCEPTED_TYPES = ["application/pdf", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png", "image/jpeg"];
  const MAX_SIZE_MB = 10;

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Chỉ hỗ trợ PDF, DOC, DOCX, PNG, JPG.";
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `Kích thước file không được vượt quá ${MAX_SIZE_MB}MB.`;
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      setSelectedFile(null);
      return;
    }
    setUploadError(null);
    setSelectedFile(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("cv", selectedFile);
      await api.post("/cv/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadSuccess(true);
      setTimeout(() => router.push("/"), 1500);
    } catch (err: any) {
      setUploadError(
        err.response?.data?.message || "Tải CV thất bại. Vui lòng thử lại."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex flex-col">

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            Tải lên CV / Tạo mới CV
          </h1>
          <p className="text-slate-500 text-base max-w-lg mx-auto">
            Tải lên CV hiện có hoặc tạo CV chuyên nghiệp trong vài phút
          </p>
        </div>

        {/* Cards */}
        <div className="flex flex-col md:flex-row items-stretch gap-0 w-full max-w-4xl relative">
          {/* ── Left Card: Upload ── */}
          <div className="flex-1 bg-white rounded-3xl shadow-lg overflow-hidden flex flex-col">
            {/* Card header */}
            <div className="bg-blue-600 px-8 py-5">
              <h2 className="text-xl font-bold text-white text-center">
                Tải lên CV của bạn
              </h2>
            </div>

            {/* Card body */}
            <div className="flex-1 flex flex-col px-8 py-8 gap-6">
              {/* Drop zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex-1 flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 py-12 px-6
                  ${isDragging
                    ? "border-blue-500 bg-blue-50 scale-[1.02]"
                    : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
                  }
                  ${selectedFile ? "border-emerald-400 bg-emerald-50" : ""}
                `}
              >
                {uploadSuccess ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle className="w-9 h-9 text-emerald-500" />
                    </div>
                    <p className="text-emerald-700 font-semibold text-base">
                      Tải lên thành công!
                    </p>
                    <p className="text-slate-400 text-sm">Đang chuyển hướng...</p>
                  </>
                ) : selectedFile ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                      <FileText className="w-9 h-9 text-blue-600" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-slate-800 text-sm truncate max-w-[200px]">
                        {selectedFile.name}
                      </p>
                      <p className="text-slate-400 text-xs mt-1">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setUploadError(null);
                      }}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> Xoá file
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                      <Upload className="w-9 h-9 text-blue-600" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-blue-600 text-base">
                        Kéo thả file vào đây
                      </p>
                      <p className="text-slate-500 text-sm mt-1">
                        hoặc nhấn để chọn file từ máy tính
                      </p>
                    </div>
                    <p className="text-slate-400 text-xs">
                      Hỗ trợ: PDF, DOC, DOCX, PNG, JPG (Tối đa 10MB)
                    </p>
                  </>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                className="hidden"
                onChange={handleInputChange}
              />

              {/* Error */}
              {uploadError && (
                <p className="text-red-500 text-sm text-center -mt-2">
                  {uploadError}
                </p>
              )}

              {/* Upload button */}
              <button
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading || uploadSuccess}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-base shadow hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang tải lên...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Tải CV lên hệ thống
                  </>
                )}
              </button>

              {/* Footer note */}
              <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs">
                <Shield className="w-3.5 h-3.5" />
                Thông tin của bạn được bảo mật tuyệt đối
              </div>
            </div>
          </div>

          {/* ── Center Divider ── */}
          <div className="flex md:flex-col items-center justify-center px-4 py-6 md:py-0 z-10 shrink-0">
            <div className="w-16 h-10 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center text-slate-500 font-semibold text-sm select-none">
              hoặc
            </div>
          </div>

          {/* ── Right Card: Create ── */}
          <div className="flex-1 bg-white rounded-3xl shadow-lg overflow-hidden flex flex-col">
            {/* Card header */}
            <div className="bg-emerald-500 px-8 py-5">
              <h2 className="text-xl font-bold text-white text-center">
                Tạo mới CV chuyên nghiệp
              </h2>
            </div>

            {/* Card body */}
            <div className="flex-1 flex flex-col px-8 py-8 gap-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  Tạo CV ấn tượng với Workly CV
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Công cụ tạo CV thông minh giúp bạn xây dựng hồ sơ chuyên
                  nghiệp, nổi bật trong mắt nhà tuyển dụng.
                </p>
              </div>

              <ul className="space-y-4 flex-1">
                {[
                  "Hơn 10+ mẫu CV đẹp, hiện đại",
                  "Tùy chỉnh dễ dàng, không cần thiết kế",
                  "Tải xuống PDF chất lượng cao",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-slate-700 text-sm font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/profile"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-500 text-white font-semibold text-base shadow hover:bg-emerald-600 transition-all"
              >
                Bắt đầu tạo CV miễn phí
                <ArrowRight className="w-5 h-5" />
              </Link>

              <p className="text-slate-400 text-xs text-center">
                Chỉ mất 5 phút để hoàn thành
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
