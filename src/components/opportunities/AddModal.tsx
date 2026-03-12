'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { Opportunity, OpportunityStatus } from '@/types';
import { ALL_STATUSES, STATUS_LABELS } from './constants';

const inputCls = 'w-full rounded-xl bg-[#0a0a0a] border border-[#222] px-3 py-2 text-sm text-white focus:border-[#DFFF00] focus:outline-none transition-colors';
const labelCls = 'block text-xs text-[#555] mb-1 uppercase tracking-widest';

export function AddModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (d: Omit<Opportunity, 'id'>) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    clientName: '', company: '', avatar: '',
    value: '', status: 'Lead' as OpportunityStatus,
    confidence: '50', date: today, lastContactDate: today, notes: '',
  });

  const handleSubmit = () => {
    if (!form.clientName || !form.company || !form.value) return;
    onAdd({
      clientName: form.clientName,
      company: form.company,
      avatar: form.avatar || form.clientName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
      value: Number(form.value),
      status: form.status,
      confidence: Number(form.confidence),
      date: form.date,
      lastContactDate: form.lastContactDate,
      notes: form.notes,
      clientId: '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[#222] bg-[#111] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Thêm cơ hội mới</h2>
          <button onClick={onClose}
            className="rounded-lg p-1.5 text-[#555] hover:bg-[#1a1a1a] hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>Tên khách hàng *</label>
            <input className={inputCls} placeholder="Nguyễn Văn A" value={form.clientName}
              onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Công ty *</label>
            <input className={inputCls} placeholder="Tên công ty" value={form.company}
              onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>Giá trị (USD) *</label>
            <input className={inputCls} type="number" placeholder="50000" value={form.value}
              onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>Trạng thái</label>
            <select className={inputCls} value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value as OpportunityStatus }))}>
              {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Confidence (%)</label>
            <input className={inputCls} type="number" min={0} max={100} value={form.confidence}
              onChange={e => setForm(f => ({ ...f, confidence: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Ghi chú</label>
            <textarea className={inputCls + ' resize-none'} rows={2} value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={onClose}
            className="flex-1 rounded-xl border border-[#333] py-2 text-sm text-[#888] hover:bg-[#1a1a1a] hover:text-white transition-colors">
            Hủy
          </button>
          <button onClick={handleSubmit}
            className="flex-1 rounded-xl bg-[#DFFF00] py-2 text-sm font-semibold text-black hover:bg-[#c8e600] transition-colors">
            Thêm cơ hội
          </button>
        </div>
      </div>
    </div>
  );
}
