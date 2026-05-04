export function PartnersSection() {
  return (
    <section className="w-full max-w-5xl mx-auto px-6 py-10 flex flex-col items-center border-t border-slate-100">
      <p className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase mb-8">Đối tác với các nhà lãnh đạo ngành</p>
      <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-40 grayscale">
        <div className="h-8 w-28 bg-slate-300 rounded-md" />
        <div className="h-8 w-32 bg-slate-300 rounded-md" />
        <div className="h-8 w-24 bg-slate-300 rounded-md" />
        <div className="h-8 w-36 bg-slate-300 rounded-md" />
        <div className="h-8 w-28 bg-slate-300 rounded-md hidden sm:block" />
      </div>
    </section>
  );
}
