'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence } from 'framer-motion';
import { Building, Loader2, Settings, Heart, Eye, Users } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth';

// Types
interface CompanyData {
  companyId: string;
  companyName: string;
  taxCode: string;
  address: string;
  websiteUrl: string;
  companySize: number;
  description: string;
  logo: string;
  banner: string;
  verifyStatus: number;
  branches: any[];
  sections: any[];
  benefits: any[];
  history: any[];
  mainIndustry: string;
}

interface Completeness {
  total: number;
  breakdown: Record<string, boolean>;
}

// Dynamic Imports
const EditTab = dynamic(() => import('./tabs/EditTab'), { 
  loading: () => <TabLoader /> 
});
const CultureTab = dynamic(() => import('./tabs/CultureTab'), { 
  loading: () => <TabLoader /> 
});
const MembersTab = dynamic(() => import('./tabs/MembersTab'), { 
  loading: () => <TabLoader /> 
});
const PreviewTab = dynamic(() => import('./tabs/PreviewTab'), { 
  loading: () => <TabLoader /> 
});

const TabLoader = () => (
  <div className="h-96 flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-mariner" />
  </div>
);

const DEFAULT_FORM: CompanyData = {
  companyId: '',
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
  sections: [],
  benefits: [],
  history: [],
  mainIndustry: '',
};

type TabType = 'edit' | 'culture' | 'members' | 'preview';

export default function CompanyProfilePage() {
  const [formData, setFormData] = useState<CompanyData>(DEFAULT_FORM);
  const [initialData, setInitialData] = useState<CompanyData>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('edit');
  const [completeness, setCompleteness] = useState<Completeness>({ total: 0, breakdown: {} });
  
  const { accessToken } = useAuthStore();

  const fetchCompany = useCallback(async () => {
    if (!accessToken) return;
    try {
      const { data } = await api.get('/companies/my-company');
      const fetchedData: CompanyData = {
        companyId: data.companyId || '',
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
        sections: data.sections || [],
        benefits: data.benefits || [],
        history: data.history || [],
        mainIndustry: data.mainIndustry || '',
      };
      setFormData(fetchedData);
      setInitialData(fetchedData);
      if (data.completeness) setCompleteness(data.completeness);
    } catch (error) {
      console.error('Fetch company error:', error);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

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
      // Primary: Esgoo
      const res = await fetch(`https://esgoo.net/api-mst/${formData.taxCode}.htm`);
      const apiData = await res.json();
      
      if (apiData.error === 0 && apiData.data) {
        const d = apiData.data;
        toast.success('Đã tự động điền thông tin doanh nghiệp!');
        setFormData(prev => ({
          ...prev,
          companyName: d.name || d.title || prev.companyName,
          address: d.address || prev.address,
          mainIndustry: d.nganh_nghe || d.industry || prev.mainIndustry,
          companySize: d.employees || d.size || prev.companySize,
          verifyStatus: 1
        }));
        return;
      }

      // Fallback: VietQR
      const resV = await fetch(`https://api.vietqr.io/v2/business/${formData.taxCode}`);
      const dataV = await resV.json();
      if (dataV.code === '00' && dataV.data) {
        toast.success('Đã tự động điền thông tin cơ bản!');
        setFormData(prev => ({
          ...prev,
          companyName: dataV.data.name,
          address: dataV.data.address || prev.address,
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
    
    // Clean payload: remove branches and handle empty strings
    const payload = { ...formData };
    delete (payload as any).branches;
    
    Object.keys(payload).forEach(key => {
      const k = key as keyof Omit<CompanyData, 'branches'>;
      if (payload[k] === '' && k !== 'companyName') (payload as any)[k] = null;
    });
    if (payload.companySize === 0) payload.companySize = null as any;

    try {
      await api.patch('/companies/my-company', payload);
      toast.success('Cập nhật thông tin thành công!');
      fetchCompany();
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật!');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const label = type === 'logo' ? 'Logo' : 'ảnh bìa';
    const toastId = toast.loading(`Đang cập nhật ${label}...`);

    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.patch(`/companies/my-company/${type}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData(prev => ({ ...prev, [type]: data.url }));
      toast.success(`Cập nhật ${label} thành công!`, { id: toastId });
      fetchCompany();
    } catch (error) {
      toast.error(`Cập nhật ${label} thất bại`, { id: toastId });
    } finally {
      e.target.value = '';
    }
  };

  if (loading) return <PageLoader />;

  const isChanged = JSON.stringify(formData) !== JSON.stringify(initialData);

  return (
    <div className="max-w-6xl mx-auto space-y-8 px-4 pb-20">
      <HeaderSection activeTab={activeTab} setActiveTab={setActiveTab} />

      <AnimatePresence mode="wait">
        {activeTab === 'edit' && (
          <EditTab 
            formData={formData}
            completeness={completeness}
            handleChange={handleChange}
            handleVerifyTaxCode={handleVerifyTaxCode}
            handleSubmit={handleSubmit}
            handleUploadLogo={(e) => handleFileUpload(e, 'logo')}
            handleUploadBanner={(e) => handleFileUpload(e, 'banner')}
            fetchCompany={fetchCompany}
            verifying={verifying}
            saving={saving}
            isChanged={isChanged}
          />
        )}
        {activeTab === 'culture' && (
          <CultureTab 
            company={formData as any} 
            onUpdate={fetchCompany} 
          />
        )}
        {activeTab === 'members' && <MembersTab />}
        {activeTab === 'preview' && <PreviewTab formData={formData} />}
      </AnimatePresence>
    </div>
  );
}

// Sub-components for cleaner structure
const PageLoader = () => (
  <div className="flex h-[60vh] items-center justify-center">
    <div className="relative">
      <div className="h-24 w-24 rounded-full border-t-4 border-b-4 border-mariner animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Building className="h-8 w-8 text-mariner animate-pulse" />
      </div>
    </div>
  </div>
);

const HeaderSection = ({ activeTab, setActiveTab }: { activeTab: TabType, setActiveTab: (t: TabType) => void }) => (
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
    <div>
      <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
        <div className="p-3 bg-workly-gradient rounded-2xl shadow-lg shadow-blue-900/20">
          <Building className="h-8 w-8 text-white" />
        </div>
        Hồ Sơ Doanh Nghiệp
      </h1>
      <p className="text-slate-500 mt-2 text-lg font-medium">Nâng tầm thương hiệu tuyển dụng của bạn trên Workly.</p>
    </div>

    <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200 overflow-x-auto">
      <TabButton active={activeTab === 'edit'} onClick={() => setActiveTab('edit')} icon={<Settings className="w-4 h-4" />}>Chỉnh sửa</TabButton>
      <TabButton active={activeTab === 'culture'} onClick={() => setActiveTab('culture')} icon={<Heart className="w-4 h-4" />}>Văn hóa</TabButton>
      <TabButton active={activeTab === 'members'} onClick={() => setActiveTab('members')} icon={<Users className="w-4 h-4" />}>Thành viên</TabButton>
      <TabButton 
        active={activeTab === 'preview'} 
        onClick={() => setActiveTab('preview')} 
        icon={<Eye className="w-4 h-4" />}
        variant="primary"
      >
        Preview
      </TabButton>
    </div>
  </div>
);

const TabButton = ({ active, onClick, icon, children, variant = 'default' }: any) => {
  const activeClass = variant === 'primary' 
    ? 'bg-workly-gradient text-white shadow-lg shadow-blue-900/20' 
    : 'bg-white text-mariner shadow-md';
  
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${active ? activeClass : 'text-slate-500 hover:text-slate-700'}`}
    >
      {icon} {children}
    </button>
  );
};
