"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Database, Eye, Lock, FileKey, UserCheck } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-slate-50">
      <main className="max-w-4xl mx-auto px-4 py-12 pt-16">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 space-y-4"
        >
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Chính Sách Bảo Mật
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Sự riêng tư của bạn là ưu tiên hàng đầu của chúng tôi. Tại Workly, chúng tôi cam kết bảo vệ dữ liệu cá nhân của bạn một cách an toàn và minh bạch.
          </p>
        </motion.div>

        <div className="space-y-8">
          {/* Section 1 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-200/60 flex flex-col md:flex-row gap-8 items-start"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Database className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">1. Thu Thập Dữ Liệu</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Khi bạn sử dụng Workly, chúng tôi có thể thu thập các thông tin sau để cung cấp trải nghiệm tốt nhất:
              </p>
              <ul className="space-y-2 text-slate-600 list-disc list-inside">
                <li>Thông tin cá nhân (Họ tên, Email, Số điện thoại, Ngày sinh, Giới tính).</li>
                <li>Thông tin nghề nghiệp (CV, Kinh nghiệm, Kỹ năng, Bằng cấp, Mức lương hiện tại/mong muốn).</li>
                <li>Dữ liệu tương tác (Việc làm đã lưu, lịch sử ứng tuyển, các tìm kiếm đã thực hiện).</li>
              </ul>
            </div>
          </motion.section>

          {/* Section 2 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-200/60 flex flex-col md:flex-row gap-8 items-start"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-7 h-7 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">2. Mục Đích Sử Dụng</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Dữ liệu được thu thập chỉ được dùng vào các mục đích chính đáng sau:
              </p>
              <ul className="space-y-2 text-slate-600 list-disc list-inside">
                <li>Kết nối hồ sơ của bạn với các Nhà tuyển dụng phù hợp qua công nghệ AI Matching.</li>
                <li>Gửi thông báo về tiến độ ứng tuyển, lịch phỏng vấn và các cơ hội việc làm mới.</li>
                <li>Ngăn chặn các hành vi gian lận, spam ứng tuyển, bảo vệ an toàn cho cả ứng viên và nhà tuyển dụng.</li>
              </ul>
            </div>
          </motion.section>

          {/* Section 3 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-200/60 flex flex-col md:flex-row gap-8 items-start"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <Eye className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">3. Chia Sẻ Thông Tin</h2>
              <p className="text-slate-600 leading-relaxed">
                Chúng tôi <b>không bao giờ bán dữ liệu của bạn cho bên thứ ba</b>. Thông tin hồ sơ của bạn chỉ được chia sẻ cho Nhà tuyển dụng trong 2 trường hợp:
                <br /><br />
                - Khi bạn <b>chủ động ứng tuyển</b> vào một công việc. <br />
                - Khi bạn <b>bật trạng thái "Sẵn sàng tìm việc"</b>, cho phép Nhà tuyển dụng tìm thấy bạn qua công cụ tìm kiếm của hệ thống.
              </p>
            </div>
          </motion.section>

          {/* Section 4 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-200/60 flex flex-col md:flex-row gap-8 items-start"
          >
            <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center flex-shrink-0">
              <Lock className="w-7 h-7 text-rose-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">4. Quyền Kiểm Soát Của Bạn</h2>
              <p className="text-slate-600 leading-relaxed">
                Bạn có toàn quyền kiểm soát dữ liệu của mình trên hệ thống:
              </p>
              <ul className="space-y-2 mt-4 text-slate-600 list-disc list-inside">
                <li>Quyền ẩn hồ sơ (Tắt "Sẵn sàng tìm việc") để không ai có thể tìm thấy bạn.</li>
                <li>Quyền chỉnh sửa, cập nhật hoặc xóa CV bất kỳ lúc nào.</li>
                <li>Yêu cầu xóa vĩnh viễn tài khoản và mọi dữ liệu liên quan khỏi hệ thống (liên hệ bộ phận CSKH).</li>
              </ul>
            </div>
          </motion.section>
        </div>

        {/* Footer Message */}
        <div className="mt-16 bg-slate-900 rounded-3xl p-8 md:p-10 text-center relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <FileKey className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-white mb-4">Bạn có câu hỏi về bảo mật?</h3>
            <p className="text-slate-300 mb-6 max-w-xl mx-auto">
              Đội ngũ Workly luôn sẵn sàng giải đáp mọi thắc mắc của bạn liên quan đến vấn đề lưu trữ và bảo vệ dữ liệu.
            </p>
            <a 
              href="mailto:privacy@workly.com" 
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white text-slate-900 font-bold hover:bg-slate-100 transition-colors shadow-sm"
            >
              Liên hệ Bộ phận Bảo mật
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
