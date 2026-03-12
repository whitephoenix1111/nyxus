// OwnerBadge — hiển thị avatar + tên sales owner
// Chỉ render khi isManager=true để không làm rối UI của sales

import { useUserById } from '@/store/useUsersStore';

interface OwnerBadgeProps {
  ownerId: string;
  size?: 'sm' | 'md';
}

export function OwnerBadge({ ownerId, size = 'sm' }: OwnerBadgeProps) {
  const owner = useUserById(ownerId);
  if (!owner) return null;

  const avatarSize = size === 'sm' ? 'h-5 w-5 text-[10px]' : 'h-6 w-6 text-xs';

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`flex shrink-0 items-center justify-center rounded-full font-bold ${avatarSize}`}
        style={{ background: 'var(--color-surface-hover)', color: 'var(--color-brand)' }}
        title={owner.name}
      >
        {owner.avatar.slice(0, 2).toUpperCase()}
      </div>
      {size === 'md' && (
        <span className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>
          {owner.name}
        </span>
      )}
    </div>
  );
}

// Dropdown filter "Theo sales" — dùng ở Manager view
import { useState, useRef, useEffect } from 'react';
import { Users, ChevronDown, Check } from 'lucide-react';
import { useIsManager } from '@/store/useAuthStore';
import { useSalespersons } from '@/store/useUsersStore';

interface OwnerFilterProps {
  value: string;           // ownerId đang chọn, '' = tất cả
  onChange: (id: string) => void;
}

export function OwnerFilter({ value, onChange }: OwnerFilterProps) {
  const isManager    = useIsManager();
  const salespersons = useSalespersons();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Đóng khi click ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!isManager || salespersons.length === 0) return null;

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
        <div className="absolute left-0 top-full mt-1 z-50 min-w-[160px] rounded-xl border border-[#222] bg-[#111] py-1 shadow-xl">
          {/* Tất cả */}
          <button
            onClick={() => { onChange(''); setOpen(false); }}
            className={`flex w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-[#1a1a1a] ${
              !value ? 'text-[#DFFF00]' : 'text-[#888]'
            }`}
          >
            <span>Tất cả sales</span>
            {!value && <Check size={12} />}
          </button>

          {/* Divider */}
          <div className="my-1 border-t border-[#1a1a1a]" />

          {salespersons.map(u => (
            <button
              key={u.id}
              onClick={() => { onChange(u.id); setOpen(false); }}
              className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-sm transition-colors hover:bg-[#1a1a1a] ${
                value === u.id ? 'text-[#DFFF00]' : 'text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[10px] font-bold text-[#DFFF00]">
                  {u.avatar.slice(0, 2).toUpperCase()}
                </div>
                <span>{u.name}</span>
              </div>
              {value === u.id && <Check size={12} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
