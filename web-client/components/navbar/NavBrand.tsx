'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export function NavBrand() {
  return (
    <Link href="/" className="flex items-center gap-2 cursor-pointer">
      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm ring-2 ring-blue-100">
        <Sparkles className="w-5 h-5" />
      </div>
      <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
        Workly
      </span>
    </Link>
  );
}
