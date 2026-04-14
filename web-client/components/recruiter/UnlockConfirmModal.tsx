import { Unlock, Wallet, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface UnlockConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isUnlocking: boolean;
  candidateName: string;
  wallet: any;
  subscription: any;
}

export const UnlockConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  isUnlocking,
  candidateName,
  wallet,
  subscription
}: UnlockConfirmModalProps) => {
  const router = useRouter();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
        >
           ✕
        </button>
        <div className="p-8">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex flex-col items-center justify-center mx-auto mb-4 text-indigo-600">
            <Unlock className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Mở khóa liên hệ ứng viên</h3>
          <p className="text-slate-500 text-center mb-6 text-sm">
            Xác nhận xem đầy đủ CV và thông tin liên hệ của ứng viên <strong className="text-slate-700">{candidateName}</strong>.
          </p>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6 space-y-3">
            {wallet?.cvUnlockQuota > 0 ? (
              <>
                 <div className="flex justify-between items-center text-sm font-medium">
                   <span className="text-slate-600">Gói CV Hunter</span>
                   <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Còn {wallet.cvUnlockQuota} lượt</span>
                 </div>
                 <div className="flex justify-between items-center text-sm font-medium border-t border-slate-200 pt-3">
                   <span className="text-slate-600">Phí mở khóa lần này</span>
                   <span className="text-emerald-600 font-bold">0 Xu</span>
                 </div>
              </>
            ) : (
              <>
                 <div className="flex justify-between items-center text-sm font-medium mb-3">
                   <span className="text-slate-600 flex items-center gap-1.5"><Wallet className="w-4 h-4 text-indigo-500" /> Số dư ví</span>
                   <span className="text-slate-800 font-bold">{wallet?.balance || 0} Xu</span>
                 </div>
                 <div className="flex justify-between items-center text-sm font-medium">
                   <span className="text-slate-600 line-through">Lượt mở miễn phí</span>
                   <span className="text-rose-500 font-bold">Hết lượt</span>
                 </div>
                 <div className="flex justify-between items-center text-sm font-medium border-t border-slate-200 pt-3">
                   <span className="text-slate-600">Giá mở khóa tiêu chuẩn</span>
                   <span className="text-indigo-600 font-bold">
                     {subscription && new Date() <= new Date(subscription.expiryDate) ? '30 Xu (Giá ưu đãi TV)' : '50 Xu'}
                   </span>
                 </div>
              </>
            )}
          </div>

          {(!wallet?.cvUnlockQuota || wallet.cvUnlockQuota === 0) && (wallet?.balance || 0) < (subscription && new Date() <= new Date(subscription.expiryDate) ? 30 : 50) ? (
             <div className="space-y-3">
               <p className="text-sm text-rose-500 font-medium text-center mb-4">Số dư ví không đủ để thực hiện giao dịch này.</p>
               <button 
                 onClick={() => router.push('/recruiter/wallet')}
                 className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all cursor-pointer"
               >
                 Nạp thêm Xu ngay
               </button>
             </div>
          ) : (
             <button 
               onClick={onConfirm}
               disabled={isUnlocking}
               className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-70"
             >
               {isUnlocking ? (
                 <Loader2 className="w-5 h-5 animate-spin" />
               ) : (
                 <Unlock className="w-5 h-5" />
               )}
               Xác nhận Mở Khóa
             </button>
          )}
          
          <div className="mt-4 text-center">
             <Link href="/recruiter/cv-hunter" className="text-sm text-indigo-600 font-medium hover:underline flex items-center justify-center gap-1">
               <Sparkles className="w-4 h-4"/> 
               Tìm hiểu gói CV Hunter tiết kiệm chi phí
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
