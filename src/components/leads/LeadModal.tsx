'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { OpportunityStatus } from '@/types';

export type LeadFormState = {
  clientName: string; company: string; avatar: string;
  value: string; confidence: string;
  date: string; lastContactDate: string; notes: string;
  status: OpportunityStatus;
};

export const emptyLeadForm = (): LeadFormState => ({
  clientName: '', company: '', avatar: '',
  value: '', confidence: '30',
  date: new Date().toISOString().slice(0, 10),
  lastContactDate: new Date().toISOString().slice(0, 10),
  notes: '', status: 'Lead',
});

const inputCls = 'w-full rounded-xl bg-[#0a0a0a] border border-[#222] px-3 py-2 text-sm text-white focus:border-[#DFFF00] focus:outline-none transition-colors';
const labelCls = 'block text-xs text-[#555] mb-1 uppercase tracking-widest';

export function LeadModal({ initial, title, onClose, onSave }: {
  initial: LeadFormState;
  title: string;
  onClose: () => void;
  onSave: (f: LeadFormState) => void;
}) {
  const [form, setForm] = useState<LeadFormState>(initial);
  const f = (k: keyof LeadFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }));

  const valid = form.clientName.trim() && form.company.trim() && form.value.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[#222] bg-[#111] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose}
            className="rounded-lg p-1.5 text-[#555] hover:bg-[#1a1a1a] hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>Tên khách hàng *</label>
            <input className={inputCls} placeholder="Nguyễn Văn A" value={form.clientName} onChange={f('clientName')} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Công ty *</label>
            <input className={inputCls} placeholder="Tên công ty" value={form.company} onChange={f('company')} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input className={inputCls} type="email" placeholder="email@company.com" value={(form as LeadFormState & { email?: string }).email ?? ''} onChange={f('clientName')} />
          </div>
          <div>
            <label className={labelCls}>Giá trị (USD) *</label>
            <input className={inputCls} type="number" placeholder="50000" value={form.value} onChange={f('value')} />
          </div>
          <div>
            <label className={labelCls}>Ngày tạo</label>
            <input className={inputCls} type="date" value={form.date} onChange={f('date')} />
          </div>
          <div>
            <label className={labelCls}>Liên hệ gần nhất</label>
            <input className={inputCls} type="date" value={form.lastContactDate} onChange={f('lastContactDate')} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Ghi chú</label>
            <textarea className={inputCls + ' resize-none'} rows={2} value={form.notes} onChange={f('notes')} />
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={onClose}
            className="flex-1 rounded-xl border border-[#333] py-2 text-sm text-[#888] hover:bg-[#1a1a1a] hover:text-white transition-colors">
            Hủy
          </button>
          <button
            onClick={() => valid && onSave(form)}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-colors ${
              valid ? 'bg-[#DFFF00] text-black hover:bg-[#c8e600]' : 'bg-[#1a1a1a] text-[#555] cursor-not-allowed'
            }`}
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
