// src/components/leads/LeadModal.tsx — Modal tạo mới / chỉnh sửa Lead
//
// Tạo mới  → initial = emptyLeadForm()  → POST /api/leads (tạo Client + Opportunity)
//             showFirstTask=true để hiện section lên lịch liên hệ đầu tiên
//
// Chỉnh sửa → initial = map từ Opportunity → PATCH /api/opportunities/[id]
//             chỉ cập nhật title, value, date, notes
//
// Thăng/hạ stage KHÔNG làm ở đây — dùng PromoteModal.

'use client';

import { useState } from 'react';
import { X, CalendarClock } from 'lucide-react';
import type { OpportunityStatus } from '@/types';
import { INDUSTRIES, viIndustry } from '@/components/clients/_constants';

export type LeadFormState = {
  // Dùng khi tạo mới — tạo Client
  clientName: string;
  company:    string;
  avatar:     string;
  email:      string;
  industry:   string;
  // Dùng khi edit — tên deal
  title: string;
  // Chung
  value:      string;
  confidence: string;
  date:       string;
  notes:      string;
  status:     OpportunityStatus;
  // Chỉ khi tạo mới (showFirstTask=true)
  firstTaskTitle: string;
  firstTaskDate:  string;
};

export const emptyLeadForm = (): LeadFormState => ({
  clientName: '',
  company:    '',
  avatar:     '',
  email:      '',
  // 'Technology' là default nhất quán với ClientFormModal
  industry:   'Technology',
  title:      '',
  value:      '',
  confidence: '30',
  date:       new Date().toISOString().slice(0, 10),
  notes:      '',
  status:     'Lead',
  firstTaskTitle: '',
  firstTaskDate:  '',
});

const inputCls = 'w-full rounded-xl bg-[#0a0a0a] border px-3 py-2 text-sm text-white focus:outline-none transition-colors';
const labelCls = 'block text-xs text-[#555] mb-1 uppercase tracking-widest';

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className={labelCls}>{label}</label>
      {children}
      {error && <p className="text-xs text-[#EF4444] mt-0.5">{error}</p>}
    </div>
  );
}

export function LeadModal({ initial, title, onClose, onSave, showFirstTask = false }: {
  initial: LeadFormState;
  title: string;
  onClose: () => void;
  onSave: (f: LeadFormState) => void;
  showFirstTask?: boolean;
}) {
  const [form, setForm]     = useState<LeadFormState>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof LeadFormState, string>>>({});
  const [, setTouched]      = useState<Partial<Record<keyof LeadFormState, boolean>>>({});

  const handle = (k: keyof LeadFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm(prev => ({ ...prev, [k]: e.target.value }));
      setTouched(prev => ({ ...prev, [k]: true }));
      if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }));
    };

  function validate(): boolean {
    const e: Partial<Record<keyof LeadFormState, string>> = {};
    if (showFirstTask) {
      // Tạo mới — validate clientName, company
      if (!form.clientName.trim()) e.clientName = 'Tên khách hàng không được để trống';
      if (!form.company.trim())    e.company    = 'Công ty không được để trống';
    } else {
      // Edit — validate title
      if (!form.title.trim()) e.title = 'Tên deal không được để trống';
    }
    if (!form.value.trim())                                       e.value = 'Giá trị không được để trống';
    else if (isNaN(Number(form.value)) || Number(form.value) <= 0) e.value = 'Giá trị phải là số dương';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email không hợp lệ';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    setTouched({ clientName: true, company: true, title: true, value: true, email: true });
    if (validate()) onSave(form);
  }

  const borderFor = (k: keyof LeadFormState) =>
    errors[k] ? 'border-[#EF4444] focus:border-[#EF4444]' : 'border-[#222] focus:border-[#DFFF00]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[#222] bg-[#111] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose}
            className="rounded-lg p-1.5 text-[#555] hover:bg-[#1a1a1a] hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {showFirstTask ? (
            // ── Tạo mới: nhập thông tin Client ──────────────────────────────
            <>
              <div className="col-span-2">
                <Field label="Tên khách hàng *" error={errors.clientName}>
                  <input className={`${inputCls} ${borderFor('clientName')}`}
                    placeholder="Nguyễn Văn A" value={form.clientName} onChange={handle('clientName')} />
                </Field>
              </div>
              <div className="col-span-2">
                <Field label="Công ty *" error={errors.company}>
                  <input className={`${inputCls} ${borderFor('company')}`}
                    placeholder="Tên công ty" value={form.company} onChange={handle('company')} />
                </Field>
              </div>
              <div className="col-span-2">
                <Field label="Email" error={errors.email}>
                  <input className={`${inputCls} ${borderFor('email')}`}
                    type="email" placeholder="email@company.com" value={form.email} onChange={handle('email')} />
                </Field>
              </div>
              <div className="col-span-2">
                {/* industry: English key lưu DB, dịch sang VI ở UI — nhất quán với ClientFormModal */}
                <Field label="Ngành">
                  <select className={`${inputCls} border-[#222] focus:border-[#DFFF00] appearance-none`}
                    value={form.industry} onChange={handle('industry')}>
                    {INDUSTRIES.map(ind => (
                      <option key={ind} value={ind}>{viIndustry(ind)}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </>
          ) : (
            // ── Edit: chỉ đổi tên deal ────────────────────────────────────
            <div className="col-span-2">
              <Field label="Tên deal *" error={errors.title}>
                <input className={`${inputCls} ${borderFor('title')}`}
                  placeholder="Ví dụ: Enterprise Deal Q3" value={form.title} onChange={handle('title')} />
              </Field>
            </div>
          )}

          <div>
            <Field label="Giá trị (USD) *" error={errors.value}>
              <input className={`${inputCls} ${borderFor('value')}`}
                type="number" min={0} placeholder="50000"
                value={form.value} onChange={handle('value')} />
            </Field>
          </div>

          <div>
            <div className={labelCls}>Ngày tạo deal</div>
            <input className={`${inputCls} border-[#222] focus:border-[#DFFF00]`}
              type="date" value={form.date} onChange={handle('date')} />
          </div>

          <div className="col-span-2">
            <label className={labelCls}>Ghi chú</label>
            <textarea className={`${inputCls} border-[#222] focus:border-[#DFFF00] resize-none`}
              rows={2} value={form.notes} onChange={handle('notes')} />
          </div>
        </div>

        {showFirstTask && (
          <div className="mt-5 rounded-xl border border-[#1e2a00] bg-[#111f00] p-4">
            <div className="flex items-center gap-2 mb-3">
              <CalendarClock size={13} className="text-[#DFFF00]" />
              <span className="text-xs font-semibold text-[#DFFF00] uppercase tracking-widest">
                Lên lịch liên hệ đầu tiên
              </span>
              <span className="text-xs text-[#555]">(tùy chọn)</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Nội dung task</label>
                <input className={`${inputCls} border-[#2a3a00] focus:border-[#DFFF00]`}
                  placeholder="Gọi điện giới thiệu, gửi email chào hàng..."
                  value={form.firstTaskTitle} onChange={handle('firstTaskTitle')} />
              </div>
              <div>
                <label className={labelCls}>Ngày đến hạn</label>
                <input className={`${inputCls} border-[#2a3a00] focus:border-[#DFFF00]`}
                  type="date" value={form.firstTaskDate} onChange={handle('firstTaskDate')} />
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-6">
          <button onClick={onClose}
            className="flex-1 rounded-xl border border-[#333] py-2 text-sm text-[#888] hover:bg-[#1a1a1a] hover:text-white transition-colors">
            Hủy
          </button>
          <button onClick={handleSave}
            className="flex-1 rounded-xl bg-[#DFFF00] py-2 text-sm font-semibold text-black hover:bg-[#c8e600] transition-colors">
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
