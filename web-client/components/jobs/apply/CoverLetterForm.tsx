import React from "react";
import { Leaf, Pencil } from "lucide-react";
import Link from "next/link";

interface CoverLetterFormProps {
  coverLetter: string;
  setCoverLetter: (val: string) => void;
  agree: boolean;
  setAgree: (val: boolean) => void;
}

export const CoverLetterForm: React.FC<CoverLetterFormProps> = ({ 
  coverLetter, 
  setCoverLetter, 
  agree, 
  setAgree 
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-slate-900 font-bold">
          <Leaf className="w-5 h-5 text-blue-600" />
          <h3>Thư giới thiệu:</h3>
        </div>
        <p className="text-xs text-slate-500 mb-2 leading-relaxed">Một thư giới thiệu ngắn gọn, chỉn chu sẽ giúp bạn trở nên chuyên nghiệp và gây ấn tượng hơn với nhà tuyển dụng.</p>
        <div className="relative group">
          <textarea
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-md text-sm min-h-[120px] focus:border-blue-600 focus:ring-0 outline-none transition-all"
            placeholder="Viết giới thiệu ngắn gọn về bản thân (điểm mạnh, điểm yếu) và nêu rõ mong muốn, lý do bạn muốn ứng tuyển cho vị trí này."
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
          />
          <div className="absolute right-3 bottom-3 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white scale-0 group-focus-within:scale-100 transition-transform cursor-pointer shadow-lg">
            <Pencil className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 py-2">
        <input
          required
          type="checkbox"
          id="agree"
          className="w-5 h-5 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
        />
        <label htmlFor="agree" className="text-sm text-slate-600 leading-normal cursor-pointer select-none">
          Tôi đã đọc và đồng ý với <Link href="#" className="text-blue-600 font-bold">"Thoả thuận sử dụng dữ liệu cá nhân"</Link> của Nhà tuyển dụng
        </label>
      </div>
    </div>
  );
};
