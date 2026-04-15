import React, { forwardRef } from "react";
import { Mail, Phone, MapPin, Briefcase, GraduationCap, Award, Brain, Clock, ChevronRight } from "lucide-react";

interface CVData {
  fullName: string;
  avatar?: string;
  email: string;
  phone: string;
  jobTitle: string;
  skills: string[];
  experience: {
    company: string;
    role: string;
    years: number;
    description?: string;
  }[];
  education: {
    school: string;
    degree: string;
    major: string;
  }[];
  totalYearsExp: number;
  summary?: string;
}

interface Props {
  data: CVData;
}

const categorizeSkill = (skill: string) => {
  if (!skill || typeof skill !== 'string') return 'Chuyên Môn Khác';
  const s = skill.toLowerCase();

  if (/react|vue|angular|html|css|tailwind|bootstrap|svelte|next|nuxt|vite|webpack/.test(s)) return 'Frontend';
  if (/node|express|nest|django|flask|spring|laravel|php|ruby|asp\.net|c#|golang/.test(s)) return 'Backend';
  if (/sql|mongo|redis|postgres|mysql|oracle|cassandra|firebase|supabase/.test(s)) return 'Database';
  if (/aws|docker|kubernetes|azure|gcp|ci\/cd|jenkins|linux|nginx|git|github/.test(s)) return 'DevOps & Tool';
  if (/android|ios|flutter|react native|xamarin/.test(s)) return 'Mobile';
  if (/python|java|c\+\+|javascript|typescript|rust|swift|kotlin|ruby|php|dart/.test(s)) return 'Ngôn Ngữ';
  if (/figma|photoshop|illustrator|ui|ux|design|sketch/.test(s)) return 'UI / UX Design';
  if (/agile|scrum|jira|trello|management|leader|quản lý thời gian|giao tiếp|tiếng trung|tiếng nhật|tiếng hàn|ngoại ngữ|ngôn ngữ|tiếng anh/.test(s)) return 'Kỹ năng Mềm';

  return 'Chuyên Môn Khác';
};

const CVPreviewTemplate = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  return (
    <div className="w-full flex justify-center bg-slate-100 py-[32px]">
      {/* Container chuẩn khổ A4 */}
      <style>{`
        #cv-pdf-container {
          --color-slate-50: #f8fafc;
          --color-slate-100: #f1f5f9;
          --color-slate-200: #e2e8f0;
          --color-slate-300: #cbd5e1;
          --color-slate-400: #94a3b8;
          --color-slate-500: #64748b;
          --color-slate-600: #475569;
          --color-slate-700: #334155;
          --color-slate-800: #1e293b;
          --color-slate-900: #0f172a;
          --color-blue-50: #eff6ff;
          --color-blue-100: #dbeafe;
          --color-blue-200: #bfdbfe;
          --color-blue-300: #93c5fd;
          --color-blue-400: #60a5fa;
          --color-blue-500: #3b82f6;
          --color-blue-600: #2563eb;
          --color-emerald-50: #ecfdf5;
          --color-emerald-600: #059669;
          --color-white: #ffffff;
          --color-transparent: transparent;
        }
      `}</style>
      <div
        ref={ref}
        id="cv-pdf-container"
        className="bg-white text-slate-800 relative w-[800px] min-w-[800px] max-w-[800px] shrink-0 min-h-[1131px] p-0"
      >
        {/* Header - Phong cách Premium Midnight Blue */}
        <div className="bg-[#0f172a] text-white px-[48px] py-[48px] pb-[56px] border-b-[8px] border-blue-600 flex items-center gap-[40px]">

          {data.avatar && (
            <div className="w-[120px] h-[120px] rounded-[9999px] border-[4px] border-[#334155] overflow-hidden shrink-0 bg-[#1e293b] flex items-center justify-center">
              <img
                src={data.avatar}
                alt="Avatar"
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            </div>
          )}

          <div className="flex-1">
            <h1 className="text-4xl font-black uppercase tracking-tight mb-[8px] text-white">
              {data.fullName || "Nguyễn Văn A"}
            </h1>
            <p className="text-blue-300 font-bold text-lg tracking-widest uppercase mb-[24px]">
              {data.jobTitle || "Vị Trí Ứng Tuyển"} {data.totalYearsExp > 0 ? `• ${data.totalYearsExp} Năm Kinh Nghiệm` : ""}
            </p>

            <div className="flex flex-wrap gap-[24px] text-sm font-medium text-slate-300 mt-[16px]">
              {data.email && (
                <div className="flex items-center gap-[8px]">
                  <div className="w-[24px] h-[24px] rounded-[4px] bg-[rgba(255,255,255,0.1)] flex items-center justify-center">
                    <Mail className="w-[14px] h-[14px] text-white" />
                  </div>
                  {data.email}
                </div>
              )}
              {data.phone && (
                <div className="flex items-center gap-[8px]">
                  <div className="w-[24px] h-[24px] rounded-[4px] bg-[rgba(255,255,255,0.1)] flex items-center justify-center">
                    <Phone className="w-[14px] h-[14px] text-white" />
                  </div>
                  {data.phone}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Body - Using Flex instead of Grid for HTML2Canvas compatibility */}
        <div className="px-[48px] py-[40px] flex gap-[32px]">

          {/* CỘT TRÁI (Kinh Nghiệm + Học Vấn) */}
          <div className="flex-1 flex flex-col gap-[40px]">

            {/* Profile Summary */}
            {data.summary && (
              <section>
                <h2 className="text-xl font-black text-[#0f172a] uppercase tracking-wider mb-[16px] flex items-center gap-[12px]">
                  <div className="w-[32px] h-[32px] rounded-[8px] bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Brain className="w-[16px] h-[16px]" />
                  </div>
                  Tóm tắt sự nghiệp
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed font-medium text-justify">
                  {data.summary}
                </p>
              </section>
            )}

            {/* Kinh nghiệm */}
            {data.experience && data.experience.length > 0 && (
              <section>
                <h2 className="text-xl font-black text-[#0f172a] uppercase tracking-wider mb-[24px] flex items-center gap-[12px]">
                  <div className="w-[32px] h-[32px] rounded-[8px] bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Briefcase className="w-[16px] h-[16px]" />
                  </div>
                  Kinh nghiệm làm việc
                </h2>
                <div className="flex flex-col gap-[24px] relative before:absolute before:inset-0 before:ml-[6px] before:translate-x-[-1px] before:h-full before:w-[2px] before:bg-slate-200">
                  {data.experience.map((exp, idx) => (
                    <div key={idx} className="relative flex items-start gap-[20px]">
                      <div className="absolute left-[-16px] top-[6px] w-[12px] h-[12px] rounded-[9999px] border-2 border-blue-600 bg-white z-10" />
                      <div className="pl-[16px] w-full">
                        <h3 className="text-base font-bold text-slate-900">{exp.role}</h3>
                        <div className="flex items-center gap-[12px] mt-[4px] mb-[8px]">
                          <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">{exp.company}</span>
                          <span className="w-[4px] h-[4px] rounded-[9999px] bg-slate-300" />
                          <span className="text-[12px] font-bold text-slate-400 uppercase flex items-center gap-[4px]">
                            <Clock className="w-[12px] h-[12px]" /> {exp.years} Năm
                          </span>
                        </div>
                        {exp.description && (
                          <p className="text-sm text-slate-600 leading-relaxed font-medium text-justify">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Học vấn */}
            {data.education && data.education.length > 0 && (
              <section>
                <h2 className="text-xl font-black text-[#0f172a] uppercase tracking-wider mb-[24px] flex items-center gap-[12px]">
                  <div className="w-[32px] h-[32px] rounded-[8px] bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <GraduationCap className="w-[16px] h-[16px]" />
                  </div>
                  Học vấn
                </h2>
                <div className="flex flex-col gap-[16px]">
                  {data.education.map((edu, idx) => (
                    <div key={idx} className="p-[16px] rounded-[12px] border border-slate-100 bg-[rgba(248,250,252,0.5)]">
                      <h3 className="text-sm font-bold text-slate-900 uppercase">{edu.school}</h3>
                      <div className="flex items-center gap-[8px] mt-[4px]">
                        <span className="text-sm font-semibold text-emerald-600">{edu.degree}</span>
                        <span className="text-slate-400 text-xs">•</span>
                        <span className="text-sm font-medium text-slate-600">{edu.major}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>

          {/* CỘT PHẢI (Kỹ năng Sidebar) */}
          <div className="w-[260px] shrink-0">
            <div className="p-[20px] bg-slate-50 border border-slate-100 rounded-[16px] h-full">
              <h2 className="text-[15px] font-black text-[#0f172a] uppercase tracking-widest mb-[20px] flex items-center gap-[8px]">
                <Award className="w-[16px] h-[16px] text-blue-500" /> Kỹ năng
              </h2>

              {data.skills && data.skills.length > 0 ? (
                <div className="flex flex-col gap-[24px]">
                  {Object.entries(
                    data.skills.reduce((acc, skill) => {
                      const cat = categorizeSkill(skill);
                      if (!acc[cat]) acc[cat] = [];
                      acc[cat].push(skill);
                      return acc;
                    }, {} as Record<string, string[]>)
                  ).map(([category, items]: any) => (
                    <div key={category}>
                      <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-[8px] border-b border-slate-200 pb-[4px]">
                        {category}
                      </h3>
                      <div className="flex flex-col gap-[6px] pt-[4px]">
                        {items.map((skill: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-[8px]">
                            <ChevronRight className="w-[12px] h-[12px] text-blue-400 shrink-0" />
                            <span className="text-[13px] font-bold text-slate-700 capitalize">{skill}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Chưa có kỹ năng nổi bật</p>
              )}

              {/* Optional decorative element */}
              <div className="mt-[48px] flex justify-center opacity-20">
                <div className="w-[64px] h-[4px] bg-slate-300 rounded-[9999px]" />
              </div>
            </div>
          </div>

        </div>

        {/* Workly Watermark Footer */}
        <div className="absolute bottom-0 left-0 right-0 py-[16px] bg-slate-50 border-t border-slate-200 flex justify-center items-center gap-[8px] print:border-none">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Được tạo chuyên nghiệp bởi nền tảng</span>
          <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest">WORKLY.VN</span>
        </div>
      </div>
    </div>
  );
});

CVPreviewTemplate.displayName = "CVPreviewTemplate";
export default CVPreviewTemplate;
