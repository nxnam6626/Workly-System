'use client';

import { useRouter } from 'next/navigation';
import { Beaker, CheckCircle, AlertTriangle, XCircle, ShieldAlert, Send } from 'lucide-react';

const TEST_SCENARIOS = [
  {
    id: 'PERFECT',
    name: 'Gói Chuẩn (Duyệt ngay)',
    icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    description: 'JD đầy đủ, chuyên nghiệp, ngôn từ rành mạch. Kết quả kỳ vọng: APPROVED (90+)',
    data: {
      title: 'Senior Backend Developer (Node.js/TypeScript)',
      description: 'Chúng tôi đang tìm kiếm Senior Backend Developer để xây dựng kiến trúc hệ thống microservices. \n- Thiết kế và triển khai các API hiệu suất cao.\n- Tối ưu hóa cơ sở dữ liệu PostgreSQL và Redis.\n- Tham gia vào quá trình code review và hướng dẫn các thành viên junior.',
      requirements: '- Ít nhất 4 năm kinh nghiệm với Node.js.\n- Thành thạo TypeScript và NestJS.\n- Có kiến thức tốt về Docker, Kubernetes là điểm cộng.\n- Tư duy giải quyết vấn đề tốt.',
      benefits: '- Mức lương cạnh tranh từ 2000$ - 3500$.\n- Thưởng tháng 13 và thưởng dự án.\n- Bảo hiểm sức khỏe cao cấp.\n- 15 ngày phép/năm.',
      salaryMin: '45000000',
      salaryMax: '80000000',
      jobType: 'FULLTIME',
      experience: 'Trên 3 năm',
      vacancies: 2,
      hardSkills: ['Node.js', 'TypeScript', 'PostgreSQL', 'Microservices'],
      softSkills: ['Teamwork', 'Problem Solving'],
      minExperienceYears: 4,
      jobTier: 'PROFESSIONAL'
    }
  },
  {
    id: 'MEDIOCRE',
    name: 'Gói Sơ sài (Chờ duyệt)',
    icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    description: 'JD thiếu thông tin, văn phong chưa chuyên nghiệp. Kết quả kỳ vọng: PENDING (50-69)',
    data: {
      title: 'Tuyển nhân viên bán hàng lương cao',
      description: 'Cần tuyển gấp nhân viên bán hàng tại shop. Công việc nhẹ nhàng, trao đổi thêm khi phỏng vấn.',
      requirements: 'Chăm chỉ, thật thà là được. Ưu tiên các bạn sv làm thêm.',
      benefits: 'Lương cao, thưởng nếu làm tốt.',
      salaryMin: '7000000',
      salaryMax: '10000000',
      jobType: 'PARTTIME',
      experience: 'Không yêu cầu',
      vacancies: 5,
      hardSkills: ['Bán hàng'],
      softSkills: ['Giao tiếp'],
      minExperienceYears: 0,
      jobTier: 'BASIC'
    }
  },
  {
    id: 'SCAM',
    name: 'Gói Lừa đảo (Từ chối)',
    icon: <XCircle className="w-5 h-5 text-red-500" />,
    description: 'Việc nhẹ lương cao, yêu cầu cọc tiền hoặc inbox Zalo. Kết quả kỳ vọng: REJECTED (<50)',
    data: {
      title: 'Cộng tác viên chốt đơn tại nhà - Lương 500k/ngày',
      description: 'Cần tuyển 20 CTV chốt đơn online. Việc nhẹ lương cao, chỉ cần điện thoại. Không yêu cầu kinh nghiệm. Liên hệ nhận việc ngay.',
      requirements: 'Phải đóng phí hồ sơ 100k trước khi nhận việc. Có điện thoại kết nối mạng.',
      benefits: 'Ngày kiếm 500k-1tr dễ dàng. Thưởng nóng hàng tuần.',
      salaryMin: '15000000',
      salaryMax: '30000000',
      jobType: 'FREELANCE',
      experience: 'Không yêu cầu',
      vacancies: 20,
      hardSkills: ['Online'],
      softSkills: [],
      minExperienceYears: 0,
      jobTier: 'BASIC'
    }
  },
  {
    id: 'BLACKLIST',
    name: 'Gói Dính từ khóa cấm',
    icon: <ShieldAlert className="w-5 h-5 text-slate-800" />,
    description: 'Chứa số điện thoại hoặc từ khóa cấm (Zalo, Telegram). Kết quả kỳ vọng: REJECTED (Blacklist)',
    data: {
      title: 'Kế toán tổng hợp - Liên hệ Zalo 0901234567',
      description: 'Công ty cần tuyển kế toán. Vui lòng kết bạn Zalo hoặc gọi số 0901234567 để nhận JD chi tiết.',
      requirements: 'Có bằng kế toán. Biết dùng phần mềm Misa.',
      benefits: 'Lương thỏa thuận.',
      salaryMin: '10000000',
      salaryMax: '15000000',
      jobType: 'FULLTIME',
      experience: '1 năm',
      vacancies: 1,
      hardSkills: ['Kế toán'],
      softSkills: [],
      minExperienceYears: 1,
      jobTier: 'BASIC'
    }
  }
];

export default function PostJobTestPage() {
  const router = useRouter();

  const handleInject = (data: any) => {
    localStorage.setItem('workly_test_jd', JSON.stringify(data));
    router.push('/recruiter/post-job');
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
          <Beaker className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Workly AI Moderation Lab</h1>
          <p className="text-slate-500 font-medium">Chọn bộ dữ liệu mẫu để kiểm tra bộ máy đánh giá JD</p>
        </div>
      </div>

      <div className="grid gap-4">
        {TEST_SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => handleInject(scenario.data)}
            className="flex items-start gap-4 p-5 bg-white border-2 border-slate-100 rounded-3xl hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-100 transition-all text-left group"
          >
            <div className="mt-1">{scenario.icon}</div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{scenario.name}</h3>
              <p className="text-sm text-slate-500 mt-1">{scenario.description}</p>
            </div>
            <div className="self-center">
              <Send className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
            </div>
          </button>
        ))}
      </div>

      <div className="mt-12 p-6 bg-slate-900 rounded-3xl text-slate-300">
        <h4 className="font-bold text-white mb-2 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-400" /> Hướng dẫn sử dụng:
        </h4>
        <ul className="text-sm space-y-2 list-disc list-inside opacity-80">
          <li>Nhấn vào một gói dữ liệu phía trên.</li>
          <li>Hệ thống sẽ tự động đưa bạn về trang <span className="text-blue-400">Đăng tin</span> và điền sẵn dữ liệu.</li>
          <li>Tại trang đăng tin, nhấn nút <span className="text-emerald-400 font-bold">Xác nhận & Đăng tin</span> để xem AI xử lý như thế nào.</li>
        </ul>
      </div>
    </div>
  );
}

function Info({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
  );
}
