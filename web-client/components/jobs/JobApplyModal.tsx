"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  ChevronDown,
  Leaf,
  Pencil,
  AlertCircle,
  Briefcase
} from "lucide-react";
import Link from "next/link";

import api from "@/lib/api";
import toast from "react-hot-toast";

interface JobApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  companyName: string;
  jobPostingId: string;
  jobLocationCity?: string;
  onSuccess?: () => void;
}

interface UserCV {
  cvId: string;
  cvTitle: string;
  fileUrl: string;
  isMain: boolean;
  createdAt: string;
}

export function JobApplyModal({ isOpen, onClose, jobTitle, companyName, jobPostingId, onSuccess }: JobApplyModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(false);
  const [userCVs, setUserCVs] = useState<UserCV[]>([]);
  const [useExistingCv, setUseExistingCv] = useState(true);
  const [selectedCvId, setSelectedCvId] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    coverLetter: "",
    agree: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch profile and CVs
  React.useEffect(() => {
    if (isOpen) {
      const fetchProfile = async () => {
        setFetchingProfile(true);
        try {
          // Using standard api instance
          const response = await api.get("/candidates/me");

          if (response.data) {
            const profile = response.data;
            setFormData(prev => ({
              ...prev,
              fullName: profile.fullName || "",
              email: profile.user?.email || "",
              phone: profile.user?.phoneNumber || "",
            }));

            if (profile.cvs && profile.cvs.length > 0) {
              setUserCVs(profile.cvs);
              // Auto select main CV
              const mainCv = profile.cvs.find((cv: UserCV) => cv.isMain);
              if (mainCv) {
                setSelectedCvId(mainCv.cvId);
              } else {
                setSelectedCvId(profile.cvs[0].cvId);
              }
              setUseExistingCv(true);
            } else {
              setUseExistingCv(false);
            }
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
          setUseExistingCv(false);
        } finally {
          setFetchingProfile(false);
        }
      };

      fetchProfile();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!useExistingCv && !file) {
      toast.error("Vui lòng tải lên CV của bạn!");
      return;
    }

    if (useExistingCv && !selectedCvId) {
      toast.error("Vui lòng chọn một CV có sẵn!");
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append("jobPostingId", jobPostingId);
      data.append("fullName", formData.fullName);
      data.append("email", formData.email);
      data.append("phone", formData.phone);
      data.append("coverLetter", formData.coverLetter);

      if (useExistingCv) {
        data.append("cvId", selectedCvId);
      } else if (file) {
        data.append("file", file);
      }

      await api.post("/applications", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Ứng tuyển thành công!");
      setIsSuccess(true);
      if (onSuccess) onSuccess();
      // Don't close immediately, show success state
    } catch (error: any) {
      console.error("Apply error:", error);
      toast.error(error.response?.data?.message || "Đã có lỗi xảy ra khi ứng tuyển!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col">

        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-start">
          <h2 className="text-xl font-bold leading-tight pr-8">
            <span className="text-slate-900">Ứng tuyển </span>
            <span className="text-blue-600">{jobTitle} </span>
            <span className="text-slate-900 font-medium">tại </span>
            <span className="text-slate-900">{companyName}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {isSuccess ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-2">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900">Ứng tuyển thành công!</h3>
              <p className="text-slate-500 max-w-sm mx-auto">
                Hồ sơ của bạn đã được gửi đến <strong>{companyName}</strong>.
                Bạn có thể theo dõi trạng thái ứng tuyển trong danh sách việc làm của mình.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full pt-4">
              <Link
                href="/applied-jobs"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
              >
                <Briefcase className="w-4 h-4" /> Xem việc đã ứng tuyển
              </Link>
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <form id="apply-form" onSubmit={handleSubmit} className="space-y-6">

                {/* Section 1: Choose CV */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-700 font-bold">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <h3>Chọn CV để ứng tuyển</h3>
                    </div>
                    {userCVs.length > 0 && (
                      <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setUseExistingCv(true)}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${useExistingCv ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                        >
                          Dùng CV sẵn có
                        </button>
                        <button
                          type="button"
                          onClick={() => setUseExistingCv(false)}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${!useExistingCv ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                        >
                          Tải CV mới
                        </button>
                      </div>
                    )}
                  </div>

                  {/* CV Selection Box */}
                  <div className={`border-2 rounded-lg p-6 relative transition-all ${useExistingCv ? 'border-blue-600 bg-blue-50/30' : 'border-slate-200 bg-slate-50/30'}`}>

                    {useExistingCv ? (
                      <div className="space-y-4">
                        {fetchingProfile ? (
                          <div className="flex flex-col items-center py-4">
                            <div className="w-6 h-6 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-2" />
                            <p className="text-xs text-slate-400">Đang tải danh sách CV...</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-3">
                            {userCVs.map((cv) => (
                              <div
                                key={cv.cvId}
                                onClick={() => setSelectedCvId(cv.cvId)}
                                className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-between ${selectedCvId === cv.cvId ? 'border-blue-600 bg-white shadow-md' : 'border-slate-100 bg-white/50 hover:border-blue-200'}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center p-0.5 ${selectedCvId === cv.cvId ? 'border-blue-600' : 'border-slate-300'}`}>
                                    {selectedCvId === cv.cvId && <div className="w-full h-full bg-blue-600 rounded-full" />}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-800">{cv.cvTitle}</p>
                                    <p className="text-[10px] text-slate-400">Tải lên ngày {new Date(cv.createdAt).toLocaleDateString('vi-VN')}</p>
                                  </div>
                                </div>
                                {cv.isMain && (
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded-full">CV chính</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            {file ? file.name : "Tải lên CV từ máy tính, chọn hoặc kéo thả"}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">Hỗ trợ định dạng .doc, .docx, pdf có kích thước dưới 5MB</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept=".doc,.docx,.pdf"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-8 py-2 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
                        >
                          Chọn CV mới
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Personal Info Area */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center text-xs">
                      <p className="text-blue-600 font-bold">Thông tin cá nhân (NTD sẽ liên hệ qua đây):</p>
                      <p className="text-red-500 font-medium">(*) Thông tin bắt buộc.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Họ và tên <span className="text-red-500">*</span></label>
                      <input
                        required
                        type="text"
                        placeholder="Họ tên hiển thị với NTD"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded text-sm focus:border-blue-600 focus:ring-0 outline-none transition-all"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Email <span className="text-red-500">*</span></label>
                        <input
                          required
                          type="email"
                          placeholder="Email hiển thị với NTD"
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded text-sm focus:border-blue-600 focus:ring-0 outline-none transition-all"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Số điện thoại <span className="text-red-500">*</span></label>
                        <input
                          required
                          type="tel"
                          placeholder="Số điện thoại hiển thị với NTD"
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded text-sm focus:border-blue-600 focus:ring-0 outline-none transition-all"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>



                {/* Section 3: Cover Letter */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <Leaf className="w-5 h-5 text-blue-600" />
                    <h3>Thư giới thiệu:</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-2 leading-relaxed">Một thư giới thiệu ngắn gọn, chỉn chu sẽ giúp bạn trở nên chuyên nghiệp và gây ấn tượng hơn với nhà tuyển dụng.</p>
                  <div className="relative group">
                    <textarea
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-md text-sm min-h-[120px] focus:border-blue-600 focus:ring-0 outline-none transition-all"
                      placeholder="Viết giới thiệu ngắn gọn về bản thân (điểm mạnh, điểm yếu) và nêu rõ mong muốn, lý do bạn muốn ứng tuyển cho vị trí này."
                      value={formData.coverLetter}
                      onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                    />
                    <div className="absolute right-3 bottom-3 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white scale-0 group-focus-within:scale-100 transition-transform cursor-pointer shadow-lg">
                      <Pencil className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Agreement */}
                <div className="flex items-start gap-3 py-2">
                  <input
                    required
                    type="checkbox"
                    id="agree"
                    className="w-5 h-5 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={formData.agree}
                    onChange={(e) => setFormData({ ...formData, agree: e.target.checked })}
                  />
                  <label htmlFor="agree" className="text-sm text-slate-600 leading-normal cursor-pointer select-none">
                    Tôi đã đọc và đồng ý với <Link href="#" className="text-blue-600 font-bold">"Thoả thuận sử dụng dữ liệu cá nhân"</Link> của Nhà tuyển dụng
                  </label>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-md hover:bg-slate-200 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                form="apply-form"
                disabled={loading}
                className={`flex-[2] px-6 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? "Đang nộp hồ sơ..." : "Nộp hồ sơ ứng tuyển"}
              </button>
            </div>
          </>)}
      </div>
    </div>
  );
}
