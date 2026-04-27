import { Briefcase, FileText, Target } from "lucide-react";

export function CareerTools() {
  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-24 flex flex-col border-t border-slate-100 mt-12 bg-white/50">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">Công c? ngh? nghi?p cho th? h? m?i</h2>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">M?i th? b?n c?n d? di t? ?ng viên d?n Làm vi?c t? xa t?i các công ty yêu thích c?a b?n.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-blue-600">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-3">Thu th?p Thông minh</h3>
          <p className="text-slate-500 leading-relaxed">
            Chúng tôi t?ng h?p các k? Làm vi?c t? xa t?t nh?t t? kh?p noi trên web, du?c di?u ch?nh hoàn toàn theo s? thích c?a b?n.
          </p>
        </div>

        <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6 text-orange-600">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-3">Ðánh giá CV AI</h3>
          <p className="text-slate-500 leading-relaxed">
            T?i uu hóa so y?u lý l?ch c?a b?n b?ng AI du?c hu?n luy?n d? hi?u chính xác nh?ng gì nhà tuy?n d?ng dang tìm ki?m.
          </p>
        </div>

        <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 text-indigo-600">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-3">Thông tin N?i b?</h3>
          <p className="text-slate-500 leading-relaxed">
            Nh?n nh?ng dánh giá xác th?c và m?o ph?ng v?n d?c quy?n t? các c?u Làm vi?c t? xa dã t?ng làm vi?c t?i dó.
          </p>
        </div>
      </div>
    </section>
  );
}
