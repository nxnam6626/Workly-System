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
  AlertCircle 
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";

interface JobApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  companyName: string;
  jobPostingId: string;
  onSuccess?: () => void;
}

export function JobApplyModal({ isOpen, onClose, jobTitle, companyName, jobPostingId, onSuccess }: JobApplyModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    coverLetter: "",
    agree: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Vui lòng tải lên CV của bạn!");
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append("jobPostingId", jobPostingId);
      data.append("fullName", formData.fullName);
      data.append("email", formData.email);
      data.append("phone", formData.phone);
      data.append("location", formData.location);
      data.append("coverLetter", formData.coverLetter);
      data.append("file", file);

      await axios.post("http://localhost:3001/applications", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <form id="apply-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Section 1: Choose CV */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-700 font-bold">
                 <FileText className="w-5 h-5 text-blue-600" />
                 <h3>Chọn CV để ứng tuyển</h3>
              </div>

              {/* CV Selection Box */}
              <div className="border-2 border-blue-600 rounded-lg p-6 bg-blue-50/30 relative">
                 <div className="absolute top-6 left-6">
                    <div className="w-5 h-5 rounded-full border-2 border-blue-600 flex items-center justify-center p-1">
                       <div className="w-full h-full bg-blue-600 rounded-full" />
                    </div>
                 </div>

                 <div className="pl-10 space-y-6">
                    {/* Upload UI */}
                    <div className="flex flex-col items-center text-center space-y-3">
                       <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
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
                         className="px-8 py-2 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700 transition-colors"
                       >
                          Chọn CV
                       </button>
                    </div>

                    {/* Inputs Area */}
                    <div className="space-y-4 pt-4 border-t border-blue-100">
                       <div className="flex justify-between items-center text-xs">
                          <p className="text-blue-600 font-bold">Vui lòng nhập đầy đủ thông tin chi tiết:</p>
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
                            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
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
                               onChange={(e) => setFormData({...formData, email: e.target.value})}
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
                               onChange={(e) => setFormData({...formData, phone: e.target.value})}
                             />
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            </div>

            {/* Section 2: Preferred Location */}
            <div className="space-y-2">
               <label className="text-sm font-bold text-slate-900">Địa điểm làm việc mong muốn <span className="text-red-500">*</span></label>
               <div className="relative">
                  <select 
                    required
                    className="w-full appearance-none px-4 py-3 bg-white border border-slate-200 rounded-md text-sm text-slate-500 focus:border-blue-600 focus:ring-0 outline-none transition-all pr-10 cursor-pointer"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  >
                     <option value="">Chọn địa điểm bạn muốn làm việc</option>
                     <option value="HN">Hà Nội</option>
                     <option value="HCM">Hồ Chí Minh</option>
                     <option value="DN">Đà Nẵng</option>
                  </select>
                  <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                    onChange={(e) => setFormData({...formData, coverLetter: e.target.value})}
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
                 onChange={(e) => setFormData({...formData, agree: e.target.checked})}
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

      </div>
    </div>
  );
}
