"use client";

import React from "react";
import { Bell, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-[#f4f7f6] pt-32 pb-12 font-sans">
      <div className="max-w-3xl mx-auto px-4 lg:px-6 text-center space-y-8">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600 shadow-inner">
          <Bell className="w-12 h-12" />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-slate-900 border-b-2 border-blue-600 inline-block pb-2">Thông báo</h1>
          <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
            Bạn hiện chưa có thông báo mới nào. Chúng tôi sẽ cập nhật cho bạn khi có tin tuyển dụng phù hợp hoặc thay đổi trạng thái hồ sơ.
          </p>
        </div>

        <div className="pt-8">
          <Link 
            href="/jobs" 
            className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
            Quay lại tìm việc
          </Link>
        </div>
      </div>
    </div>
  );
}
