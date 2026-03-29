'use client';

import { useAuthStore } from '@/stores/auth';
import { NavBrand } from './navbar/NavBrand';
import { NavIcons } from './navbar/NavIcons';
import { AuthActions } from './navbar/AuthActions';
import { UserDropdown } from './navbar/UserDropdown';

export function Navbar() {
  const { isAuthenticated } = useAuthStore();

  return (
    <nav className="flex items-center justify-between px-6 py-4 md:px-12 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 shadow-sm transition-all duration-300">
      <NavBrand />

      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            <NavIcons />
            <UserDropdown />
          </div>
        ) : (
          <AuthActions />
        )}
      </div>
    </nav>
  );
}
