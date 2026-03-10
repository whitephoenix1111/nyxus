'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, Check } from 'lucide-react';
import { viIndustry } from './_constants';

// ── SearchInput ────────────────────────────────────────────────────

interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Tìm kiếm...' }: SearchInputProps) {
  return (
    <div
      className="flex items-center gap-2 flex-1 max-w-xs rounded-xl px-3 transition-all"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
      onFocusCapture={e => (e.currentTarget.style.borderColor = 'var(--color-brand)')}
      onBlurCapture={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
    >
      <Search size={13} style={{ color: 'var(--color-text-faint)', flexShrink: 0 }} />
      <input
        className="flex-1 bg-transparent py-2 text-sm outline-none"
        style={{ color: 'var(--color-text-primary)' }}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="transition-colors hover:text-white"
          style={{ color: 'var(--color-text-faint)', flexShrink: 0 }}
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

// ── IndustrySelect ─────────────────────────────────────────────────

interface IndustrySelectProps {
  value: string;
  onChange: (v: string) => void;
  industries: string[];
}

export function IndustrySelect({ value, onChange, industries }: IndustrySelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Đóng khi click ngoài
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const label = value ? viIndustry(value) : 'Tất cả ngành';

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all"
        style={{
          background: open ? 'var(--color-surface-hover)' : 'var(--color-surface)',
          border: open ? '1px solid var(--color-brand)' : '1px solid var(--color-border)',
          color: value ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          minWidth: '140px',
        }}
      >
        <span className="flex-1 text-left text-sm">{label}</span>
        <ChevronDown
          size={13}
          style={{
            color: 'var(--color-text-faint)',
            transition: 'transform 0.15s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 top-[calc(100%+6px)] z-30 min-w-full rounded-xl py-1 shadow-2xl"
          style={{
            background: 'var(--color-neutral-100)',
            border: '1px solid var(--color-border-hover)',
          }}
        >
          {/* Tất cả ngành */}
          <DropdownItem
            label="Tất cả ngành"
            active={value === ''}
            onClick={() => { onChange(''); setOpen(false); }}
          />
          <div className="my-1 h-px mx-2" style={{ background: 'var(--color-border)' }} />
          {industries.map(ind => (
            <DropdownItem
              key={ind}
              label={viIndustry(ind)}
              active={value === ind}
              onClick={() => { onChange(ind); setOpen(false); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DropdownItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-sm transition-colors"
      style={{
        color: active ? 'var(--color-brand)' : 'var(--color-text-secondary)',
        background: 'transparent',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-hover)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <span>{label}</span>
      {active && <Check size={12} style={{ color: 'var(--color-brand)', flexShrink: 0 }} />}
    </button>
  );
}
