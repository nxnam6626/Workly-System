'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  LogOut,
  LayoutDashboard,
  Users,
  Briefcase,
  Building,
  TrendingUp,
  Shield,
  Menu,
  HelpCircle,
  MessageSquare,
  Bot,
  Star,
} from 'lucide-react';
import { NotificationMenu } from '@/components/navbar/NotificationMenu';
import { checkIsAdmin } from '@/lib/admin-auth';

const NAV_GROUPS = [
  {
    label: 'Hệ thống',
    items: [
      { label: 'Tổng quan', href: '/admin/dashboard', icon: LayoutDashboard, requireLevel1: true },
      { label: 'Quản Trị Viên', href: '/admin/admins', icon: Shield, requireLevel1: true },
    ],
  },
  {
    label: 'Dữ liệu',
    items: [
      { label: 'Việc Làm', href: '/admin/jobs', icon: Briefcase, perm: 'MANAGE_JOBS' },
      { label: 'Đánh Giá (Review)', href: '/admin/reviews', icon: Star, perm: 'MANAGE_JOBS' },
    ],
  },
  {
    label: 'Khách hàng',
    items: [
      { label: 'Doanh Nghiệp', href: '/admin/companies', icon: Building, perm: 'MANAGE_USERS' },
      { label: 'Nhà Tuyển Dụng', href: '/admin/recruiters', icon: Briefcase, perm: 'MANAGE_USERS' },
      { label: 'Ứng Viên', href: '/admin/candidates', icon: Users, perm: 'MANAGE_USERS' },
    ],
  },
  {
    label: 'Tài chính & Hỗ trợ',
    items: [
      { label: 'Thanh Toán & Doanh Thu', href: '/admin/revenue', icon: TrendingUp, perm: 'MANAGE_BILLING' },
      { label: 'Hỗ Trợ', href: '/admin/support', icon: HelpCircle, perm: 'MANAGE_SUPPORT' },
    ],
  },
];

export default function ProtectedAdminConsoleLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isInitialized, isLoading, logout, user } = useAuthStore();
  
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = useMemo(() => checkIsAdmin(user), [user]);

  // Auth & Role Guard — only runs after checkAuth() has completed at least once
  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated || !isAdmin) {
      router.replace('/admin/login');
      return;
    }

    // Role-based Redirect Logic (Level 2 Admin)
    const isAtRootOrDashboard = pathname === '/admin' || pathname === '/admin/dashboard';
    if (!isAtRootOrDashboard) return;

    const perms = (user?.admin?.permissions as string[]) || [];
    const isSupreme = perms.includes('SUPER_ADMIN');

    if (isSupreme) {
      if (pathname === '/admin') router.replace('/admin/dashboard');
      return;
    }

    // Redirect Level 2 Admin to their first allowed module
    let targetPage = '';
    if (perms.includes('MANAGE_USERS')) targetPage = '/admin/candidates';
    else if (perms.includes('MANAGE_JOBS')) targetPage = '/admin/jobs';
    else if (perms.includes('MANAGE_BILLING') || perms.includes('MANAGE_REVENUE')) targetPage = '/admin/revenue';
    else if (perms.includes('MANAGE_SUPPORT')) targetPage = '/admin/support';

    if (targetPage) {
      router.replace(targetPage);
    }
  }, [isAuthenticated, isInitialized, isAdmin, user, router, pathname]);

  // 1. Block render until initial auth check is done
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // 2. Auth Guard Render
  if (!isAuthenticated || !isAdmin) return null;

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
      {/* Brand */}
      <div className={`flex items-center gap-3 px-4 py-6 border-b border-slate-800/60 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/40">
          <Shield className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-black text-white tracking-tighter">WORKLY</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Admin Console</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-8 overflow-y-auto custom-scrollbar">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-3">
            {!collapsed && (
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] px-3">
                {group.label}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item: any) => {
                const active = pathname.startsWith(item.href);
                const perms = user?.admin?.permissions || [];
                const isSupreme = perms.includes('SUPER_ADMIN');

                if (item.requireLevel1 && !isSupreme) return null;
                if (item.perm && !isSupreme && !perms.includes(item.perm)) return null;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                      active 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                    } ${collapsed ? 'justify-center' : ''}`}
                    title={collapsed ? item.label : ''}
                  >
                    <item.icon className={`w-5 h-5 shrink-0 ${active ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`} />
                    {!collapsed && (
                      <span className="text-sm font-bold truncate tracking-tight">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800/60 bg-slate-900/50">
        <div className={`flex items-center gap-3 p-3 rounded-2xl bg-slate-800/30 mb-2 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-inner">
            {(user?.name || user?.email || 'A').charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-black text-white truncate">{user?.name || 'Admin'}</p>
              <p className="text-[10px] font-medium text-slate-500 truncate">{user?.email}</p>
            </div>
          )}
        </div>
        <button
          onClick={() => logout()}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span className="text-sm font-bold">Đăng xuất</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-300 lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col transition-all duration-300 bg-slate-900 relative ${collapsed ? 'w-20' : 'w-64'}`}>
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all shadow-xl z-10"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(true)} className="p-2 lg:hidden text-slate-500 hover:bg-slate-100 rounded-xl">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Admin Console</span>
              <span className="text-slate-300 mx-1">/</span>
              <span className="text-blue-600 capitalize">
                {pathname.split('/').pop()?.replace('-', ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationMenu />
            <div className="w-px h-6 bg-slate-200 mx-2" />
            <div className="flex items-center gap-3">
              <div className="hidden sm:text-right">
                <p className="text-sm font-black text-slate-900">{user?.name || 'Admin'}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">System Administrator</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-blue-600 font-black text-sm shadow-sm">
                {(user?.name || user?.email || 'A').charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
