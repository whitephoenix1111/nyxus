// src/components/documents/ClientSelect.tsx — Searchable dropdown chọn client, dùng trong UploadDocModal
//
// Khác với IndustrySelect (FilterBar.tsx) — chỉ filter danh sách tĩnh từ props,
// ClientSelect tự kết nối store để fetch và scope danh sách theo ownership.

'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useClientStore } from '@/store/useClientStore';
import { useCurrentUser, useIsManager } from '@/store/useAuthStore';

// ── Props ─────────────────────────────────────────────────────────────────────

/**
 * @param value     clientId đang được chọn, '' nếu chưa chọn
 * @param onChange  Callback trả về 3 giá trị (id, name, company) thay vì chỉ id.
 *                  Lý do: Document entity lưu clientName và company dạng denormalized
 *                  (tránh join mỗi khi render danh sách documents). Caller cần cả 3
 *                  để build payload gửi lên API mà không phải lookup lại từ store.
 * @param disabled  Khi true: render read-only, không mở dropdown.
 *                  Dùng khi UploadDocModal được mở từ DetailPanel với prefillClientId —
 *                  không cho phép đổi client sau khi đã pre-fill.
 */
interface ClientSelectProps {
  value: string;
  onChange: (id: string, name: string, company: string) => void;
  disabled?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ClientSelect({ value, onChange, disabled }: ClientSelectProps) {

  // ── Store ────────────────────────────────────────────────────────────────

  const clients      = useClientStore(s => s.clients);
  const fetchClients = useClientStore(s => s.fetchClients);
  const currentUser  = useCurrentUser();
  const isManager    = useIsManager();

  // ── Scoping: lọc client hiển thị trong dropdown ──────────────────────────

  /**
   * Chỉ hiển thị client hợp lệ để gắn document:
   * - Loại `archivedAt`: client đã soft-delete — không thêm tài liệu mới vào client đã xóa.
   * - Ownership filter: Sales chỉ thấy client của mình; Manager thấy tất cả.
   *   Đúng nguyên tắc "ownership nằm ở Client" — không filter qua document.ownerId.
   *
   * Lưu ý: filter này không phân biệt isProspect — sales có thể upload document
   * cho cả Lead (isProspect=true) lẫn Client đã Won (isProspect=false).
   */
  const activeClients = useMemo(
    () => clients.filter(c =>
      !c.archivedAt &&
      (isManager || c.ownerId === currentUser?.id)
    ),
    [clients, isManager, currentUser]
  );

  // ── Lazy fetch ───────────────────────────────────────────────────────────

  /**
   * Chỉ fetch khi store rỗng — tránh refetch mỗi lần component mount.
   * Pattern này giả định store đã được fetch ở trang cha (clients/documents page)
   * trong phần lớn trường hợp. Guard `clients.length === 0` chỉ để đảm bảo
   * component hoạt động đúng khi mount độc lập (VD: test, deep link).
   */
  useEffect(() => {
    if (clients.length === 0) fetchClients();
  }, [clients.length, fetchClients]);

  // ── Local UI state ───────────────────────────────────────────────────────

  const [query, setQuery] = useState('');  // text search trong dropdown
  const [open,  setOpen]  = useState(false);

  // ref cho click-outside — đóng dropdown khi user click ra ngoài wrapper
  const ref = useRef<HTMLDivElement>(null);

  // ── Click-outside handler ────────────────────────────────────────────────

  /**
   * Dùng `mousedown` (không phải `click`) để đóng dropdown:
   * `mousedown` xảy ra trước khi item trong dropdown nhận được `click`,
   * nên khi click vào item, dropdown chưa đóng và item vẫn kịp xử lý sự kiện.
   * Nếu dùng `click`, dropdown đóng trước — item không bao giờ được chọn.
   */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    // Cleanup khi unmount — tránh memory leak và stale closure
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Filtered results ─────────────────────────────────────────────────────

  /**
   * Filter theo name hoặc company, giới hạn 8 kết quả.
   * Cap 8 item: giữ dropdown gọn, tránh render dài khi có nhiều client.
   * Người dùng cần gõ thêm để thu hẹp kết quả nếu chưa thấy client cần tìm.
   */
  const filtered = useMemo(() =>
    activeClients.filter(c =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.company.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8),
    [activeClients, query]
  );

  // Client đang được chọn hiện tại — dùng để hiển thị label trên trigger button
  const selected = activeClients.find(c => c.id === value);

  // ── Disabled mode (read-only) ────────────────────────────────────────────

  /**
   * Khi disabled và đã có client được chọn (pre-filled từ DetailPanel):
   * render div tĩnh thay vì button/dropdown — không thể tương tác.
   * Không render gì nếu disabled nhưng chưa có selected (edge case không nên xảy ra).
   */
  if (disabled && selected) {
    return (
      <div className="w-full rounded-lg px-3 py-2.5 text-sm bg-[#0d0d0d] border border-[#1a1a1a] text-[#888]">
        {selected.name} — {selected.company}
      </div>
    );
  }

  // ── Interactive mode ─────────────────────────────────────────────────────

  return (
    <div ref={ref} className="relative">

      {/* Trigger button — hiển thị client đang chọn hoặc placeholder */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm bg-[#111] border border-[#222] text-white hover:border-[#333] transition-colors"
      >
        <span className={selected ? 'text-white' : 'text-[#444]'}>
          {selected ? `${selected.name} — ${selected.company}` : 'Chọn khách hàng…'}
        </span>
        {/* Chevron xoay khi open — Tailwind class động `rotate-180` hoạt động ở đây
            vì giá trị chỉ là boolean toggle, không cần CSS variable */}
        <ChevronDown size={13} className={`text-[#555] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown panel — chỉ render khi open */}
      {open && (
        <div className="absolute z-50 left-0 top-full mt-1 w-full rounded-xl border border-[#222] bg-[#111] shadow-xl overflow-hidden">

          {/* Search input — autoFocus để user gõ ngay không cần click thêm */}
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

          {/* Results list — max-h-48 + overflow-y-auto để scroll nếu nhiều kết quả */}
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.length > 0 ? filtered.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  // Truyền cả 3 giá trị lên caller để build denormalized payload (xem Props)
                  onChange(c.id, c.name, c.company);
                  setOpen(false);
                  // Reset query sau khi chọn — lần mở sau hiện full list
                  setQuery('');
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-[#1a1a1a] transition-colors"
              >
                <div className="text-left">
                  <p className="text-white">{c.name}</p>
                  <p className="text-xs text-[#555]">{c.company}</p>
                </div>
                {/* Check icon chỉ hiện cho item đang được chọn */}
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
