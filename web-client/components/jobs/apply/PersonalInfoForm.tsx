import React from "react";

interface PersonalInfoFormProps {
  formData: {
    fullName: string;
    email: string;
    phone: string;
  };
  setFormData: (data: any) => void;
}

export const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({ formData, setFormData }) => {
  return (
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
  );
};
