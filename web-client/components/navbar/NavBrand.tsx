import Link from 'next/link';
import Image from 'next/image';

export function NavBrand() {
  return (
    <Link href="/" className="flex items-center gap-3 cursor-pointer group">
      <div className="relative w-10 h-10 overflow-hidden rounded-xl bg-white shadow-sm border border-slate-100 group-hover:shadow-md transition-all">
        <Image 
          src="/logos/logo.png" 
          alt="Workly Logo" 
          fill
          sizes="40px"
          className="object-contain p-1"
          priority
        />
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-black tracking-tighter text-mariner leading-none">
          Workly
        </span>
      </div>
    </Link>
  );
}
