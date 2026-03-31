'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building, Save, Loader2, MapPin, Globe, Users, FileText } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth';

const defaultForm = {
  companyName: '',
  taxCode: '',
  address: '',
  websiteUrl: '',
  companySize: 0,
  description: '',
  logo: '',
  banner: '',
};

export default function CompanyProfilePage() {
  const [formData, setFormData] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { accessToken } = useAuthStore();

  useEffect(() => {
    fetchCompany();
  }, [accessToken]);

  const fetchCompany = async () => {
    if (!accessToken) return;
    try {
      const { data } = await api.get('/companies/my-company');
      setFormData({
        companyName: data.companyName || '',
        taxCode: data.taxCode || '',
        address: data.address || '',
        websiteUrl: data.websiteUrl || '',
        companySize: data.companySize || 0,
        description: data.description || '',
        logo: data.logo || '',
        banner: data.banner || '',
      });
    } catch (error) {
      console.error('Error fetching company:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'companySize' ? Number(value) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setSaving(true);
    
    // Clean up empty strings to null to avoid unique constraint violations
    const payload = { ...formData };
    (Object.keys(payload) as Array<keyof typeof payload>).forEach(key => {
      if (payload[key] === '' && key !== 'companyName') (payload as any)[key] = null;
    });
    if (payload.companySize === 0) (payload as any).companySize = null;

    try {
      await api.patch('/companies/my-company', payload);
      toast.success('Đã cập nhật thông tin thành công!');
    } catch (error) {
      console.error('Error updating company:', error);
      toast.error('Có lỗi xảy ra khi cập nhật!');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="border-b border-indigo-100 pb-5">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
          <Building className="h-8 w-8 text-indigo-600" />
          Hồ Sơ Doanh Nghiệp
        </h1>
        <p className="text-slate-500 mt-2 text-lg">Cập nhật thông tin chi tiết để ứng viên hiểu rõ hơn về công ty của bạn.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {formData.banner ? (
          <div className="h-48 w-full bg-cover bg-center" style={{ backgroundImage: `url(${formData.banner})` }}></div>
        ) : (
          <div className="h-48 w-full bg-gradient-to-r from-indigo-500 to-purple-500"></div>
        )}

        <div className="p-8 relative">
          <div className={`absolute -top-16 left-8 h-24 w-24 rounded-2xl border-4 border-white shadow-xl flex items-center justify-center font-bold text-2xl ${formData.logo ? 'bg-white' : 'bg-slate-800 text-white'}`}>
            {formData.logo ? <img src={formData.logo} className="w-full h-full object-contain rounded-xl" /> : formData.companyName.charAt(0)}
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-400" /> Tên Công Ty
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200"
                  placeholder="Ví dụ: Công ty TNHH HKT"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" /> Mã Số Thuế
                </label>
                <input
                  type="text"
                  name="taxCode"
                  value={formData.taxCode}
                  onChange={handleChange}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200"
                  placeholder="Nhập mã số thuế"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" /> Địa Chỉ Vị Trí
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200"
                  placeholder="Địa chỉ trụ sở"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-400" /> Website URL
                </label>
                <input
                  type="url"
                  name="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={handleChange}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200"
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" /> Quy Mô Nhân Sự
                </label>
                <input
                  type="number"
                  name="companySize"
                  value={formData.companySize}
                  onChange={handleChange}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200"
                  placeholder="Số lượng nhân viên"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Mô Tả Doanh Nghiệp</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 resize-none"
                placeholder="Giới thiệu về tầm nhìn, sứ mệnh, môi trường làm việc..."
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={saving}
                className="h-11 px-6 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/20 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-70"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {saving ? 'Đang Lưu...' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
