import { useState } from 'react';
import { MapPin, Plus, Trash2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useConfirm } from '@/components/ConfirmDialog';

import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('@/components/recruiter/MapPicker'), { ssr: false });

interface Branch {
  branchId: string;
  name: string;
  address: string;
  isVerified: boolean;
  latitude: number | null;
  longitude: number | null;
}

interface Props {
  initialBranches: Branch[];
  onUpdate: () => void;
}

export default function CompanyBranches({ initialBranches, onUpdate }: Props) {
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [isAdding, setIsAdding] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');
  const [newBranchLat, setNewBranchLat] = useState<number | null>(null);
  const [newBranchLng, setNewBranchLng] = useState<number | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const confirm = useConfirm();
  
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName || !newBranchAddress) {
      toast.error('Vui lòng nhập tên và địa chỉ chi nhánh');
      return;
    }
    
    setSubmitting(true);
    try {
      const { data } = await api.post('/companies/my-company/branches', {
        name: newBranchName,
        address: newBranchAddress,
        ...(newBranchLat !== null && newBranchLng !== null ? { latitude: newBranchLat, longitude: newBranchLng } : {})
      });
      setBranches([...branches, data]);
      setNewBranchName('');
      setNewBranchAddress('');
      setNewBranchLat(null);
      setNewBranchLng(null);
      setIsAdding(false);
      toast.success('Thêm chi nhánh thành công');
      onUpdate();
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi thêm chi nhánh');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (branchId: string) => {
    const ok = await confirm({
      title: 'Xoá chi nhánh',
      message: 'Bạn có chắc muốn xoá chi nhánh này? Hành động này không thể hoàn tác.',
      confirmText: 'Xoá',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/companies/my-company/branches/${branchId}`);
      setBranches(branches.filter(b => b.branchId !== branchId));
      toast.success('Đã xoá chi nhánh');
      onUpdate();
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi xoá chi nhánh');
    }
  };

  return (
    <div className="mt-8 pt-8 border-t border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-600" />
            Chi Nhánh / Địa Điểm Làm Việc
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý các địa điểm làm việc để ứng viên dễ dàng nhận diện và được cung cấp bản đồ hướng dẫn.
          </p>
        </div>
        {!isAdding && (
          <button 
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 h-10 px-4 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 font-semibold transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Thêm chi nhánh
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6 space-y-4 shadow-sm relative">
            <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold"
            >
                ✕
            </button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-sm font-semibold text-slate-700">Tên chi nhánh</label>
              <input 
                type="text" 
                value={newBranchName}
                onChange={e => setNewBranchName(e.target.value)}
                placeholder="VD: Trụ sở chính, Cơ sở 1..."
                className="mt-1 w-full h-10 px-3 bg-white rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                <span>Địa chỉ cụ thể (dành cho bản đồ)</span>
                {newBranchLat !== null && (
                  <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 rounded-md">Đã chọn toạ độ</span>
                )}
              </label>
              <div className="flex gap-2 mt-1">
                <input 
                  type="text" 
                  value={newBranchAddress}
                  onChange={e => setNewBranchAddress(e.target.value)}
                  placeholder="VD: 123 Đường Nam Kỳ Khởi Nghĩa, Quận 3..."
                  className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowMapPicker(true)}
                  className="px-3 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs whitespace-nowrap transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 inline mr-1" />
                  Bản đồ
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button 
              type="submit" 
              disabled={submitting}
              className="px-6 h-10 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Lưu chi nhánh
            </button>
          </div>
        </form>
      )}

      {showMapPicker && (
        <MapPicker 
          onClose={() => setShowMapPicker(false)}
          onSelect={(lat, lng) => {
            setNewBranchLat(lat);
            setNewBranchLng(lng);
            setShowMapPicker(false);
            toast.success('Đã lưu toạ độ từ bản đồ!');
          }}
        />
      )}

      {branches.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 border border-slate-100 border-dashed rounded-2xl">
          <p className="text-sm text-slate-500 mb-2">Chưa có chi nhánh nào được cấu hình</p>
          <button 
            type="button"
            onClick={() => setIsAdding(true)}
            className="text-indigo-600 text-sm font-semibold hover:underline"
          >
            Bấm vào đây để thêm
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map(branch => (
            <div key={branch.branchId} className="bg-white border flex flex-col justify-between border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow transition-shadow relative group">
              <div>
                <h4 className="font-bold text-slate-800 pr-8 line-clamp-1">{branch.name}</h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{branch.address}</p>
                <div className="mt-3 inline-block">
                    {branch.isVerified ? (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold tracking-wide uppercase">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Đã xác thực trên bản đồ
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 text-amber-600 text-[10px] font-bold tracking-wide uppercase" title="Không tìm thấy toạ độ dựa trên OpenStreetMap, vui lòng xem lại địa chỉ">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Địa chỉ chưa xác minh toạ độ bản đồ
                        </div>
                    )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(branch.branchId)}
                className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Xoá chi nhánh"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
