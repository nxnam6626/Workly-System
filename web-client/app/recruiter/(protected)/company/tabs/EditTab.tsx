'use client';

import { motion } from 'framer-motion';
import {
  Building, Save, Loader2, MapPin, Globe, Users, FileText,
  Camera, Settings, AlertCircle, CheckCircle, Briefcase
} from 'lucide-react';
import CompanyBranches from '../CompanyBranches';

interface EditTabProps {
  formData: any;
  completeness: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleVerifyTaxCode: () => Promise<void>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleUploadLogo: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleUploadBanner: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  fetchCompany: () => Promise<void>;
  verifying: boolean;
  saving: boolean;
  isChanged: boolean;
}

export default function EditTab({
  formData,
  completeness,
  handleChange,
  handleVerifyTaxCode,
  handleSubmit,
  handleUploadLogo,
  handleUploadBanner,
  fetchCompany,
  verifying,
  saving,
  isChanged
}: EditTabProps) {
  return (
    <motion.div
      key="edit"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-8"
    >
      {/* Left: Banner & Logo Preview */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden group">
          <div className="relative h-40 w-full bg-slate-100">
            {formData.banner ? (
              <img src={formData.banner} className="h-full w-full object-cover" alt="Banner" />
            ) : (
              <div className="h-full w-full bg-workly-gradient opacity-80"></div>
            )}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <label className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white cursor-pointer hover:bg-white/30 transition-all">
                <Camera className="w-6 h-6" />
                <input type="file" accept="image/*" onChange={handleUploadBanner} className="hidden" />
              </label>
            </div>
          </div>

          <div className="px-8 pb-8 -mt-12 relative flex flex-col items-center">
            <div className="relative h-24 w-24 rounded-[1.5rem] bg-white p-1 shadow-2xl border border-slate-50 group/logo">
              {formData.logo ? (
                <img src={formData.logo} className="h-full w-full object-contain rounded-[1.2rem]" alt="Logo" />
              ) : (
                <div className="h-full w-full bg-slate-800 rounded-[1.2rem] flex items-center justify-center text-white text-3xl font-bold">
                  {formData.companyName.charAt(0) || 'C'}
                </div>
              )}
              <label className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center rounded-[1.2rem] cursor-pointer">
                <Camera className="w-6 h-6 text-white" />
                <input type="file" accept="image/*" onChange={handleUploadLogo} className="hidden" />
              </label>
            </div>

            <div className="mt-4 text-center">
              <h3 className="text-xl font-bold text-slate-800">{formData.companyName || 'Tên Công Ty'}</h3>
              <p className="text-slate-400 text-sm mt-1">{formData.taxCode || 'MST chưa cập nhật'}</p>
            </div>

            <div className="mt-6 w-full space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Độ hoàn thiện</span>
                <span className="text-sm font-extrabold text-mariner">{completeness.total}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completeness.total}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-workly-gradient rounded-full shadow-[0_0_8px_rgba(36,102,201,0.4)]"
                ></motion.div>
              </div>

              {/* Breakdown Checklist */}
              <div className="pt-2 grid grid-cols-1 gap-2">
                {Object.entries({
                  companyName: 'Tên công ty',
                  taxCode: 'Mã số thuế',
                  logo: 'Logo',
                  banner: 'Ảnh bìa',
                  address: 'Địa chỉ',
                  description: 'Mô tả (>50 ký tự)',
                  websiteUrl: 'Website',
                  companySize: 'Quy mô',
                  mainIndustry: 'Ngành nghề',
                  workLocations: 'Địa điểm làm việc'
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tight">
                    <div className={`w-3 h-3 rounded-full flex items-center justify-center ${completeness.breakdown[key] ? 'bg-green-500' : 'bg-slate-200'}`}>
                      {completeness.breakdown[key] && <CheckCircle className="w-2 h-2 text-white" />}
                    </div>
                    <span className={completeness.breakdown[key] ? 'text-slate-600' : 'text-slate-300'}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 glass-morphism rounded-[2rem] border-white/50">
          <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-mariner" /> Mẹo nhỏ
          </h4>
          <p className="text-sm text-slate-600 leading-relaxed">
            Một hồ sơ có đầy đủ <strong>Ảnh bìa</strong> và <strong>Logo</strong> rõ nét sẽ tăng 40% tỷ lệ ứng viên click vào xem tin tuyển dụng của bạn.
          </p>
        </div>
      </div>

      {/* Right: Main Form */}
      <div className="lg:col-span-2 space-y-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-8 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-600 ml-1">Tên Công Ty</label>
              <div className="relative group">
                <Building className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-mariner transition-colors" />
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  readOnly
                  className="w-full h-12 pl-12 pr-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 font-semibold cursor-not-allowed outline-none"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-600 ml-1">Mã Số Thuế</label>
              <div className="flex gap-2">
                <div className="relative group flex-1">
                  <FileText className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-mariner transition-colors" />
                  <input
                    type="text"
                    name="taxCode"
                    value={formData.taxCode}
                    onChange={handleChange}
                    className="w-full h-12 pl-12 pr-4 rounded-2xl border border-slate-200 focus:border-mariner focus:ring-4 focus:ring-mariner/5 outline-none transition-all font-semibold"
                    placeholder="Nhập MST..."
                  />
                </div>
                <button
                  type="button"
                  onClick={handleVerifyTaxCode}
                  disabled={verifying || !formData.taxCode}
                  className="h-12 px-6 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-700 transition-all disabled:opacity-50 active:scale-95 flex items-center gap-2 shadow-lg shadow-slate-800/20"
                >
                  {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Tra cứu'}
                </button>
              </div>
            </div>

            <div className="md:col-span-2 space-y-3">
              <label className="text-sm font-bold text-slate-600 ml-1">Địa Chỉ Trụ Sở</label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-mariner transition-colors" />
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  readOnly
                  className="w-full h-12 pl-12 pr-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 font-semibold cursor-not-allowed outline-none"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-600 ml-1">Website URL</label>
              <div className="relative group">
                <Globe className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-mariner transition-colors" />
                <input
                  type="url"
                  name="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={handleChange}
                  className="w-full h-12 pl-12 pr-4 rounded-2xl border border-slate-200 focus:border-mariner focus:ring-4 focus:ring-mariner/5 outline-none transition-all font-semibold"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-600 ml-1">Quy mô nhân sự</label>
              <div className="relative group">
                <Users className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-mariner transition-colors" />
                <input
                  type="number"
                  name="companySize"
                  value={formData.companySize || ''}
                  onChange={handleChange}
                  className="w-full h-12 pl-12 pr-4 rounded-2xl border border-slate-200 focus:border-mariner focus:ring-4 focus:ring-mariner/5 outline-none transition-all font-semibold"
                  placeholder="VD: 1000"
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-3">
              <label className="text-sm font-bold text-slate-600 ml-1">Lĩnh vực hoạt động (Ngành nghề)</label>
              <div className="relative group">
                <Briefcase className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-mariner transition-colors" />
                <input
                  type="text"
                  name="mainIndustry"
                  value={formData.mainIndustry}
                  onChange={handleChange}
                  className="w-full h-12 pl-12 pr-4 rounded-2xl border border-slate-200 focus:border-mariner focus:ring-4 focus:ring-mariner/5 outline-none transition-all font-semibold"
                  placeholder="VD: Công nghệ thông tin, Tài chính, Marketing..."
                />
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <label className="text-sm font-bold text-slate-600 ml-1">Mô Tả Doanh Nghiệp</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={6}
              className="w-full p-5 rounded-2xl border border-slate-200 focus:border-mariner focus:ring-4 focus:ring-mariner/5 outline-none transition-all font-medium leading-relaxed resize-none"
              placeholder="Giới thiệu về sứ mệnh, tầm nhìn, và điều làm nên sự khác biệt của công ty bạn..."
            />
          </div>

          <div className="flex justify-end mt-10">
            <button
              type="submit"
              disabled={saving || !isChanged}
              className="h-14 px-10 rounded-2xl bg-workly-gradient text-white font-extrabold text-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-3 disabled:opacity-50 disabled:grayscale disabled:scale-100 shadow-xl shadow-blue-900/30"
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
              {saving ? 'Đang lưu...' : 'Cập nhật ngay'}
            </button>
          </div>
        </form>

        {/* Work Locations Section */}
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-8">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-mariner" /> Địa điểm làm việc
          </h3>
          <CompanyBranches initialBranches={formData.branches} onUpdate={fetchCompany} />
        </div>
      </div>
    </motion.div>
  );
}
