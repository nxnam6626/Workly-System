import React from 'react';
import { Briefcase, Crown, Lock, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface PostJobHeaderProps {
  editJobId?: string | null;
  userPlan: string;
  setAiModalOpen: (open: boolean) => void;
}

export const PostJobHeader = ({ editJobId, userPlan, setAiModalOpen }: PostJobHeaderProps) => {
  const router = useRouter();

  const handleAiButtonClick = () => {
    if (userPlan === 'FREE' || !userPlan) {
      toast('Vui lòng nâng cấp gói LITE hoặc GROWTH để sử dụng AI Viết JD.', { icon: '🔒' });
      router.push('/recruiter/wallet');
    } else {
      setAiModalOpen(true);
    }
  };

  return (
    <div className="border-b border-indigo-100 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
          <Briefcase className="h-8 w-8 text-indigo-600" />
          {editJobId ? 'Chỉnh Sửa Tin Tuyển Dụng' : 'Gửi Yêu Cầu Tuyển Dụng'}
          {userPlan && (
            <span className={`text-[10px] px-3 py-1 rounded-full border font-black uppercase tracking-widest ml-2 ${
              userPlan === 'GROWTH' ? 'bg-amber-500/10 text-amber-600 border-amber-200' :
              userPlan === 'LITE' ? 'bg-indigo-500/10 text-indigo-600 border-indigo-200' :
              'bg-slate-500/10 text-slate-600 border-slate-200'
            }`}>
              Gói {userPlan}
            </span>
          )}
        </h1>
        <p className="text-slate-500 mt-2 text-lg">
          {editJobId 
            ? 'Cập nhật lại thông tin tuyển dụng, chức danh và yêu cầu.' 
            : 'Điền thông tin chi tiết và gửi yêu cầu để Admin phê duyệt trước khi tin được hiển thị.'}
        </p>
      </div>

      {!editJobId && (
        <button
          onClick={handleAiButtonClick}
          className={`flex-shrink-0 whitespace-nowrap flex items-center gap-2 px-5 py-2.5 rounded-full font-bold transition-all hover:-translate-y-0.5 border ${
            userPlan === 'FREE' || !userPlan
              ? 'bg-white text-slate-400 border-slate-200 shadow-sm hover:border-indigo-300 hover:text-indigo-600'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/30'
          }`}
        >
          {userPlan === 'FREE' || !userPlan ? (
            <>
              <Lock className="w-4 h-4 text-slate-400" />
              <span className="text-sm">Mở khóa AI Viết JD</span>
            </>
          ) : (
            <>
              <Sparkles className={`w-5 h-5 ${userPlan === 'FREE' || !userPlan ? 'text-indigo-500' : 'text-purple-200'}`} />
              {userPlan === 'LITE' ? 'AI Gợi Ý Kỹ Năng' : 'AI Tối Ưu SEO & Conversion'}
            </>
          )}
        </button>
      )}
    </div>
  );
};
