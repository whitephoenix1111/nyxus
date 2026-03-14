// src/components/ui/ClientCombobox.tsx
// Combobox tìm kiếm khách hàng — dùng chung cho AddActivityModal và TaskModal.
//
// Props:
//   value             — clientId đang chọn
//   onChange          — callback (clientId, clientName, company)
//   error             — thông báo lỗi hiển thị dưới field
//   allowedClientIds  — nếu truyền vào, chỉ hiển thị các client trong Set này
//                       (dùng cho Sales — chỉ thấy client của mình)
//                       undefined = Manager, thấy tất cả

'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { useClientStore } from '@/store/useClientStore';

interface ClientComboboxProps {
  value: string;
  onChange: (clientId: string, clientName: string, company: string) => void;
  error?: string;
  allowedClientIds?: Set<string>;
}

export function ClientCombobox({ value, onChange, error, allowedClientIds }: ClientComboboxProps) {
  const allClients = useClientStore(s => s.clients);

  // Sales chỉ thấy client mình sở hữu; Manager (allowedClientIds=undefined) thấy tất cả
  const clients = useMemo(() =>
    allowedClientIds
      ? allClients.filter(c => allowedClientIds.has(c.id))
      : allClients,
    [allClients, allowedClientIds]
  );

  const [query, setQuery] = useState('');
  const [open,  setOpen]  = useState(false);
  const ref               = useRef<HTMLDivElement>(null);
  const selected          = clients.find(c => c.id === value);

  // Lọc + giới hạn 10 kết quả để tránh render dài
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return clients.slice(0, 10);
    return clients
      .filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [clients, query]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setQuery(''); }}
        className="input-base w-full flex items-center justify-between gap-2 text-left"
        style={{
          color: selected ? 'var(--color-text-primary)' : 'var(--color-text-disabled)',
          borderColor: error ? 'var(--color-danger)' : undefined,
        }}
      >
        <span className="truncate text-sm">
          {selected ? `${selected.name} — ${selected.company}` : 'Chọn khách hàng...'}
        </span>
        <ChevronDown size={13} style={{ flexShrink: 0, color: 'var(--color-text-faint)' }} />
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1 w-full rounded-xl shadow-xl overflow-hidden"
          style={{ background: 'var(--color-neutral-50)', border: '1px solid var(--color-border-hover)' }}
        >
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <Search size={12} style={{ color: 'var(--color-text-faint)', flexShrink: 0 }} />
            <input
              autoFocus
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'var(--color-text-primary)' }}
              placeholder="Tìm tên hoặc công ty..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>

          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-center" style={{ color: 'var(--color-text-faint)' }}>
                Không tìm thấy khách hàng
              </p>
            ) : filtered.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => { onChange(c.id, c.name, c.company); setOpen(false); setQuery(''); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/5"
                style={{ background: c.id === value ? 'var(--color-brand-muted)' : undefined }}
              >
                <div
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0"
                  style={{ background: 'var(--color-surface)', color: 'var(--color-brand)' }}
                >
                  {c.avatar || c.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {c.name}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--color-text-faint)' }}>
                    {c.company}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
