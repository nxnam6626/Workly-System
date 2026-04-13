"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, FileUp, Sparkles, ArrowRight, CornerDownRight } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";

export default function ImportCvPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      if (selectedFile.type !== "application/pdf") {
        setError("Vui lòng tải lên định dạng tệp PDF.");
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("Kích thước tệp vượt quá giới hạn 5MB.");
        return;
      }
      setFile(selectedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    const toastId = toast.loading("Trí tuệ nhân tạo đang phân tích CV của bạn...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      await api.post("/candidates/cv/extract", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Bóc tách CV thành công, hồ sơ của bạn đã được cập nhật!", { id: toastId });

      // Redirect to the profile or dashboard after successful import
      setTimeout(() => {
        router.push("/profile");
      }, 1500);

    } catch (err: any) {
      console.error(err);
      const errorMessage = err.response?.data?.message || "Đã xảy ra lỗi khi phân tích CV. Vui lòng thử lại.";
      setError(errorMessage);
      toast.error(errorMessage, { id: toastId });
      setIsUploading(false);
      setFile(null); // Clear file to let user try another one easily
    }
  };

  const handleSkip = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#F3F5F7] flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-sm overflow-hidden flex flex-col md:flex-row relative">

        {/* Progress header */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
          <div className="h-full bg-blue-600 w-full"></div>
        </div>

        <div className="p-8 md:p-12 w-full flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Workly AI</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
            Khởi tạo hồ sơ cực nhanh bằng CV
          </h1>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Hệ thống AI sẽ tự động đọc, phân tích và trích xuất kinh nghiệm cũng như kỹ năng của bạn chỉ trong vài giây.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 flex items-start gap-3 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {!file ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${isDragActive ? "border-blue-500 bg-blue-50 scale-[1.01]" : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
                }`}
            >
              <input {...getInputProps()} />
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <FileUp className="w-8 h-8" />
              </div>
              <p className="text-slate-900 font-semibold text-lg mb-1">
                Kéo thả file CV vào đây
              </p>
              <p className="text-slate-500 text-sm mb-4">
                Hoặc bấm để chọn từ máy tính của bạn
              </p>
              <div className="text-xs text-slate-400 font-medium px-3 py-1 bg-slate-100 rounded-md">
                Hỗ trợ định dạng .PDF (Tối đa 5MB)
              </div>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50">
              <FileText className="w-12 h-12 text-blue-500 mb-4" />
              <p className="font-semibold text-slate-900 text-lg">{file.name}</p>
              <p className="text-slate-500 text-sm mb-6">{(file.size / 1024 / 1024).toFixed(2)} MB</p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setFile(null)}
                  disabled={isUploading}
                  className="flex-1 py-3 px-4 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  Chọn file khác
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center justify-center shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang phân tích...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" /> Bắt đầu phân tích
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="mt-10 flex items-center justify-center border-t border-slate-100 pt-6">
            <button
              onClick={handleSkip}
              disabled={isUploading}
              className="text-slate-500 font-medium hover:text-slate-800 flex items-center gap-1 transition-colors group"
            >
              Bỏ qua, tôi sẽ tự cập nhật hồ sơ thủ công
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
