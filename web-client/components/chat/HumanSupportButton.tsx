import React from 'react';
import { motion } from 'framer-motion';
import { HeadphonesIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HumanSupportButton() {
  const handleConnect = () => {
    toast.success('Đã gửi yêu cầu hỗ trợ. Tư vấn viên sẽ liên hệ với bạn sớm nhất!');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-orange-50 border border-orange-200 rounded-xl p-3 my-2 shadow-sm w-full max-w-sm flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
          <HeadphonesIcon className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-orange-800">Cần hỗ trợ trực tiếp?</h4>
          <p className="text-xs text-orange-700 mt-0.5">Kết nối với chuyên viên tư vấn.</p>
        </div>
      </div>
      <button 
        onClick={handleConnect}
        className="text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
      >
        Kết nối ngay
      </button>
    </motion.div>
  );
}
