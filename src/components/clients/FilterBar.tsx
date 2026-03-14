// src/components/clients/FilterBar.tsx — Các component filter dùng trong trang /clients
// Gồm 2 component export: SearchInput (ô tìm kiếm) và IndustrySelect (dropdown ngành).
// DropdownItem là helper nội bộ, không export.

'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, Check } from 'lucide-react';
import { viIndustry } from './_constants';

// ── SearchInput ───────────────────────────────────────────────────────────────

interface SearchInputProps {
  value: string;
  /** Callback mỗi khi text thay đổi — caller giữ state, component là controlled */
  onChange: (v: string) => void;
  placeholder?: string;
}

/**
 * Ô tìm kiếm controlled với nút clear (×) và highlight border khi focus.
 *
 * Dùng `onFocusCapture` / `onBlurCapture` thay vì CSS `:focus-within` vì:
 * - CSS `:focus-within` không thể truy cập CSS variable (`var(--color-brand)`)
 *   từ stylesheet ngoài mà không cần custom property trên element cha.
 * - Imperative style mutation trực tiếp trên `e.currentTarget` giúp reuse
 *   màu từ design token mà không phải hardcode hex trong CSS.
 *
 * Capture phase (`FocusCapture`) được dùng thay vì bubble phase để đảm bảo
 * border đổi màu ngay khi focus vào bất kỳ child nào (input bên trong),
 * không chỉ khi div cha được focus trực tiếp.
 */
export function SearchInput({ value, onChange, placeholder = 'Tìm kiếm...' }: SearchInputProps) {
  return (
    <div
      className="flex items-center gap-2 flex-1 max-w-xs rounded-xl px-3 transition-all"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
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
      {/* Nút clear — chỉ hiện khi có text, gọi onChange('') để reset state ở caller */}
      {value && (
        <button onClick={() => onChange('')} className="transition-colors hover:text-white"
          style={{ color: 'var(--color-text-faint)', flexShrink: 0 }}>
          <X size={12} />
        </button>
      )}
    </div>
  );
}

// ── IndustrySelect ────────────────────────────────────────────────────────────

interface IndustrySelectProps {
  /** Key tiếng Anh của ngành đang được chọn, hoặc '' nếu chưa filter */
  value: string;
  /** Callback khi user chọn ngành — truyền key tiếng Anh, '' = "Tất cả" */
  onChange: (v: string) => void;
  /** Danh sách key ngành tiếng Anh — thường lấy từ `useClientIndustries()` */
  industries: string[];
}

/**
 * Dropdown chọn ngành với click-outside để đóng.
 *
 * Dùng custom dropdown thay vì `<select>` native vì:
 * - `<select>` native không thể style nhất quán cross-browser với dark theme.
 * - Cần hiển thị nhãn tiếng Việt (qua `viIndustry`) trong cả trigger và options,
 *   trong khi value truyền đi vẫn là key tiếng Anh (để filter theo `client.industry`).
 *
 * Click-outside dùng `mousedown` (không phải `click`) để đóng dropdown vì:
 * - `mousedown` xảy ra trước `click` — nếu user nhấn vào item trong dropdown,
 *   `mousedown` sẽ không phải "outside" nên dropdown không đóng trước khi
 *   `onClick` của item kịp fire.
 * - Dùng `click` sẽ có race condition: dropdown đóng trước khi item nhận được event.
 */
export function IndustrySelect({ value, onChange, industries }: IndustrySelectProps) {
  const [open, setOpen] = useState(false);

  // ref trỏ vào wrapper div để kiểm tra click có nằm trong component không
  const ref = useRef<HTMLDivElement>(null);

  // ── Click-outside handler ────────────────────────────────────────────────
  useEffect(() => {
    function handler(e: MouseEvent) {
      // Đóng dropdown khi click bên ngoài wrapper div
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    // Cleanup khi component unmount để tránh memory leak và stale closure
    return () => document.removeEventListener('mousedown', handler);
  }, []); // deps rỗng: handler không phụ thuộc vào state/props, chỉ cần đăng ký một lần

  // ── Derived ─────────────────────────────────────────────────────────────
  // Hiển thị nhãn tiếng Việt khi đã chọn, fallback "Tất cả ngành" khi chưa filter
  const label = value ? viIndustry(value) : 'Tất cả ngành';

  return (
    <div ref={ref} className="relative">

      {/* Trigger button — style thay đổi theo trạng thái open và có value */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all"
        style={{
          // Khi open: nền đậm hơn + border brand — phản hồi trạng thái active rõ ràng
          background: open ? 'var(--color-surface-hover)' : 'var(--color-surface)',
          border: open ? '1px solid var(--color-brand)' : '1px solid var(--color-border)',
          // Khi đã chọn ngành: text đậm hơn để thể hiện filter đang active
          color: value ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          minWidth: '140px',
        }}
      >
        <span className="flex-1 text-left text-sm">{label}</span>
        {/* Chevron xoay 180° khi open — CSS transition trực tiếp trên style inline
            vì giá trị phụ thuộc vào `open` state, không thể dùng Tailwind class động */}
        <ChevronDown size={13} style={{
          color: 'var(--color-text-faint)',
          transition: 'transform 0.15s',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        }} />
      </button>

      {/* Dropdown panel — chỉ render khi open, không dùng visibility/opacity ẩn
          để tránh panel vô hình vẫn nhận click khi đóng */}
      {open && (
        <div
          className="absolute left-0 top-[calc(100%+6px)] z-30 min-w-full w-max rounded-xl py-1 shadow-2xl"
          style={{ background: 'var(--color-neutral-100)', border: '1px solid var(--color-border-hover)' }}
          // z-30: cao hơn page content nhưng thấp hơn backdrop (z-40) và modal (z-50)
          // w-max: panel rộng theo nội dung dài nhất — tránh truncate tên ngành dài
        >
          {/* Option "Tất cả ngành" — reset filter về '' */}
          <DropdownItem label="Tất cả ngành" active={value === ''} onClick={() => { onChange(''); setOpen(false); }} />

          {/* Divider ngăn cách option "Tất cả" với danh sách ngành cụ thể */}
          <div className="my-1 h-px mx-2" style={{ background: 'var(--color-border)' }} />

          {/* Danh sách ngành — hiển thị nhãn VI nhưng truyền key EN lên onChange */}
          {industries.map(ind => (
            <DropdownItem key={ind} label={viIndustry(ind)} active={value === ind}
              onClick={() => { onChange(ind); setOpen(false); }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── DropdownItem ──────────────────────────────────────────────────────────────

/**
 * Item nội bộ dùng trong IndustrySelect dropdown.
 * Không export — chỉ dùng trong file này.
 *
 * Hover dùng `onMouseEnter`/`onMouseLeave` thay vì CSS `:hover` cùng lý do với
 * SearchInput: cần truy cập CSS variable `--color-surface-hover` trong inline style.
 * Tailwind không có class động cho giá trị từ design token.
 */
function DropdownItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-sm transition-colors"
      style={{ color: active ? 'var(--color-brand)' : 'var(--color-text-secondary)', background: 'transparent' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-hover)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <span className="whitespace-nowrap">{label}</span>
      {/* Check icon chỉ hiện khi active — xác nhận option đang được chọn */}
      {active && <Check size={12} style={{ color: 'var(--color-brand)', flexShrink: 0 }} />}
    </button>
  );
}
