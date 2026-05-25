"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { profileApi } from "@/lib/profile-api";
import { useAuthStore } from "@/stores/auth";
import { CVReviewModal } from "../candidates/CVReviewModal";
import { CVSelection } from "./apply/CVSelection";
import { PersonalInfoForm } from "./apply/PersonalInfoForm";
import { CoverLetterForm } from "./apply/CoverLetterForm";
import { ApplySuccessState } from "./apply/ApplySuccessState";

interface UserCV {
  cvId: string;
  cvTitle: string;
  fileUrl: string;
  isMain: boolean;
  createdAt: string;
  parsedData?: any;
}

interface JobApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  companyName: string;
  jobPostingId: string;
  jobLocationCity?: string;
  onSuccess?: () => void;
}

export function JobApplyModal({ isOpen, onClose, jobTitle, companyName, jobPostingId, onSuccess }: JobApplyModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(false);
  const [userCVs, setUserCVs] = useState<UserCV[]>([]);
  const [useExistingCv, setUseExistingCv] = useState(true);
  const [selectedCvId, setSelectedCvId] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [candidateStatus, setCandidateStatus] = useState<{
    isOpenToWork: boolean;
    isExpired: boolean;
  } | null>(null);

  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    initialData: any;
    fileUrl: string;
    cvTitle: string;
  }>({
    isOpen: false,
    initialData: null,
    fileUrl: "",
    cvTitle: "",
  });

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    coverLetter: "",
    agree: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isOpen && isAuthenticated && user?.roles?.includes('CANDIDATE')) {
      fetchUserCVs();
    }
  }, [isOpen, isAuthenticated, user]);

  const fetchUserCVs = async () => {
    setFetchingProfile(true);
    try {
      const profile = await profileApi.getMe();
      if (profile.candidate) {
        const isExpired = profile.candidate.jobSearchExpiresAt 
          ? new Date(profile.candidate.jobSearchExpiresAt) < new Date() 
          : true;
        
        setCandidateStatus({
          isOpenToWork: profile.candidate.isOpenToWork,
          isExpired
        });
      }

      if (profile.candidate?.cvs) {
        setUserCVs(profile.candidate.cvs);
        
        const mainCv = profile.candidate.cvs.find(cv => cv.isMain);
        if (mainCv) {
          setSelectedCvId(mainCv.cvId);
          setUseExistingCv(true);
        } else if (profile.candidate.cvs.length > 0) {
          setSelectedCvId(profile.candidate.cvs[0].cvId);
          setUseExistingCv(true);
        } else {
          setUseExistingCv(false);
        }

        setFormData(prev => ({
          ...prev,
          fullName: profile.candidate?.fullName || prev.fullName,
          email: profile.email || prev.email,
          phone: profile.phoneNumber || prev.phone,
        }));
      } else {
        setUseExistingCv(false);
      }
    } catch (error) {
      console.error("Failed to fetch profile in modal:", error);
      setUseExistingCv(false);
    } finally {
      setFetchingProfile(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      setIsParsing(true);
      const toastId = toast.loading("Đang bóc tách dữ liệu CV bằng AI...");
      
      try {
        const data = new FormData();
        data.append("file", selectedFile);
        
        const response = await api.post("/candidates/cv/extract", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const { extractedData, fileUrl, cvTitle } = response.data;
        toast.success("Bóc tách thành công! Vui lòng kiểm tra lại thông tin.", { id: toastId });
        
        setReviewModal({
          isOpen: true,
          initialData: extractedData,
          fileUrl,
          cvTitle,
        });
      } catch (error: any) {
        toast.error("Không thể bóc tách CV. Bạn vẫn có thể nộp file thô.", { id: toastId });
        console.error("Parse error:", error);
      } finally {
        setIsParsing(false);
      }
    }
  };

  const handleReviewSuccess = (savedCv: any) => {
    setUserCVs(prev => [savedCv, ...prev]);
    setSelectedCvId(savedCv.cvId);
    setUseExistingCv(true);
    
    if (savedCv.parsedData) {
      setFormData(prev => ({
        ...prev,
        fullName: savedCv.parsedData.fullName || prev.fullName,
        email: savedCv.parsedData.email || prev.email,
        phone: savedCv.parsedData.phone || prev.phone,
      }));
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
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Ứng tuyển thành công!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Apply error:", error);
      toast.error(error.response?.data?.message || "Đã có lỗi xảy ra khi ứng tuyển!");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col">

        <div className="p-6 border-b border-slate-100 flex justify-between items-start">
          <h2 className="text-xl font-bold leading-tight pr-8">
            <span className="text-slate-900">Ứng tuyển </span>
            <span className="text-blue-600">{jobTitle} </span>
            <span className="text-slate-900 font-medium">tại </span>
            <span className="text-slate-900">{companyName}</span>
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        {isAuthenticated && !user?.roles?.includes('CANDIDATE') ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
             <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
                <AlertCircle className="w-8 h-8" />
             </div>
             <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Quyền truy cập bị hạn chế</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                   Tài khoản của bạn đang có vai trò **Nhà tuyển dụng / Admin**. Chỉ tài khoản **Ứng viên** mới có thể thực hiện ứng tuyển việc làm.
                </p>
             </div>
             <button onClick={onClose} className="px-8 py-2.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-all">
                Đã hiểu
             </button>
          </div>
        ) : candidateStatus && (!candidateStatus.isOpenToWork || candidateStatus.isExpired) ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
             <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                <AlertCircle className="w-8 h-8" />
             </div>
             <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Tính năng Tìm việc đang tắt</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                   Bạn cần bật trạng thái <strong>Đang tìm việc</strong> và đảm bảo tài khoản tìm việc chưa hết hạn để có thể ứng tuyển.
                </p>
             </div>
             <button onClick={onClose} className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                Đã hiểu
             </button>
          </div>
        ) : isSuccess ? (
          <ApplySuccessState companyName={companyName} onClose={onClose} />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <form id="apply-form" onSubmit={handleSubmit} className="space-y-6">
                <CVSelection 
                  userCVs={userCVs}
                  useExistingCv={useExistingCv}
                  setUseExistingCv={setUseExistingCv}
                  selectedCvId={selectedCvId}
                  setSelectedCvId={setSelectedCvId}
                  fetchingProfile={fetchingProfile}
                  isParsing={isParsing}
                  file={file}
                  fileInputRef={fileInputRef}
                  handleFileChange={handleFileChange}
                />
                <PersonalInfoForm 
                  formData={formData}
                  setFormData={setFormData}
                />
                <CoverLetterForm 
                  coverLetter={formData.coverLetter}
                  setCoverLetter={(val) => setFormData({ ...formData, coverLetter: val })}
                  agree={formData.agree}
                  setAgree={(val) => setFormData({ ...formData, agree: val })}
                />
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex gap-4">
              <button type="button" onClick={onClose} className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-md hover:bg-slate-200 transition-colors">
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

      <CVReviewModal
        isOpen={reviewModal.isOpen}
        onClose={() => setReviewModal(prev => ({ ...prev, isOpen: false }))}
        initialData={reviewModal.initialData}
        fileUrl={reviewModal.fileUrl}
        cvTitle={reviewModal.cvTitle}
        onSuccess={handleReviewSuccess}
      />
    </div>
  );
}
