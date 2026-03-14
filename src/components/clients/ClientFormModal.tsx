// src/components/clients/ClientFormModal.tsx — Modal tạo mới / chỉnh sửa Client

import { useState } from 'react';
import { X, Plus, UserPlus, Pencil } from 'lucide-react';
import type { Client, ClientTag, StoredClientTag, ClientFormData } from '@/types';
import { Avatar, Field } from './_atoms';
import { ALL_TAGS, TAG_STYLE, TAG_LABELS, INDUSTRIES, viIndustry, getInitials } from './_constants';

// Re-export để caller import `ClientFormData` từ đây mà không cần import trực tiếp từ @/types.
// Giữ dependency của caller vào component thay vì vào types — tiện khi refactor interface.
export type { ClientFormData };

// ── FormState ─────────────────────────────────────────────────────────────────

/**
 * State nội bộ của form — tách biệt với `ClientFormData` (type của API payload).
 *
 * Lý do tách:
 * - `ClientFormData` = `Omit<Client, 'id' | 'createdAt' | 'ownerId'>`,
 *   có field `avatar` (string initials) do hệ thống tính, không do user nhập.
 * - `FormState` chỉ chứa những gì user thực sự gõ vào form — không có `avatar`.
 *   `avatar` được derive từ `name` tại thời điểm submit (xem `handleSubmit`).
 */
type FormState = {
  name: string; company: string; email: string; phone: string;
  industry: string; country: string; website: string; notes: string;
  tags: ClientTag[];
};

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * Giá trị khởi tạo khi mở modal ở mode 'add'.
 * `industry` default là 'Technology' — ngành phổ biến nhất trong tập khách hàng
 * hiện tại, giảm thao tác cho sales khi thêm lead mới.
 * Các field còn lại để trống, không pre-fill, tránh nhầm dữ liệu.
 */
const EMPTY_FORM: FormState = {
  name: '', company: '', email: '', phone: '',
  industry: 'Technology', country: '', website: '', notes: '',
  tags: [],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Map từ `Client` (entity đầy đủ) sang `FormState` (chỉ những field form quản lý).
 * Dùng khi mở modal ở mode 'edit' để pre-fill form với dữ liệu hiện tại.
 *
 * Chủ động list từng field thay vì spread `{ ...client }` để:
 * 1. Đảm bảo không leak các system field (`id`, `ownerId`, `createdAt`, `archivedAt`)
 *    vào FormState — những field này không được phép user chỉnh qua form này.
 * 2. TypeScript báo lỗi tại đây nếu `FormState` có thêm field mà chưa map.
 */
function clientToForm(client: Client): FormState {
  return {
    name: client.name, company: client.company,
    email: client.email, phone: client.phone,
    industry: client.industry, country: client.country,
    website: client.website, notes: client.notes,
    tags: client.tags,
  };
}

// ── Props ─────────────────────────────────────────────────────────────────────

/**
 * @param mode         'add' = tạo mới (form trống); 'edit' = sửa (form pre-fill từ `initialData`)
 * @param initialData  Bắt buộc truyền khi `mode === 'edit'` — client hiện tại để pre-fill
 * @param onClose      Gọi khi user bấm Hủy, nút X, hoặc click backdrop
 * @param onSave       Async callback nhận `ClientFormData` — caller chịu trách nhiệm gọi API
 *                     và cập nhật store. Modal không tự gọi API — giữ component thuần UI.
 */
export interface ClientFormModalProps {
  mode: 'add' | 'edit';
  initialData?: Client;
  onClose: () => void;
  onSave: (data: ClientFormData) => Promise<void>;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Modal dùng chung cho 2 luồng:
 * - Thêm khách hàng mới (`mode='add'`) — xuất hiện trong `/clients` page
 * - Chỉnh sửa thông tin khách hàng (`mode='edit'`) — mở từ DetailPanel
 *
 * Modal này KHÔNG dùng để tạo Lead. Lead tạo riêng qua `LeadModal` vì có thêm
 * bước tạo Opportunity và optional Task đầu tiên (xem workflow trong REFACTOR.md).
 */
export function ClientFormModal({ mode, initialData, onClose, onSave }: ClientFormModalProps) {

  // ── State ────────────────────────────────────────────────────────────────

  const [form, setForm] = useState<FormState>(
    // Nếu mode='edit' và có initialData thì map sang FormState để pre-fill.
    // Guard `&& initialData` cần thiết vì TypeScript cho phép initialData=undefined ở mode='add'.
    mode === 'edit' && initialData ? clientToForm(initialData) : EMPTY_FORM
  );

  // `saving` khóa nút Submit trong khi chờ onSave resolve — tránh double-submit.
  const [saving, setSaving] = useState(false);

  // Per-field error messages — key là tên field trong FormState, value là string lỗi.
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  // ── Derived values ───────────────────────────────────────────────────────

  const isEdit = mode === 'edit';

  /**
   * Avatar preview live — cập nhật khi user gõ tên.
   * Fallback '?' khi name rỗng để Avatar component không render initials lỗi.
   */
  const preview = form.name ? getInitials(form.name) : '?';

  // ── Handlers ─────────────────────────────────────────────────────────────

  /**
   * Cập nhật một field trong FormState và xóa error của field đó ngay lập tức.
   * Xóa error on-change (thay vì chờ re-validate) để UX phản hồi nhanh hơn
   * — user thấy lỗi biến mất ngay khi bắt đầu sửa, không phải sau khi submit lại.
   */
  function setField(field: keyof FormState, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
  }

  /**
   * Toggle một tag trong danh sách tags của form.
   * Nếu tag đã có → xóa; nếu chưa có → thêm vào cuối.
   *
   * Lưu ý: form dùng `ALL_TAGS` (gồm cả computed tags: warm, cold, new-lead, priority).
   * Tags này thông thường được tính tự động bởi `computeClientTags`, không lưu DB.
   * Tuy nhiên nếu user gán thủ công qua đây, giá trị sẽ được persist vào `client.tags[]`.
   * Khi render, computed tags từ logic sẽ merge với tags lưu DB — không bị override nhau.
   */
  function toggleTag(tag: ClientTag) {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
    }));
  }

  /**
   * Validate form trước khi submit.
   * Chỉ 3 field bắt buộc: name, company, email.
   * Phone, industry, country, website, notes là tùy chọn — có thể bổ sung sau.
   *
   * Email dùng regex tối giản `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` —
   * đủ để catch typo phổ biến mà không reject edge-case hợp lệ hiếm gặp.
   *
   * @returns `true` nếu không có lỗi — safe to submit
   */
  function validate() {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim())    e.name    = 'Bắt buộc';
    if (!form.company.trim()) e.company = 'Bắt buộc';
    if (!form.email.trim())   e.email   = 'Bắt buộc';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email không hợp lệ';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /**
   * Submit form: validate → lock UI → gọi onSave → unlock → đóng modal.
   *
   * Một số lưu ý quan trọng:
   * - Tất cả string field được `.trim()` trước khi truyền lên — loại bỏ whitespace thừa
   *   mà user vô tình nhập, tránh dữ liệu bẩn trong DB.
   * - `avatar` được tính tại đây từ `form.name` (initials), không phải do user upload.
   *   System không hỗ trợ upload ảnh — avatar luôn là 2 ký tự text.
   * - `setSaving(false)` và `onClose()` gọi sau `await onSave()` dù thành công hay lỗi
   *   (không có try/catch ở đây). Caller's `onSave` chịu trách nhiệm handle lỗi riêng
   *   (ví dụ hiển thị toast error) trước khi reject — modal sẽ đóng trong mọi trường hợp.
   */
  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    await onSave({
      name: form.name.trim(), company: form.company.trim(),
      email: form.email.trim(), phone: form.phone.trim(),
      industry: form.industry, country: form.country.trim(),
      website: form.website.trim(), notes: form.notes.trim(),
      // Filter ra computed tags (warm, cold, new-lead, priority) trước khi gửi lên API —
      // client.tags chỉ lưu StoredClientTag ('enterprise' | 'mid-market').
      // Computed tags được tính lại tại render, không persist vào DB.
      tags: form.tags.filter((t): t is StoredClientTag => t === 'enterprise' || t === 'mid-market'),
      // avatar derive từ name — 2 initials viết hoa, VD: "Nguyễn Văn A" → "NV"
      avatar: getInitials(form.name),
    });
    setSaving(false);
    onClose();
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop — z-40, thấp hơn modal content (z-50) nhưng cao hơn page content.
          onClick đóng modal khi click ra ngoài — UX quen thuộc. */}
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[3px]" onClick={onClose} />

      {/* Modal container — căn giữa màn hình, giới hạn max-h-[90vh] để không bị
          cắt trên màn hình nhỏ, overflow-y-auto trên phần body cho phép scroll nội dung. */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
          style={{ background: 'var(--color-neutral-50)', border: '1px solid var(--color-border-hover)' }}>

          {/* ── Header ──────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-6 py-4 shrink-0"
            style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-3">
              {/* Icon phân biệt mode: Pencil = edit, UserPlus = add */}
              <div className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: 'var(--color-brand-muted)', border: '1px solid var(--color-brand-border)' }}>
                {isEdit
                  ? <Pencil size={14} style={{ color: 'var(--color-brand)' }} />
                  : <UserPlus size={14} style={{ color: 'var(--color-brand)' }} />}
              </div>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {isEdit ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}
                </h2>
                {/* Subtitle: mode edit hiển thị tên client đang sửa để tránh nhầm */}
                <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                  {isEdit ? `Đang sửa: ${initialData?.name}` : 'Điền thông tin bên dưới'}
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

            {/* Avatar preview live — cập nhật real-time khi user gõ name/company.
                Giúp sales xem trước avatar sẽ hiển thị trong danh sách client. */}
            <div className="flex items-center gap-3 py-1">
              <Avatar initials={preview} size="lg" />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {/* Fallback khi name chưa nhập — dùng span thay vì string để style riêng */}
                  {form.name || <span style={{ color: 'var(--color-text-disabled)' }}>Tên khách hàng</span>}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                  {form.company || 'Tên công ty'}
                </p>
              </div>
            </div>

            {/* Row 1: Tên + Công ty — 2 field required, đặt cạnh nhau vì liên quan mật thiết */}
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
                {/* Phone không required — nhiều lead B2B chỉ có email ban đầu */}
                <input className="input-base w-full" placeholder="+84 90 123 4567"
                  value={form.phone} onChange={e => setField('phone', e.target.value)} />
              </Field>
            </div>

            {/* Row 3: Ngành (select từ INDUSTRIES list) + Quốc gia (text tự do) */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ngành">
                {/* INDUSTRIES lưu key tiếng Anh trong DB; viIndustry() dịch sang VI khi hiển thị */}
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
              {/* Lưu dạng text tự do — không validate URL format vì nhiều client
                  nhập không có https://, validate cứng sẽ gây friction không cần thiết */}
              <input className="input-base w-full" placeholder="company.com"
                value={form.website} onChange={e => setField('website', e.target.value)} />
            </Field>

            {/* ── Tags ──────────────────────────────────────────────────────── */}
            <div>
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-faint)' }}>Tags</p>
              <div className="flex flex-wrap gap-2">
                {/*
                 * Render toàn bộ ALL_TAGS (6 tags) — bao gồm cả computed tags
                 * (warm, cold, new-lead, priority) lẫn manual tags (enterprise, mid-market).
                 *
                 * Trong kiến trúc chuẩn, computed tags không lưu DB mà được tính tại render.
                 * Tuy nhiên, cho phép gán thủ công ở đây để sales có thể override khi cần
                 * (VD: mark "warm" cho lead mới liên hệ ngoài luồng).
                 * Nếu tag đã được tính bởi computeClientTags, việc lưu thêm vào DB không tạo
                 * conflict — kết quả merge vẫn hiển thị đúng.
                 */}
                {ALL_TAGS.map(tag => {
                  const s = TAG_STYLE[tag];
                  const active = form.tags.includes(tag);
                  return (
                    <button key={tag} onClick={() => toggleTag(tag)}
                      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-all"
                      style={{
                        // Active: màu đặc trưng của tag; Inactive: mờ để không gây distraction
                        background: active ? s.bg : 'var(--color-surface)',
                        color: active ? s.text : 'var(--color-text-disabled)',
                        border: active ? `1px solid ${s.text}44` : '1px solid var(--color-border)',
                        // opacity 0.7 khi inactive thay vì ẩn — user vẫn thấy các option có sẵn
                        opacity: active ? 1 : 0.7,
                      }}>
                      {/* Checkmark chỉ hiển thị khi active — xác nhận trạng thái đã chọn */}
                      {active && <span className="mr-1">✓</span>}
                      {TAG_LABELS[tag]}
                    </button>
                  );
                })}
              </div>
            </div>

            <Field label="Ghi chú">
              {/* Textarea resize-none để không phá layout modal khi kéo giãn */}
              <textarea className="input-base w-full resize-none" rows={3}
                placeholder="Ghi chú nội bộ về khách hàng này..."
                value={form.notes} onChange={e => setField('notes', e.target.value)} />
            </Field>
          </div>

          {/* ── Footer actions ───────────────────────────────────────────────── */}
          {/* shrink-0 giữ footer luôn visible dù body dài — không bị đẩy ra ngoài max-h */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 shrink-0"
            style={{ borderTop: '1px solid var(--color-border)' }}>
            <button onClick={onClose} className="btn-ghost text-sm px-4 py-2">Hủy</button>
            <button onClick={handleSubmit} disabled={saving}
              className="btn-primary flex items-center gap-2 px-4 py-2 disabled:opacity-60">
              {/* Spinner thay icon khi đang lưu — feedback rõ ràng không cần text "loading" */}
              {saving
                ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                : isEdit ? <Pencil size={13} /> : <Plus size={13} />}
              {saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Thêm khách hàng'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
