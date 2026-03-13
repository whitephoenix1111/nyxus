'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useClientStore } from '@/store/useClientStore';
import { useCurrentUser, useIsManager } from '@/store/useAuthStore';

interface ClientSelectProps {
  value: string;
  onChange: (id: string, name: string, company: string) => void;
  disabled?: boolean;
}

export function ClientSelect({ value, onChange, disabled }: ClientSelectProps) {
  const clients      = useClientStore(s => s.clients);
  const fetchClients = useClientStore(s => s.fetchClients);
  const currentUser  = useCurrentUser();
  const isManager    = useIsManager();

  const activeClients = useMemo(
    () => clients.filter(c =>
      !c.archivedAt &&
      (isManager || c.ownerId === currentUser?.id)
    ),
    [clients, isManager, currentUser]
  );

  useEffect(() => {
    if (clients.length === 0) fetchClients();
  }, [clients.length, fetchClients]);

  const [query, setQuery] = useState('');
  const [open,  setOpen]  = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() =>
    activeClients.filter(c =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.company.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8),
    [activeClients, query]
  );

  const selected = activeClients.find(c => c.id === value);

  if (disabled && selected) {
    return (
      <div className="w-full rounded-lg px-3 py-2.5 text-sm bg-[#0d0d0d] border border-[#1a1a1a] text-[#888]">
        {selected.name} — {selected.company}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm bg-[#111] border border-[#222] text-white hover:border-[#333] transition-colors"
      >
        <span className={selected ? 'text-white' : 'text-[#444]'}>
          {selected ? `${selected.name} — ${selected.company}` : 'Chọn khách hàng…'}
        </span>
        <ChevronDown size={13} className={`text-[#555] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 left-0 top-full mt-1 w-full rounded-xl border border-[#222] bg-[#111] shadow-xl overflow-hidden">
          <div className="p-2 border-b border-[#1a1a1a]">
            <input
              autoFocus
              type="text"
              placeholder="Tìm theo tên hoặc công ty…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-[#0d0d0d] rounded-lg px-3 py-2 text-sm text-white outline-none placeholder:text-[#444]"
            />
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.length > 0 ? filtered.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => { onChange(c.id, c.name, c.company); setOpen(false); setQuery(''); }}
                className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-[#1a1a1a] transition-colors"
              >
                <div className="text-left">
                  <p className="text-white">{c.name}</p>
                  <p className="text-xs text-[#555]">{c.company}</p>
                </div>
                {c.id === value && <Check size={12} className="text-[#DFFF00]" />}
              </button>
            )) : (
              <p className="px-3 py-3 text-sm text-[#555]">Không tìm thấy</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
