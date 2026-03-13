'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, LogOut } from 'lucide-react';
import { useAuthStore, useCurrentUser, useIsManager, useAuthLoading } from '@/store/useAuthStore';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { toast } from '@/store/useToastStore';
import type { UserRole } from '@/types';

const NAV_LINKS: { label: string; href: string; roles: UserRole[] }[] = [
  { label: 'Tổng quan',  href: '/',             roles: ['salesperson', 'manager'] },
  { label: 'Tiềm năng',  href: '/leads',         roles: ['salesperson', 'manager'] },
  { label: 'Cơ hội',     href: '/opportunities', roles: ['salesperson', 'manager'] },
  { label: 'Khách hàng', href: '/clients',       roles: ['salesperson', 'manager'] },
  { label: 'Hoạt động',  href: '/activities',    roles: ['salesperson', 'manager'] },
  { label: 'Dự báo',     href: '/forecast',      roles: ['manager'] },
  { label: 'Tài liệu',   href: '/documents',     roles: ['salesperson', 'manager'] },
];

export default function TopNav() {
  const pathname  = usePathname();
  const router    = useRouter();
  const user      = useCurrentUser();
  const isManager = useIsManager();
  const isLoading = useAuthLoading();
  const clearUser = useAuthStore((s) => s.clearUser);

  const [confirmLogout, setConfirmLogout] = useState(false);

  if (pathname === '/login') return null;
  if (!isLoading && !user) return null;

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    clearUser();
    toast.info('Đã đăng xuất');
    router.replace('/login');
  };

  const visibleLinks = isLoading
    ? NAV_LINKS
    : NAV_LINKS.filter(link => user ? link.roles.includes(user.role) : false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-[#1a1a1a] bg-black/95 backdrop-blur">
        <div className="flex h-14 items-center gap-4 px-4">

          {/* Logo */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#DFFF00]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              {[0,1,2,3].map(row =>
                [0,1,2,3].map(col => (
                  <circle
                    key={`${row}-${col}`}
                    cx={2 + col * 4} cy={2 + row * 4} r="1"
                    fill="#000" opacity={(row + col) % 3 === 0 ? 1 : 0.4}
                  />
                ))
              )}
            </svg>
          </div>

          {/* Nav Links */}
          <nav className="flex items-center gap-1">
            {visibleLinks.map(({ label, href }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-white text-black'
                      : 'text-[#888] hover:bg-[#1a1a1a] hover:text-white'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex-1" />

          {/* Search */}
          <div className="flex h-9 w-52 items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#111] px-3 transition-colors focus-within:border-[#DFFF00]/50">
            <Search size={14} className="text-[#555] shrink-0" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full bg-transparent text-sm text-white placeholder-[#555] outline-none"
            />
          </div>

          {/* User info + role badge */}
          {user && (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-medium text-white leading-none">{user.name}</span>
                <span className={`text-[10px] leading-none mt-0.5 ${
                  isManager ? 'text-[#DFFF00]' : 'text-[#555]'
                }`}>
                  {isManager ? 'Manager' : 'Salesperson'}
                </span>
              </div>

              {/* Avatar */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-bold text-black select-none">
                {user.avatar}
              </div>

              {/* Logout */}
              <button
                onClick={() => setConfirmLogout(true)}
                title="Đăng xuất"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#111] text-[#555] transition-all hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Confirm logout */}
      {confirmLogout && (
        <ConfirmDialog
          title="Đăng xuất"
          description={`Bạn có chắc muốn đăng xuất khỏi tài khoản ${user?.name ?? ''}?`}
          confirmLabel="Đăng xuất"
          variant="warning"
          onConfirm={() => { setConfirmLogout(false); handleLogout(); }}
          onCancel={() => setConfirmLogout(false)}
        />
      )}
    </>
  );
}
