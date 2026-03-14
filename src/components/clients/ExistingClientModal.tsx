// src/components/clients/ExistingClientModal.tsx — Modal import khách hàng đã hợp tác trước đây

import { useState } from 'react';
import { X, UserCheck } from 'lucide-react';
import type { Client } from '@/types';
import { Avatar, Field } from './_atoms';
import { ALL_TAGS, TAG_STYLE, INDUSTRIES, viIndustry, getInitials } from './_constants';

// ── Context & Luồng nghiệp vụ ─────────────────────────────────────────────────
//
// Modal này phục vụ workflow "Import khách hàng cũ" — khác hoàn toàn với LeadModal:
//
//   LeadModal          → POST /api/leads
//                        Client(isProspect=true) + Opportunity(Lead, confidence=15%)
//                        → phải đi qua toàn bộ pipeline trước khi thành client thật
//
//   ExistingClientModal → POST /api/clients/existing
//                        Client(isProspect=false) + Opportunity(Won, confidence=100%)
//                        → bỏ qua pipeline, xuất hiện ngay trong /clients (không qua /leads)
//
// Dùng khi sales cần ghi nhận khách hàng đã ký hợp đồng từ trước khi dùng CRM,
// hoặc import lại khách cũ từ hệ thống khác. Vì đây là Won ngay từ đầu nên
// `statusHistory` sẽ là mảng rỗng (API không tạo lịch sử promote — xem route.ts).

// ── FormState ─────────────────────────────────────────────────────────────────

/**
 * State nội bộ của form. Có 2 điểm khác so với `ClientFormModal.FormState`:
 *
 * 1. Thêm `value: string` — giá trị hợp đồng do user nhập vào input type="number".
 *    Dùng string thay vì number để quản lý controlled input dễ hơn (tránh NaN khi rỗng).
 *    Chuyển sang `Number(value)` khi submit (xem `handleSubmit`).
 *
 * 2. Thêm `contractDate: string` — ngày ký hợp đồng, optional. Nếu để trống,
 *    API fallback về today (xem `contractDate || undefined` trong handleSubmit).
 */
type FormState = {
  name: string; company: string; email: string; phone: string;
  industry: string; country: string; website: string; notes: string;
  tags: Client['tags'];
  value: string;
  contractDate: string;
};

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * Giá trị form mặc định khi modal mở.
 * `industry` mặc định 'Technology' — tương tự ClientFormModal, giảm thao tác cho sales.
 * `value` và `contractDate` để trống — không có giá trị mặc định hợp lý cho 2 field này.
 */
const EMPTY: FormState = {
  name: '', company: '', email: '', phone: '',
  industry: 'Technology', country: '', website: '', notes: '',
  tags: [], value: '', contractDate: '',
};

// ── Props ─────────────────────────────────────────────────────────────────────

/**
 * @param onClose  Gọi khi user bấm Hủy, X, hoặc click backdrop
 * @param onSave   Async callback nhận payload để gọi `addExistingClient` trong store.
 *                 Caller chịu trách nhiệm gọi API — modal chỉ là UI.
 *
 * Lưu ý về payload type:
 * - `name`, `company`, `value` là bắt buộc (validate ở client trước khi onSave được gọi)
 * - Các field còn lại đều optional (`?`) để khớp với API route — cho phép import
 *   khách hàng cũ với thông tin tối giản, bổ sung sau qua ClientFormModal edit.
 * - `value` là `number` trong payload (đã parse từ string form state).
 */
export interface ExistingClientModalProps {
  onClose: () => void;
  onSave: (data: {
    name: string; company: string; email?: string; phone?: string;
    industry?: string; country?: string; website?: string; notes?: string;
    tags?: Client['tags']; value: number; contractDate?: string;
  }) => Promise<unknown>;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ExistingClientModal({ onClose, onSave }: ExistingClientModalProps) {

  // ── State ────────────────────────────────────────────────────────────────

  const [form, setForm] = useState<FormState>(EMPTY);

  // `saving` khóa nút Submit trong khi chờ onSave resolve — tránh double-submit.
  const [saving, setSaving] = useState(false);

  // Per-field errors — key là tên field trong FormState.
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  // ── Derived ──────────────────────────────────────────────────────────────

  // Avatar preview live — '?' khi name chưa nhập để Avatar không render initials lỗi.
  const preview = form.name ? getInitials(form.name) : '?';

  // ── Handlers ─────────────────────────────────────────────────────────────

  /**
   * Cập nhật một field và xóa error của field đó ngay lập tức.
   * Xóa on-change (không chờ submit lại) — UX phản hồi nhanh hơn.
   */
  function setField(field: keyof FormState, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
  }

  /**
   * Toggle tag trong danh sách form.tags.
   * Dùng `Client['tags'][number]` thay vì `ClientTag` để type khớp chính xác
   * với định nghĩa trong `Client` interface mà không cần import thêm.
   */
  function toggleTag(tag: Client['tags'][number]) {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
    }));
  }

  /**
   * Validate trước khi submit. Có 4 required fields — nhiều hơn ClientFormModal (3 fields)
   * vì modal này bắt buộc thêm `value` (giá trị hợp đồng).
   *
   * Logic validate `value`:
   * - Phải không rỗng
   * - Phải là số hợp lệ (isNaN check sau khi Number() parse)
   * - Phải > 0 — Won opportunity với value = 0 không có ý nghĩa nghiệp vụ
   *
   * `contractDate` không validate — optional, API fallback về today nếu thiếu.
   *
   * @returns `true` nếu không có lỗi — safe to submit
   */
  function validate() {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim())    e.name    = 'Bắt buộc';
    if (!form.company.trim()) e.company = 'Bắt buộc';
    if (!form.email.trim())   e.email   = 'Bắt buộc';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email không hợp lệ';
    if (!form.value.trim() || isNaN(Number(form.value)) || Number(form.value) <= 0)
      e.value = 'Nhập giá trị hợp đồng (> 0)';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /**
   * Submit form: validate → lock UI → gọi onSave → unlock → đóng modal.
   *
   * Xử lý 2 điểm đặc thù so với ClientFormModal:
   *
   * 1. `value: Number(form.value)` — parse string → number tại đây.
   *    Đã validate > 0 trước nên Number() sẽ cho kết quả hợp lệ.
   *
   * 2. `contractDate: form.contractDate || undefined` — chuỗi rỗng (user không chọn ngày)
   *    được convert thành `undefined` để API nhận biết và fallback về today.
   *    Nếu truyền chuỗi rỗng `""`, API sẽ dùng làm `date` của Opportunity — sai.
   *
   * Caller's `onSave` (thường là `store.addExistingClient`) chịu trách nhiệm xử lý
   * lỗi API trước khi reject. Modal đóng trong mọi trường hợp sau khi await hoàn tất.
   */
  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    await onSave({
      name:         form.name.trim(),
      company:      form.company.trim(),
      email:        form.email.trim(),
      phone:        form.phone.trim(),
      industry:     form.industry,
      country:      form.country.trim(),
      website:      form.website.trim(),
      notes:        form.notes.trim(),
      tags:         form.tags,
      value:        Number(form.value),
      // Chuỗi rỗng → undefined để API fallback về today thay vì lưu "" vào date field
      contractDate: form.contractDate || undefined,
    });
    setSaving(false);
    onClose();
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop — z-40, click để đóng modal */}
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[3px]" onClick={onClose} />

      {/* Modal container — max-h-[90vh] + overflow-y-auto trên body để scroll nội dung
          mà không đẩy footer ra ngoài màn hình */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
          style={{ background: 'var(--color-neutral-50)', border: '1px solid var(--color-border-hover)' }}>

          {/* ── Header ──────────────────────────────────────────────────────── */}
          {/* shrink-0 giữ header cố định dù body dài */}
          <div className="flex items-center justify-between px-6 py-4 shrink-0"
            style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-3">
              {/* UserCheck icon — phân biệt với LeadModal (UserPlus) và ClientFormModal (UserPlus/Pencil) */}
              <div className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: 'var(--color-brand-muted)', border: '1px solid var(--color-brand-border)' }}>
                <UserCheck size={14} style={{ color: 'var(--color-brand)' }} />
              </div>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Thêm khách hàng hiện có
                </h2>
                {/* Subtitle giải thích ngữ cảnh dùng — phân biệt với "Thêm khách hàng mới" */}
                <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                  Dành cho khách hàng đã hợp tác trước đây
                </p>
              </div>
            </div>
            <button onClick={onClose} className="transition-colors hover:text-white"
              style={{ color: 'var(--color-text-disabled)' }}>
              <X size={16} />
            </button>
          </div>

          {/* ── Body (scrollable) ────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            {/* Avatar preview live — cập nhật khi user gõ name/company */}
            <div className="flex items-center gap-3 py-1">
              <Avatar initials={preview} size="lg" />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {form.name || <span style={{ color: 'var(--color-text-disabled)' }}>Tên khách hàng</span>}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                  {form.company || 'Tên công ty'}
                </p>
              </div>
            </div>

            {/* Row 1: Tên + Công ty — cả 2 required */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tên đầy đủ *" error={errors.name}>
                <input className="input-base w-full" placeholder="Nguyễn Văn A"
                  value={form.name} onChange={e => setField('name', e.target.value)} />
              </Field>
              <Field label="Công ty *" error={errors.company}>
                <input className="input-base w-full" placeholder="Acme Corp"
                  value={form.company} onChange={e => setField('company', e.target.value)} />
              </Field>
            </div>

            {/* Row 2: Email (required) + Phone (optional) */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email *" error={errors.email}>
                <input className="input-base w-full" placeholder="name@company.com" type="email"
                  value={form.email} onChange={e => setField('email', e.target.value)} />
              </Field>
              <Field label="Số điện thoại">
                <input className="input-base w-full" placeholder="+84 90 123 4567"
                  value={form.phone} onChange={e => setField('phone', e.target.value)} />
              </Field>
            </div>

            {/* Row 3: Giá trị hợp đồng (required, > 0) + Ngày ký (optional) —
                Đây là 2 field đặc thù của modal này, không có trong ClientFormModal.
                value dùng type="number" nhưng lưu state dạng string (xem FormState). */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Giá trị hợp đồng (USD) *" error={errors.value}>
                <input className="input-base w-full" placeholder="50000" type="number" min={0}
                  value={form.value} onChange={e => setField('value', e.target.value)} />
              </Field>
              <Field label="Ngày ký hợp đồng">
                {/* Để trống → API dùng today làm date của Opportunity Won.
                    Không đặt default là today ở đây vì nhiều khách hàng cũ
                    có ngày ký không xác định — tránh ghi dữ liệu sai. */}
                <input className="input-base w-full" type="date"
                  value={form.contractDate} onChange={e => setField('contractDate', e.target.value)} />
              </Field>
            </div>

            {/* Row 4: Ngành + Quốc gia — cả 2 optional */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ngành">
                {/* Lưu key tiếng Anh vào DB; viIndustry() dịch sang VI khi hiển thị */}
                <select className="select-base w-full"
                  value={form.industry} onChange={e => setField('industry', e.target.value)}>
                  {INDUSTRIES.map(ind => (
                    <option key={ind} value={ind}>{viIndustry(ind)}</option>
                  ))}
                </select>
              </Field>
              <Field label="Quốc gia">
                <input className="input-base w-full" placeholder="Vietnam"
                  value={form.country} onChange={e => setField('country', e.target.value)} />
              </Field>
            </div>

            <Field label="Website">
              <input className="input-base w-full" placeholder="company.com"
                value={form.website} onChange={e => setField('website', e.target.value)} />
            </Field>

            {/* ── Tags ──────────────────────────────────────────────────────── */}
            <div>
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-faint)' }}>Tags</p>
              <div className="flex flex-wrap gap-2">
                {/*
                 * Hiển thị raw tag key thay vì TAG_LABELS[tag] — khác với ClientFormModal.
                 * Hành vi này có thể là intentional (form nội bộ, audience là sales biết tag key)
                 * hoặc là omission nhỏ. Nếu muốn nhất quán, đổi thành: {TAG_LABELS[tag]}
                 */}
                {ALL_TAGS.map(tag => {
                  const s = TAG_STYLE[tag];
                  const active = form.tags.includes(tag);
                  return (
                    <button key={tag} onClick={() => toggleTag(tag)}
                      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-all"
                      style={{
                        background: active ? s.bg : 'var(--color-surface)',
                        color: active ? s.text : 'var(--color-text-disabled)',
                        border: active ? `1px solid ${s.text}44` : '1px solid var(--color-border)',
                        opacity: active ? 1 : 0.7,
                      }}>
                      {active && <span className="mr-1">✓</span>}
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <Field label="Ghi chú">
              {/* resize-none để tránh user kéo giãn textarea phá layout modal */}
              <textarea className="input-base w-full resize-none" rows={3}
                placeholder="Ghi chú nội bộ..."
                value={form.notes} onChange={e => setField('notes', e.target.value)} />
            </Field>
          </div>

          {/* ── Footer actions ───────────────────────────────────────────────── */}
          {/* shrink-0 giữ footer luôn visible dù body scroll dài */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 shrink-0"
            style={{ borderTop: '1px solid var(--color-border)' }}>
            <button onClick={onClose} className="btn-ghost text-sm px-4 py-2">Hủy</button>
            <button onClick={handleSubmit} disabled={saving}
              className="btn-primary flex items-center gap-2 px-4 py-2 disabled:opacity-60">
              {/* Spinner khi saving — disabled + spinner = không thể double-submit */}
              {saving
                ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                : <UserCheck size={13} />}
              {saving ? 'Đang lưu...' : 'Thêm khách hàng'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
