import { useState } from 'react';
import { X, Plus, UserPlus, Pencil } from 'lucide-react';
import type { Client, ClientTag, ClientFormData } from '@/types';
import { Avatar, Field } from './_atoms';
import { ALL_TAGS, TAG_STYLE, TAG_LABELS, INDUSTRIES, viIndustry, getInitials } from './_constants';

export type { ClientFormData };

type FormState = {
  name: string; company: string; email: string; phone: string;
  industry: string; country: string; website: string; notes: string;
  tags: ClientTag[];
};

const EMPTY_FORM: FormState = {
  name: '', company: '', email: '', phone: '',
  industry: 'Technology', country: '', website: '', notes: '',
  tags: [],
};

function clientToForm(client: Client): FormState {
  return {
    name: client.name, company: client.company,
    email: client.email, phone: client.phone,
    industry: client.industry, country: client.country,
    website: client.website, notes: client.notes,
    tags: client.tags,
  };
}

export interface ClientFormModalProps {
  mode: 'add' | 'edit';
  initialData?: Client;
  onClose: () => void;
  onSave: (data: ClientFormData) => Promise<void>;
}

export function ClientFormModal({ mode, initialData, onClose, onSave }: ClientFormModalProps) {
  const [form, setForm] = useState<FormState>(
    mode === 'edit' && initialData ? clientToForm(initialData) : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const isEdit = mode === 'edit';
  const preview = form.name ? getInitials(form.name) : '?';

  function setField(field: keyof FormState, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
  }

  function toggleTag(tag: ClientTag) {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
    }));
  }

  function validate() {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim())    e.name    = 'Bắt buộc';
    if (!form.company.trim()) e.company = 'Bắt buộc';
    if (!form.email.trim())   e.email   = 'Bắt buộc';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email không hợp lệ';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    await onSave({
      name: form.name.trim(), company: form.company.trim(),
      email: form.email.trim(), phone: form.phone.trim(),
      industry: form.industry, country: form.country.trim(),
      website: form.website.trim(), notes: form.notes.trim(),
      tags: form.tags, avatar: getInitials(form.name),
    });
    setSaving(false);
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[3px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
          style={{ background: 'var(--color-neutral-50)', border: '1px solid var(--color-border-hover)' }}>

          <div className="flex items-center justify-between px-6 py-4 shrink-0"
            style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-3">
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

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
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

            <div className="grid grid-cols-2 gap-3">
              <Field label="Ngành">
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

            <div>
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-faint)' }}>Tags</p>
              <div className="flex flex-wrap gap-2">
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
                      {TAG_LABELS[tag]}
                    </button>
                  );
                })}
              </div>
            </div>

            <Field label="Ghi chú">
              <textarea className="input-base w-full resize-none" rows={3}
                placeholder="Ghi chú nội bộ về khách hàng này..."
                value={form.notes} onChange={e => setField('notes', e.target.value)} />
            </Field>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 shrink-0"
            style={{ borderTop: '1px solid var(--color-border)' }}>
            <button onClick={onClose} className="btn-ghost text-sm px-4 py-2">Hủy</button>
            <button onClick={handleSubmit} disabled={saving}
              className="btn-primary flex items-center gap-2 px-4 py-2 disabled:opacity-60">
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
