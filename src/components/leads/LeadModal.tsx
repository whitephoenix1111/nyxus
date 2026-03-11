'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { OpportunityStatus } from '@/types';

export type LeadFormState = {
  clientName: string;
  company: string;
  avatar: string;
  email: string;
  value: string;
  confidence: string;
  date: string;
  lastContactDate: string;
  notes: string;
  status: OpportunityStatus;
};

export const emptyLeadForm = (): LeadFormState => ({
  clientName: '',
  company: '',
  avatar: '',
  email: '',
  value: '',
  confidence: '30',
  date: new Date().toISOString().slice(0, 10),
  lastContactDate: new Date().toISOString().slice(0, 10),
  notes: '',
  status: 'Lead',
});

const inputCls = 'w-full rounded-xl bg-[#0a0a0a] border px-3 py-2 text-sm text-white focus:outline-none transition-colors';
const labelCls = 'block text-xs text-[#555] mb-1 uppercase tracking-widest';

function Field({
  label, error, children,
}: {
  label: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className={labelCls}>{label}</label>
      {children}
      {error && (
        <p className="text-xs text-[#EF4444] mt-0.5">{error}</p>
      )}
    </div>
  );
}

export function LeadModal({ initial, title, onClose, onSave }: {
  initial: LeadFormState;
  title: string;
  onClose: () => void;
  onSave: (f: LeadFormState) => void;
}) {
  const [form, setForm]     = useState<LeadFormState>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof LeadFormState, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof LeadFormState, boolean>>>({});

  // Generic onChange — mỗi field chỉ update đúng key của nó
  const handle = (k: keyof LeadFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm(prev => ({ ...prev, [k]: e.target.value }));
      setTouched(prev => ({ ...prev, [k]: true }));
      // Clear error khi bắt đầu nhập
      if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }));
    };

  function validate(): boolean {
    const e: Partial<Record<keyof LeadFormState, string>> = {};
    if (!form.clientName.trim()) e.clientName = 'Tên khách hàng không được để trống';
    if (!form.company.trim())    e.company    = 'Công ty không được để trống';
    if (!form.value.trim())      e.value      = 'Giá trị không được để trống';
    else if (isNaN(Number(form.value)) || Number(form.value) <= 0)
                                 e.value      = 'Giá trị phải là số dương';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                 e.email      = 'Email không hợp lệ';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    // Mark tất cả fields là touched khi submit
    setTouched({ clientName: true, company: true, value: true, email: true });
    if (validate()) onSave(form);
  }

  // Border color theo validation state
  const borderFor = (k: keyof LeadFormState) =>
    errors[k] ? 'border-[#EF4444] focus:border-[#EF4444]' : 'border-[#222] focus:border-[#DFFF00]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[#222] bg-[#111] p-6 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose}
            className="rounded-lg p-1.5 text-[#555] hover:bg-[#1a1a1a] hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-2 gap-4">

          {/* Tên khách hàng */}
          <div className="col-span-2">
            <Field label="Tên khách hàng *" error={errors.clientName}>
              <input
                className={`${inputCls} ${borderFor('clientName')}`}
                placeholder="Nguyễn Văn A"
                value={form.clientName}
                onChange={handle('clientName')}
              />
            </Field>
          </div>

          {/* Công ty */}
          <div className="col-span-2">
            <Field label="Công ty *" error={errors.company}>
              <input
                className={`${inputCls} ${borderFor('company')}`}
                placeholder="Tên công ty"
                value={form.company}
                onChange={handle('company')}
              />
            </Field>
          </div>

          {/* Email — field riêng, onChange đúng key */}
          <div>
            <Field label="Email" error={errors.email}>
              <input
                className={`${inputCls} ${borderFor('email')}`}
                type="email"
                placeholder="email@company.com"
                value={form.email}
                onChange={handle('email')}
              />
            </Field>
          </div>

          {/* Giá trị */}
          <div>
            <Field label="Giá trị (USD) *" error={errors.value}>
              <input
                className={`${inputCls} ${borderFor('value')}`}
                type="number"
                min={0}
                placeholder="50000"
                value={form.value}
                onChange={handle('value')}
              />
            </Field>
          </div>

          {/* Ngày tạo */}
          <div>
            <label className={labelCls}>Ngày tạo</label>
            <input
              className={`${inputCls} border-[#222] focus:border-[#DFFF00]`}
              type="date"
              value={form.date}
              onChange={handle('date')}
            />
          </div>

          {/* Liên hệ gần nhất */}
          <div>
            <label className={labelCls}>Liên hệ gần nhất</label>
            <input
              className={`${inputCls} border-[#222] focus:border-[#DFFF00]`}
              type="date"
              value={form.lastContactDate}
              onChange={handle('lastContactDate')}
            />
          </div>

          {/* Ghi chú */}
          <div className="col-span-2">
            <label className={labelCls}>Ghi chú</label>
            <textarea
              className={`${inputCls} border-[#222] focus:border-[#DFFF00] resize-none`}
              rows={2}
              value={form.notes}
              onChange={handle('notes')}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-6">
          <button onClick={onClose}
            className="flex-1 rounded-xl border border-[#333] py-2 text-sm text-[#888] hover:bg-[#1a1a1a] hover:text-white transition-colors">
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="flex-1 rounded-xl bg-[#DFFF00] py-2 text-sm font-semibold text-black hover:bg-[#c8e600] transition-colors"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
