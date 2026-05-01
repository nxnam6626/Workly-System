import React from "react";
import { CheckCircle2, Briefcase } from "lucide-react";
import Link from "next/link";

interface ApplySuccessStateProps {
  companyName: string;
  onClose: () => void;
}

export const ApplySuccessState: React.FC<ApplySuccessStateProps> = ({ companyName, onClose }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6 animate-in zoom-in-95 duration-300">
      <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-2">
        <CheckCircle2 className="w-12 h-12" />
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-slate-900">Ứng tuyển thành công!</h3>
        <p className="text-slate-500 max-w-sm mx-auto">
          Hồ sơ của bạn đã được gửi đến <strong>{companyName}</strong>.
          Bạn có thể theo dõi trạng thái ứng tuyển trong danh sách việc làm của mình.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full pt-4">
        <Link
          href="/profile/jobs/applied"
          onClick={onClose}
          className="flex-1 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
        >
          <Briefcase className="w-4 h-4" /> Xem việc đã ứng tuyển
        </Link>
        <button
          onClick={onClose}
          className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-all"
        >
          Đóng
        </button>
      </div>
    </div>
  );
};
