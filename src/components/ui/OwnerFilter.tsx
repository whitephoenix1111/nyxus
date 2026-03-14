// src/components/ui/OwnerFilter.tsx
// Dropdown "Lọc theo sales" — chỉ hiện với Manager (guard bên trong).
// Dùng ở mọi trang cần ownerFilter: Dashboard, Leads, Clients, Activities, Documents.
//
// Props:
//   value    — ownerId đang chọn; '' = "Tất cả sales"
//   onChange — callback khi chọn sales mới

'use client';

import { useState, useRef, useEffect } from 'react';
import { Users, ChevronDown, Check } from 'lucide-react';
import { useIsManager } from '@/store/useAuthStore';
import { useSalespersons } from '@/store/useUsersStore';

interface OwnerFilterProps {
  value: string;
  onChange: (id: string) => void;
}

export function OwnerFilter({ value, onChange }: OwnerFilterProps) {
  const isManager    = useIsManager();
  const salespersons = useSalespersons();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Chỉ Manager mới thấy filter này
  if (!isManager) return null;

  // Hiển thị skeleton khi users chưa load xong
  if (salespersons.length === 0) return (
    <div className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm border border-[#222] bg-[#111] text-[#333]">
      <Users size={13} />
      <span>Đang tải...</span>
    </div>
  );

  const selected = salespersons.find(u => u.id === value);
  const label    = selected ? selected.name : 'Tất cả sales';
  const isActive = !!value;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm transition-colors border ${
          isActive
            ? 'border-[#DFFF0044] bg-[#DFFF0010] text-[#DFFF00]'
            : 'border-[#222] bg-[#111] text-[#555] hover:text-[#888]'
        }`}
      >
        <Users size={13} />
        <span>{label}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 min-w-[180px] w-max rounded-xl border border-[#222] bg-[#111] py-1 shadow-xl">
          {/* Option: Tất cả sales */}
          <button
            onClick={() => { onChange(''); setOpen(false); }}
            className={`flex w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-[#1a1a1a] ${
              !value ? 'text-[#DFFF00]' : 'text-[#888]'
            }`}
          >
            <span>Tất cả sales</span>
            {!value && <Check size={12} />}
          </button>

          <div className="my-1 border-t border-[#1a1a1a]" />

          {salespersons.map(u => (
            <button
              key={u.id}
              onClick={() => { onChange(u.id); setOpen(false); }}
              className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-sm transition-colors hover:bg-[#1a1a1a] ${
                value === u.id ? 'text-[#DFFF00]' : 'text-white'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-5 w-5 shrink-0 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[10px] font-bold text-[#DFFF00]">
                  {u.avatar.slice(0, 2).toUpperCase()}
                </div>
                <span className="whitespace-nowrap">{u.name}</span>
              </div>
              {value === u.id && <Check size={12} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
