// src/components/clients/AddDealModal.tsx — Modal thêm deal mới cho client đã tồn tại
//
// Dùng khi client đã có ít nhất 1 deal trước đó và muốn mở thêm cơ hội mới
// (upsell, renewal, new product line). Khác LeadModal ở chỗ: client đã biết,
// chỉ cần nhập thông tin deal — không tạo client mới.
//
// Flow: Form → POST /api/opportunities → addOpportunity(store) → onSave(newOpp)
// ownerId được inject từ client.ownerId tại API layer — không truyền từ đây.
'use client';

import { useState } from 'react';
import { X, Plus, Briefcase } from 'lucide-react';
import type { Opportunity, OpportunityStatus } from '@/types';
import { STAGE_DEFAULT_CONFIDENCE } from '@/types';
import { Field } from './_atoms';
import { STATUS_LABELS } from './_constants';
import { useOpportunityStore } from '@/store/useOpportunityStore';

// Stage có thể chọn khi tạo mới — không cho chọn Won/Lost ngay từ đầu
const CREATABLE_STAGES: OpportunityStatus[] = ['Lead', 'Qualified', 'Proposal', 'Negotiation'];

interface AddDealModalProps {
  clientId: string;
  clientName: string;
  onClose: () => void;
  /** Callback sau khi deal được tạo thành công — caller dùng để invalidate/refetch */
  onSave: (opp: Opportunity) => void;
}

const EMPTY_FORM = {
  title:      '',
  value:      '',
  status:     'Lead' as OpportunityStatus,
  notes:      '',
};

export function AddDealModal({ clientId, clientName, onClose, onSave }: AddDealModalProps) {
  const { addOpportunity } = useOpportunityStore();

  const [form,   setForm]   = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  function setField(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
  }

  function validate() {
    const e: typeof errors = {};
    if (!form.title.trim())              e.title = 'Bắt buộc';
    if (!form.value || Number(form.value) <= 0) e.value = 'Phải là số dương';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);

    try {
      const res = await fetch('/api/opportunities', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          title:      form.title.trim(),
          value:      Number(form.value),
          status:     form.status,
          confidence: STAGE_DEFAULT_CONFIDENCE[form.status],
          notes:      form.notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        setErrors({ title: 'Lưu thất bại, thử lại.' });
        setSaving(false);
        return;
      }

      const newOpp: Opportunity = await res.json();
      // Cập nhật store ngay lập tức — không cần refetch toàn bộ
      addOpportunity(newOpp);
      onSave(newOpp);
    } catch {
      setErrors({ title: 'Lỗi kết nối, thử lại.' });
      setSaving(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-[3px]" onClick={onClose} />
      <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl shadow-2xl flex flex-col"
          style={{ background: 'var(--color-neutral-50)', border: '1px solid var(--color-border-hover)' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 shrink-0"
            style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: 'var(--color-brand-muted)', border: '1px solid var(--color-brand-border)' }}>
                <Briefcase size={14} style={{ color: 'var(--color-brand)' }} />
              </div>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Thêm cơ hội mới
                </h2>
                <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                  {clientName}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="transition-colors hover:text-white"
              style={{ color: 'var(--color-text-disabled)' }}>
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">

            <Field label="Tên cơ hội *" error={errors.title}>
              <input
                className="input-base w-full"
                placeholder="VD: Gói Enterprise Q3, Renewal 2026..."
                value={form.title}
                onChange={e => setField('title', e.target.value)}
                autoFocus
              />
            </Field>

            <Field label="Giá trị (USD) *" error={errors.value}>
              <input
                className="input-base w-full"
                type="number"
                min={1}
                placeholder="0"
                value={form.value}
                onChange={e => setField('value', e.target.value)}
              />
            </Field>

            <Field label="Giai đoạn">
              {/* Stage selector dạng chip — giống LeadModal */}
              <div className="flex flex-wrap gap-2">
                {CREATABLE_STAGES.map(s => {
                  const active = form.status === s;
                  return (
                    <button key={s} type="button"
                      onClick={() => setField('status', s)}
                      className="rounded-xl px-3 py-1.5 text-xs font-medium transition-all"
                      style={{
                        background: active ? 'var(--color-brand-muted)' : 'var(--color-surface)',
                        color:      active ? 'var(--color-brand)'       : 'var(--color-text-disabled)',
                        border:     active ? '1px solid var(--color-brand-border)' : '1px solid var(--color-border)',
                      }}>
                      {STATUS_LABELS[s]}
                    </button>
                  );
                })}
              </div>
              {/* Confidence mặc định theo stage — info nhẹ, không cần Field riêng */}
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-faint)' }}>
                Độ tin cậy mặc định: {STAGE_DEFAULT_CONFIDENCE[form.status]}%
              </p>
            </Field>

            <Field label="Ghi chú (tùy chọn)">
              <textarea
                className="input-base w-full resize-none"
                rows={3}
                placeholder="Thông tin thêm về cơ hội này..."
                value={form.notes}
                onChange={e => setField('notes', e.target.value)}
              />
            </Field>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 shrink-0"
            style={{ borderTop: '1px solid var(--color-border)' }}>
            <button onClick={onClose} className="btn-ghost text-sm px-4 py-2">Hủy</button>
            <button onClick={handleSubmit} disabled={saving}
              className="btn-primary flex items-center gap-2 px-4 py-2 disabled:opacity-60">
              {saving
                ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                : <Plus size={13} />}
              {saving ? 'Đang lưu...' : 'Tạo cơ hội'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
