'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building, Save, Loader2, MapPin, Globe, Users, FileText,
  CheckCircle, AlertCircle, Camera, Eye, Settings, Heart,
  Cpu, Image as ImageIcon, Plus, Trash2, ExternalLink, Briefcase
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth';
import CompanyBranches from './CompanyBranches';

const defaultForm = {
  companyName: '',
  taxCode: '',
  address: '',
  websiteUrl: '',
  companySize: 0,
  description: '',
  logo: '',
  banner: '',
  verifyStatus: 0,
  branches: [],
};

type TabType = 'edit' | 'culture' | 'preview';

export default function CompanyProfilePage() {
  const [formData, setFormData] = useState(defaultForm);
  const [initialData, setInitialData] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('edit');
  const { accessToken } = useAuthStore();

  useEffect(() => {
    fetchCompany();
  }, [accessToken]);

  const fetchCompany = async () => {
    if (!accessToken) return;
    try {
      const { data } = await api.get('/companies/my-company');
      const fetchedData = {
        companyName: data.companyName || '',
        taxCode: data.taxCode || '',
        address: data.address || '',
        websiteUrl: data.websiteUrl || '',
        companySize: data.companySize || 0,
        description: data.description || '',
        logo: data.logo || '',
        banner: data.banner || '',
        verifyStatus: data.verifyStatus || 0,
        branches: data.branches || [],
      };
      setFormData(fetchedData);
      setInitialData(fetchedData);
    } catch (error) {
      console.error('Error fetching company:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'companySize' ? Number(value) : value,
      ...(name === 'taxCode' || name === 'companyName' ? { verifyStatus: 0 } : {})
    }));
  };

  const handleVerifyTaxCode = async () => {
    if (!formData.taxCode) return;
    setVerifying(true);
    try {
      const res = await fetch(`https://api.vietqr.io/v2/business/${formData.taxCode}`);
      const data = await res.json();
      if (data.code === '00' && data.data) {
        toast.success(`Đã tự động điền Tên Công Ty & Địa chỉ!`);
        setFormData(prev => ({
          ...prev,
          companyName: data.data.name,
          address: data.data.address || prev.address,
          verifyStatus: 1
        }));
      } else {
        toast.error('Mã số thuế không tồn tại hoặc sai!');
        setFormData(prev => ({ ...prev, verifyStatus: -1 }));
      }
    } catch (e) {
      toast.error('Lỗi khi tra cứu mã số thuế');
      setFormData(prev => ({ ...prev, verifyStatus: -1 }));
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setSaving(true);
    const payload = { ...formData };
    delete (payload as any).branches;
    (Object.keys(payload) as Array<keyof typeof payload>).forEach(key => {
      if (payload[key] === '' && key !== 'companyName') (payload as any)[key] = null;
    });
    if (payload.companySize === 0) (payload as any).companySize = null;

    try {
      await api.patch('/companies/my-company', payload);
      setInitialData(formData);
      toast.success('Đã cập nhật thông tin thành công!');
    } catch (error) {
      console.error('Error updating company:', error);
      toast.error('Có lỗi xảy ra khi cập nhật!');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const toastId = toast.loading('Đang cập nhật Logo...');
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.patch('/companies/my-company/logo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData(prev => ({ ...prev, logo: data.url }));
      setInitialData(prev => ({ ...prev, logo: data.url }));
      toast.success('Cập nhật Logo thành công!', { id: toastId });
    } catch (error) {
      toast.error('Cập nhật Logo thất bại', { id: toastId });
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    const toastId = toast.loading('Đang cập nhật ảnh bìa...');
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.patch('/companies/my-company/banner', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData(prev => ({ ...prev, banner: data.url }));
      setInitialData(prev => ({ ...prev, banner: data.url }));
      toast.success('Cập nhật ảnh bìa thành công!', { id: toastId });
    } catch (error) {
      toast.error('Cập nhật ảnh bìa thất bại', { id: toastId });
    } finally {
      setUploadingBanner(false);
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="relative">
          <div className="h-24 w-24 rounded-full border-t-4 border-b-4 border-momo-pink animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Building className="h-8 w-8 text-momo-pink animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const isChanged = JSON.stringify(formData) !== JSON.stringify(initialData);

  return (
    <div className="max-w-6xl mx-auto space-y-8 px-4 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-3 bg-momo-gradient rounded-2xl shadow-lg shadow-momo-pink/20">
              <Building className="h-8 w-8 text-white" />
            </div>
            Hồ Sơ Doanh Nghiệp
          </h1>
          <p className="text-slate-500 mt-2 text-lg font-medium">Nâng tầm thương hiệu tuyển dụng của bạn trên Workly.</p>
        </div>

        <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'edit' ? 'bg-white text-momo-pink shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Settings className="w-4 h-4" /> Chỉnh sửa
          </button>
          <button
            onClick={() => setActiveTab('culture')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'culture' ? 'bg-white text-momo-pink shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Heart className="w-4 h-4" /> Văn hóa
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'preview' ? 'bg-momo-gradient text-white shadow-lg shadow-momo-pink/20' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Eye className="w-4 h-4" /> Preview
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'edit' && (
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
                    <img src={formData.banner} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-momo-gradient opacity-80"></div>
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
                      <img src={formData.logo} className="h-full w-full object-contain rounded-[1.2rem]" />
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
                      <span className="text-sm font-extrabold text-momo-pink">85%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-momo-gradient w-[85%] rounded-full shadow-[0_0_8px_rgba(216,45,139,0.4)]"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 glass-morphism rounded-[2rem] border-white/50">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-momo-pink" /> Mẹo nhỏ
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
                      <Building className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-momo-pink transition-colors" />
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
                        <FileText className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-momo-pink transition-colors" />
                        <input
                          type="text"
                          name="taxCode"
                          value={formData.taxCode}
                          onChange={handleChange}
                          className="w-full h-12 pl-12 pr-4 rounded-2xl border border-slate-200 focus:border-momo-pink focus:ring-4 focus:ring-momo-pink/5 outline-none transition-all font-semibold"
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
                      <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-momo-pink transition-colors" />
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
                      <Globe className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-momo-pink transition-colors" />
                      <input
                        type="url"
                        name="websiteUrl"
                        value={formData.websiteUrl}
                        onChange={handleChange}
                        className="w-full h-12 pl-12 pr-4 rounded-2xl border border-slate-200 focus:border-momo-pink focus:ring-4 focus:ring-momo-pink/5 outline-none transition-all font-semibold"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-600 ml-1">Quy mô nhân sự</label>
                    <div className="relative group">
                      <Users className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-momo-pink transition-colors" />
                      <input
                        type="number"
                        name="companySize"
                        value={formData.companySize || ''}
                        onChange={handleChange}
                        className="w-full h-12 pl-12 pr-4 rounded-2xl border border-slate-200 focus:border-momo-pink focus:ring-4 focus:ring-momo-pink/5 outline-none transition-all font-semibold"
                        placeholder="VD: 1000"
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
                    className="w-full p-5 rounded-2xl border border-slate-200 focus:border-momo-pink focus:ring-4 focus:ring-momo-pink/5 outline-none transition-all font-medium leading-relaxed resize-none"
                    placeholder="Giới thiệu về sứ mệnh, tầm nhìn, và điều làm nên sự khác biệt của công ty bạn..."
                  />
                </div>

                <div className="flex justify-end mt-10">
                  <button
                    type="submit"
                    disabled={saving || !isChanged}
                    className="h-14 px-10 rounded-2xl bg-momo-gradient text-white font-extrabold text-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-3 disabled:opacity-50 disabled:grayscale disabled:scale-100 shadow-xl shadow-momo-pink/30"
                  >
                    {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                    {saving ? 'Đang lưu...' : 'Cập nhật ngay'}
                  </button>
                </div>
              </form>

              {/* Branches Section integrated cleanly */}
              <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-8">
                <CompanyBranches initialBranches={formData.branches} onUpdate={fetchCompany} />
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'culture' && (
          <motion.div
            key="culture"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {/* Tech Stack Selection Placeholder */}
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 flex flex-col items-center text-center justify-center space-y-6">
              <div className="p-6 bg-blue-50 rounded-full">
                <Cpu className="w-12 h-12 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Technology Stack</h3>
                <p className="text-slate-500 mt-2">Khoe những công nghệ "xịn sò" mà team đang sử dụng để thu hút Tech Talent.</p>
              </div>
              <button className="px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                Thiết lập ngay
              </button>
            </div>

            {/* Benefits Placeholder */}
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 flex flex-col items-center text-center justify-center space-y-6">
              <div className="p-6 bg-pink-50 rounded-full">
                <Heart className="w-12 h-12 text-pink-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Chế độ đãi ngộ</h3>
                <p className="text-slate-500 mt-2">Bảo hiểm, Laptop, Teambuilding... Hãy liệt kê những phúc lợi tốt nhất của bạn.</p>
              </div>
              <button className="px-8 py-3 bg-pink-600 text-white font-bold rounded-2xl hover:bg-pink-700 transition-all shadow-lg shadow-pink-200">
                Thêm phúc lợi
              </button>
            </div>

            {/* Gallery Placeholder */}
            <div className="md:col-span-2 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-10 text-center space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                  <ImageIcon className="w-6 h-6 text-momo-pink" /> Thư viện ảnh văn hóa
                </h3>
                <button className="flex items-center gap-2 text-momo-pink font-bold hover:underline">
                  <Plus className="w-4 h-4" /> Tải ảnh lên
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="aspect-video bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'preview' && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative"
          >
            {/* Real Candidate-View Style Profile */}
            <div className="bg-slate-950 rounded-[3rem] overflow-hidden shadow-2xl shadow-black/40 border border-white/10 min-h-[800px]">
              {/* Banner Area */}
              <div className="relative h-72 bg-slate-900">
                {formData.banner ? (
                  <img src={formData.banner} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-momo-gradient opacity-40"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent"></div>
              </div>

              {/* Profile Content */}
              <div className="px-12 -mt-20 relative pb-20">
                <div className="flex flex-col md:flex-row md:items-end gap-8">
                  <div className="h-40 w-40 rounded-[2.5rem] bg-white p-2 shadow-2xl shadow-black/50 ring-4 ring-slate-950">
                    {formData.logo ? (
                      <img src={formData.logo} className="w-full h-full object-contain rounded-[2rem]" />
                    ) : (
                      <div className="w-full h-full bg-slate-800 rounded-[2rem] flex items-center justify-center text-white text-5xl font-bold">
                        {formData.companyName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <h2 className="text-4xl font-black text-white tracking-tight leading-none">{formData.companyName || 'MoMo Fintech'}</h2>
                    <div className="flex flex-wrap gap-4 mt-6 text-slate-300">
                      <span className="flex items-center gap-1.5 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-sm font-medium">
                        <MapPin className="w-4 h-4 text-momo-pink" /> {formData.address.split(',')[0] || 'TP. Hồ Chí Minh'}
                      </span>
                      <span className="flex items-center gap-1.5 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-sm font-medium">
                        <Users className="w-4 h-4 text-momo-pink" /> {formData.companySize || '1000+'} nhân sự
                      </span>
                      {formData.websiteUrl && (
                        <a href={formData.websiteUrl} target="_blank" className="flex items-center gap-1.5 bg-momo-pink/20 px-4 py-2 rounded-full border border-momo-pink/30 text-sm font-bold text-momo-pink hover:bg-momo-pink/30 transition-all">
                          <Globe className="w-4 h-4" /> Website <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-16">
                  <div className="lg:col-span-2 space-y-12">
                    <section>
                      <h4 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
                        <div className="w-1.5 h-8 bg-momo-pink rounded-full"></div> Giới thiệu doanh nghiệp
                      </h4>
                      <p className="text-slate-300 text-lg leading-relaxed whitespace-pre-wrap font-medium opacity-90">
                        {formData.description || 'Chưa có mô tả chi tiết từ doanh nghiệp.'}
                      </p>
                    </section>

                    <section className="p-8 glass-dark rounded-[2.5rem]">
                      <h4 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                        <Cpu className="w-6 h-6 text-momo-pink" /> Đội ngũ Công nghệ (Tech Stack)
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        {['Go', 'Java', 'Next.js', 'React', 'Kubernetes', 'AWS', 'Swift', 'Python'].map(tech => (
                          <div key={tech} className="px-5 py-2.5 bg-white/5 rounded-2xl border border-white/10 text-slate-300 font-bold hover:bg-white/10 transition-colors">
                            {tech}
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>

                  <div className="space-y-8">
                    <div className="p-8 glass-dark rounded-[2.5rem] border-momo-pink/20">
                      <h4 className="text-lg font-bold text-white mb-6">Phúc lợi hấp dẫn</h4>
                      <div className="space-y-4">
                        {[
                          { icon: Heart, label: 'Bảo hiểm PVI đặc biệt' },
                          { icon: Briefcase, label: 'Lương tháng 13, 14, 15' },
                          { icon: Cpu, label: 'Cấp Macbook Pro/Dell Precision' },
                          { icon: Users, label: 'Teambuilding 2 lần/năm' },
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                            <div className="p-2 bg-momo-pink/20 rounded-lg">
                              <item.icon className="w-4 h-4 text-momo-pink" />
                            </div>
                            <span className="text-slate-300 text-sm font-semibold">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-1 bg-gradient-to-br from-momo-pink to-purple-600 rounded-[2.5rem] shadow-lg shadow-momo-pink/20">
                      <div className="p-8 bg-slate-950 rounded-[2.4rem] text-center">
                        <h4 className="text-white font-bold mb-2">Đang tìm kiếm nhân tài?</h4>
                        <p className="text-slate-400 text-sm mb-6">Chúng tôi hiện đang có 12 vị trí mở tại MoMo.</p>
                        <button className="w-full py-4 bg-momo-gradient text-white font-black rounded-2xl shadow-xl shadow-momo-pink/40 hover:scale-[1.02] transition-all">
                          Xem 12 việc làm
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Label for Preview */}
            <div className="absolute top-8 right-8 px-6 py-2 bg-momo-pink text-white font-black rounded-full shadow-2xl animate-pulse">
              CANDIDATE VIEW
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
