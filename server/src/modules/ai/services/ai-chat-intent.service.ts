import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AiChatIntentService {
  private readonly logger = new Logger(AiChatIntentService.name);

  constructor(private readonly prisma: PrismaService) { }

  async handleCandidateFastPaths(normalizedMsg: string, userId: string): Promise<string | any | null> {
    const isCvMatchIntent =
      normalizedMsg.includes('hợp với cv') ||
      normalizedMsg.includes('hợp với hồ sơ') ||
      normalizedMsg.includes('việc nào phù hợp') ||
      normalizedMsg.includes('công việc phù hợp');

    if (isCvMatchIntent) {
      try {
        const candidateRecord = await this.prisma.candidate.findUnique({ where: { userId } });
        if (candidateRecord) {
          const matchedJobs = await this.prisma.jobMatch.findMany({
            where: { candidateId: candidateRecord.candidateId },
            include: { jobPosting: { include: { company: true } } },
            orderBy: { score: 'desc' },
            take: 3,
          });
          if (matchedJobs.length > 0) {
            const payload = matchedJobs.map((m: any) => ({
              id: m.jobPosting.jobPostingId,
              title: m.jobPosting.title,
              company_name: m.jobPosting.company.companyName,
              location: m.jobPosting.locationCity || 'Không xác định',
              salary: m.jobPosting.salaryMin
                ? `${m.jobPosting.salaryMin} - ${m.jobPosting.salaryMax} ${m.jobPosting.currency}`
                : 'Thỏa thuận',
              why_match: `Phù hợp kỹ năng: ${m.matchedSkills?.join(', ') || 'Chung'}`,
              percent: Math.round(m.score),
            }));
            return {
              text: 'Hệ thống vừa phân tích hồ sơ của bạn với cơ sở dữ liệu việc làm. Đây là các công việc có độ **Matching Score** phù hợp nhất hiện tại:',
              action: { type: 'SHOW_JOB_CARDS', payload }
            };
          }
        }
      } catch (err) {
        this.logger.warn(`Fast path JobMatch error: ${err}`);
      }
    }

    if (normalizedMsg.includes('đơn ứng tuyển') || normalizedMsg.includes('việc đã nộp')) {
      try {
        const candidateRecord = await this.prisma.candidate.findUnique({ where: { userId } });
        if (candidateRecord) {
          const applications = await this.prisma.application.findMany({
            where: { candidateId: candidateRecord.candidateId },
            include: { jobPosting: { include: { company: true } } },
            orderBy: { applyDate: 'desc' },
            take: 5,
          });
          if (applications.length > 0) {
            let response = 'Đây là trạng thái 5 đơn ứng tuyển gần nhất của bạn trên hệ thống:\n\n';
            applications.forEach((app) => {
              const statusVi = app.appStatus === 'PENDING' ? 'Đang chờ duyệt' : app.appStatus === 'REVIEWED' ? 'Đã xem' : app.appStatus === 'INTERVIEWING' ? 'Đang phỏng vấn' : app.appStatus === 'ACCEPTED' ? 'Trúng tuyển' : 'Từ chối';
              response += `- **${app.jobPosting.title}** (Công ty ${app.jobPosting.company.companyName}): Trạng thái **${statusVi}**.\n`;
            });
            return { text: response };
          } else {
            return { text: 'Hiện tại hệ thống không ghi nhận đơn ứng tuyển nào của bạn.' };
          }
        }
      } catch (e) {
        this.logger.warn(`Fast path Applications error ${e}`);
      }
    }

    if (normalizedMsg.includes('công việc đã lưu') || normalizedMsg.includes('việc đã lưu') || normalizedMsg.includes('job đã lưu')) {
      try {
        const candidateRecord = await this.prisma.candidate.findUnique({ where: { userId } });
        if (candidateRecord) {
          const savedJobs = await this.prisma.savedJob.findMany({
            where: { candidateId: candidateRecord.candidateId },
            include: { jobPosting: { include: { company: true } } },
            orderBy: { savedAt: 'desc' },
            take: 5,
          });
          if (savedJobs.length > 0) {
            let response = 'Đây là danh sách 5 công việc bạn đã lưu gần nhất:\n\n';
            savedJobs.forEach((sj) => {
              response += `- **${sj.jobPosting.title}** tại ${sj.jobPosting.company.companyName} (Lưu ngày: ${new Date(sj.savedAt).toLocaleDateString('vi-VN')})\n`;
            });
            return { text: response };
          } else {
            return { text: 'Bạn chưa lưu công việc nào vào danh sách yêu thích.' };
          }
        }
      } catch (e) {}
    }

    if (normalizedMsg.includes('thông tin tài khoản') || normalizedMsg.includes('hồ sơ của tôi')) {
      try {
        const candidateRecord = await this.prisma.candidate.findUnique({
          where: { userId },
          include: { skills: true, user: true },
        });
        if (candidateRecord) {
          return { text: `Thông tin hồ sơ cơ bản của bạn:\n- **Họ tên**: ${candidateRecord.fullName}\n- **Email**: ${candidateRecord.user.email}\n- **Học vấn**: ${candidateRecord.university || 'Chưa cập nhật'}\n- **Điểm GPA**: ${candidateRecord.gpa || 'Chưa cập nhật'}\n- **Kỹ năng**: ${candidateRecord.skills.map((s: any) => s.skillName).join(', ') || 'Chưa cập nhật'}\n- **Tìm việc**: ${candidateRecord.isOpenToWork ? 'Đang bật' : 'Đang tắt'}\n\nBạn có thể vào mục "Hồ sơ cá nhân" để cập nhật chi tiết hơn.` };
        }
      } catch (e) {}
    }

    return null;
  }

  async handleRecruiterFastPaths(normalizedMsg: string, userId: string): Promise<string | any | null> {
    if (normalizedMsg.includes('số dư xu') || normalizedMsg.includes('ví của tôi') || normalizedMsg.includes('còn bao nhiêu xu') || normalizedMsg.includes('tài khoản của tôi')) {
      try {
        const recruiterRecord = await this.prisma.recruiter.findUnique({
          where: { userId },
          include: { recruiterWallet: true },
        });
        if (recruiterRecord?.recruiterWallet) {
          return { text: `Tài khoản ví của bạn hiện đang có: **${new Intl.NumberFormat('vi-VN').format(recruiterRecord.recruiterWallet.balance)} Xu**.\nSố lượt mở khóa CV hiện còn: **${recruiterRecord.recruiterWallet.cvUnlockQuota}** lượt.` };
        }
      } catch (e) {
        this.logger.warn(`Fast path Wallet error ${e}`);
      }
    }

    if (normalizedMsg.includes('tin tuyển dụng đã đăng') || normalizedMsg.includes('danh sách việc làm') || normalizedMsg.includes('thống kê tin tuyển dụng')) {
      try {
        const recruiterRecord = await this.prisma.recruiter.findUnique({ where: { userId } });
        if (recruiterRecord) {
          const jobs = await this.prisma.jobPosting.findMany({
            where: { recruiterId: recruiterRecord.recruiterId },
            select: { status: true },
          });
          const active = jobs.filter((j) => j.status === 'APPROVED').length;
          const pending = jobs.filter((j) => j.status === 'PENDING').length;
          const expired = jobs.filter((j) => j.status === 'EXPIRED').length;
          const rejected = jobs.filter((j) => j.status === 'REJECTED').length;

          return { text: `Tổng quan tin tuyển dụng của công ty bạn:\n- Đang tuyển / Đã duyệt: **${active}**\n- Đang chờ duyệt: **${pending}**\n- Đã hết hạn: **${expired}**\n- Bị từ chối: **${rejected}**\n\nBạn có thể vào mục "Tin Tuyển Dụng" trên menu để xem và quản lý chi tiết.` };
        }
      } catch (e) {}
    }

    if (normalizedMsg.includes('danh sách ứng viên') || normalizedMsg.includes('người đã nộp đơn') || normalizedMsg.includes('ứng viên ứng tuyển')) {
      try {
        const recruiterRecord = await this.prisma.recruiter.findUnique({ where: { userId } });
        if (recruiterRecord) {
          const applicants = await this.prisma.application.findMany({
            where: { jobPosting: { recruiterId: recruiterRecord.recruiterId } },
            include: { candidate: true, jobPosting: true },
            orderBy: { applyDate: 'desc' },
            take: 5,
          });
          if (applicants.length > 0) {
            let response = 'Đây là 5 lượt ứng tuyển gửi đến công ty bạn gần nhất:\n\n';
            applicants.forEach((app) => {
              response += `- Ứng viên **${app.candidate.fullName}** ứng tuyển vị trí **${app.jobPosting.title}** (Ngày: ${new Date(app.applyDate).toLocaleDateString('vi-VN')})\n`;
            });
            return { text: response };
          } else {
            return { text: 'Hiện tại chưa có ứng viên nào nộp đơn vào các tin tuyển dụng của bạn.' };
          }
        }
      } catch (e) {}
    }

    return null;
  }

  isJobPostingIntent(normalizedMsg: string): boolean {
    const jobKeywords = ['đăng tin', 'tuyển dụng', 'cần tuyển', 'viết jd', 'tạo jd', 'đăng jd', 'tạo tin', 'đăng tin tuyển dụng', 'cần tìm', 'cần gấp', 'tìm người', 'tìm nhân viên', 'tìm ứng viên', 'tuyển', 'đăng việc'];
    const excludeKeywords = ['hướng dẫn', 'làm sao', 'cách', 'như thế nào', 'lỗi'];

    let hasJobKeyword = jobKeywords.some(k => normalizedMsg.includes(k));
    let hasExcludeKeyword = excludeKeywords.some(k => normalizedMsg.includes(k));

    return hasJobKeyword && !hasExcludeKeyword;
  }
}
