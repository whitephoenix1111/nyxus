'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Plus } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Tổng quan', href: '/' },
  { label: 'Tiềm năng', href: '/leads' },
  { label: 'Cơ hội', href: '/opportunities' },
  { label: 'Khách hàng', href: '/clients' },
  { label: 'Dự báo', href: '/forecast' },
  { label: 'Tài liệu', href: '/documents' },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1a1a1a] bg-black/95 backdrop-blur">
      <div className="flex h-14 items-center gap-4 px-4">
        {/* Logo */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#DFFF00]">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            {[0,1,2,3].map(row =>
              [0,1,2,3].map(col => (
                <circle
                  key={`${row}-${col}`}
                  cx={2 + col * 4}
                  cy={2 + row * 4}
                  r="1"
                  fill="#000"
                  opacity={(row + col) % 3 === 0 ? 1 : 0.4}
                />
              ))
            )}
          </svg>
        </div>

        {/* Nav Links */}
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ label, href }) => {
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

        {/* Add button */}
        <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#111] text-[#888] transition-all hover:border-[#DFFF00]/50 hover:bg-[#DFFF00] hover:text-black">
          <Plus size={16} />
        </button>

        {/* Avatar */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-bold text-black">
          JD
        </div>
      </div>
    </header>
  );
}
