"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldAlert, CheckCircle, AlertTriangle, Gavel, Scale, Lock } from "lucide-react";
import Link from "next/link";

export default function TermsAndPoliciesPage() {
  return (
    <div className="bg-slate-50">
      <main className="max-w-4xl mx-auto px-4 py-12 pt-24">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 space-y-4"
        >
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Scale className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Điều Khoản Sử Dụng & Tiêu Chí Vi Phạm
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Nhằm xây dựng môi trường tuyển dụng minh bạch, chuyên nghiệp và an toàn. Vui lòng đọc kỹ các quy định dưới đây trước khi tham gia nền tảng.
          </p>
        </motion.div>

        <div className="space-y-12">
          {/* Section 1: Đối với Ứng viên */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-200/60"
          >
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Tiêu Chí Vi Phạm Đối Với Ứng Viên</h2>
                <p className="text-slate-500 text-sm mt-1">Các hành vi bị cấm khi sử dụng nền tảng với vai trò người tìm việc.</p>
              </div>
            </div>

            <ul className="space-y-4">
              {[
                "Cung cấp thông tin sai sự thật trong Hồ sơ cá nhân (CV), bằng cấp, hoặc kinh nghiệm làm việc.",
                "Spam ứng tuyển: Ứng tuyển hàng loạt vào các vị trí không phù hợp một cách có chủ đích nhằm gây rối loạn.",
                "Sử dụng ngôn từ thiếu chuẩn mực, đe dọa, hoặc xúc phạm Nhà tuyển dụng trong quá trình nhắn tin/phỏng vấn.",
                "Cố ý tải lên các tệp tin chứa mã độc, nội dung đồi trụy hoặc vi phạm pháp luật thay cho CV.",
                "Chia sẻ thông tin nội bộ của công ty phỏng vấn khi chưa được phép."
              ].map((item, i) => (
                <li key={i} className="flex gap-3 text-slate-700 leading-relaxed">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-red-50 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.section>

          {/* Section 2: Đối với Nhà tuyển dụng */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-200/60"
          >
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Tiêu Chí Vi Phạm Đối Với Nhà Tuyển Dụng</h2>
                <p className="text-slate-500 text-sm mt-1">Các hành vi bị cấm khi đăng tin và tiếp cận ứng viên.</p>
              </div>
            </div>

            <ul className="space-y-4">
              {[
                "Đăng tin tuyển dụng ảo, sai sự thật hoặc mạo danh các tổ chức, doanh nghiệp khác.",
                "Thu phí ứng viên dưới bất kỳ hình thức nào (phí giữ chỗ, phí đồng phục, phí làm hồ sơ...).",
                "Phân biệt đối xử (giới tính, vùng miền, tôn giáo) trong nội dung tuyển dụng trái với quy định pháp luật.",
                "Sử dụng thông tin cá nhân của ứng viên (SĐT, Email) vào mục đích khác ngoài tuyển dụng (Quảng cáo, Spam, Bán dữ liệu).",
                "Đăng tải các công việc vi phạm pháp luật, đa cấp lừa đảo, hoặc các nội dung không lành mạnh."
              ].map((item, i) => (
                <li key={i} className="flex gap-3 text-slate-700 leading-relaxed">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-red-50 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.section>

          {/* Section 3: Hình thức xử lý */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-900 rounded-3xl p-8 md:p-10 shadow-xl overflow-hidden relative"
          >
            <div className="absolute -right-12 -top-12 opacity-10">
              <Gavel className="w-48 h-48 text-white" />
            </div>

            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-6">Quy Trình Xử Lý Vi Phạm</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <h3 className="text-xl font-bold text-amber-400 flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5" /> Mức 1: Cảnh Cáo
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Hệ thống hoặc Quản trị viên sẽ gửi thông báo cảnh cáo. Nội dung vi phạm có thể bị ẩn hoặc yêu cầu chỉnh sửa. Tài khoản vẫn có thể hoạt động nhưng sẽ bị giám sát nghiêm ngặt hơn.
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 border-red-500/30">
                  <h3 className="text-xl font-bold text-red-400 flex items-center gap-2 mb-3">
                    <Lock className="w-5 h-5" /> Mức 2: Khóa Vĩnh Viễn
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Nếu tiếp tục tái phạm hoặc vi phạm các quy định nghiêm trọng (như lừa đảo, thu phí trái phép, giả mạo), tài khoản sẽ bị khóa vĩnh viễn không cần báo trước.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>
        </div>

        <div className="mt-16 text-center text-slate-500 text-sm">
          <p>Nếu bạn có thắc mắc hoặc cần báo cáo vi phạm, vui lòng liên hệ bộ phận hỗ trợ: <a href="mailto:support@workly.com" className="text-blue-600 font-semibold hover:underline">support@workly.com</a></p>
        </div>
      </main>
    </div>
  );
}
