import React from "react";
import { FileText, Upload } from "lucide-react";

interface UserCV {
  cvId: string;
  cvTitle: string;
  fileUrl: string;
  isMain: boolean;
  createdAt: string;
}

interface CVSelectionProps {
  userCVs: UserCV[];
  useExistingCv: boolean;
  setUseExistingCv: (val: boolean) => void;
  selectedCvId: string;
  setSelectedCvId: (id: string) => void;
  fetchingProfile: boolean;
  isParsing: boolean;
  file: File | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CVSelection: React.FC<CVSelectionProps> = ({
  userCVs,
  useExistingCv,
  setUseExistingCv,
  selectedCvId,
  setSelectedCvId,
  fetchingProfile,
  isParsing,
  file,
  fileInputRef,
  handleFileChange,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-700 font-bold">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3>Chọn CV để ứng tuyển</h3>
        </div>
        {userCVs.length > 0 && (
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setUseExistingCv(true)}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${useExistingCv ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              Dùng CV sẵn có
            </button>
            <button
              type="button"
              onClick={() => setUseExistingCv(false)}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${!useExistingCv ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              Tải CV mới
            </button>
          </div>
        )}
      </div>

      <div className={`border-2 rounded-lg p-6 relative transition-all ${useExistingCv ? 'border-blue-600 bg-blue-50/30' : 'border-slate-200 bg-slate-50/30'}`}>
        {useExistingCv ? (
          <div className="space-y-4">
            {fetchingProfile ? (
              <div className="flex flex-col items-center py-4">
                <div className="w-6 h-6 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-2" />
                <p className="text-xs text-slate-400">Đang tải danh sách CV...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {userCVs.map((cv) => (
                  <div
                    key={cv.cvId}
                    onClick={() => setSelectedCvId(cv.cvId)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-between ${selectedCvId === cv.cvId ? 'border-blue-600 bg-white shadow-md' : 'border-slate-100 bg-white/50 hover:border-blue-200'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center p-0.5 ${selectedCvId === cv.cvId ? 'border-blue-600' : 'border-slate-300'}`}>
                        {selectedCvId === cv.cvId && <div className="w-full h-full bg-blue-600 rounded-full" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{cv.cvTitle}</p>
                        <p className="text-[10px] text-slate-400">Tải lên ngày {new Date(cv.createdAt).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                    {cv.isMain && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded-full">CV chính</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-3">
            {isParsing ? (
              <div className="flex flex-col items-center py-6">
                <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />
                <p className="text-sm font-bold text-blue-600 uppercase tracking-wider">Đang phân tích CV bằng AI...</p>
                <p className="text-xs text-slate-400 mt-1">Vui lòng chờ trong giây lát</p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {file ? file.name : "Tải lên CV từ máy tính, chọn hoặc kéo thả"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Hỗ trợ định dạng .doc, .docx, pdf có kích thước dưới 5MB</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".doc,.docx,.pdf"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-8 py-2 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
                >
                  Chọn CV mới
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
