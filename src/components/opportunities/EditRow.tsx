'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import type { Opportunity, OpportunityStatus } from '@/types';
import { ALL_STATUSES, STATUS_LABELS } from './constants';

const inputCls = 'w-full rounded-lg bg-[#0a0a0a] border border-[#333] px-2 py-1 text-sm text-white focus:border-[#DFFF00] focus:outline-none';

export function EditRow({ opp, onSave, onCancel }: {
  opp: Opportunity;
  onSave: (data: Partial<Opportunity>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    clientName: opp.clientName,
    company: opp.company,
    value: String(opp.value),
    status: opp.status,
    confidence: String(opp.confidence),
  });

  return (
    <tr className="border-b border-[#1a1a1a] bg-[#0d0d0d]">
      <td className="px-4 py-2">
        <input className={inputCls} value={form.clientName}
          onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} />
      </td>
      <td className="px-4 py-2">
        <input className={inputCls} value={form.company}
          onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
      </td>
      <td className="px-4 py-2">
        <input className={inputCls} type="number" value={form.value}
          onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
      </td>
      <td className="px-4 py-2">
        <select className={inputCls} value={form.status}
          onChange={e => setForm(f => ({ ...f, status: e.target.value as OpportunityStatus }))}>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </td>
      <td className="px-4 py-2">
        <input className={inputCls} type="number" min={0} max={100} value={form.confidence}
          onChange={e => setForm(f => ({ ...f, confidence: e.target.value }))} />
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSave({
              clientName: form.clientName, company: form.company,
              value: Number(form.value), status: form.status,
              confidence: Number(form.confidence),
            })}
            className="rounded-lg p-1.5 text-[#DFFF00] hover:bg-[#DFFF0015] transition-colors"
          >
            <Check size={14} />
          </button>
          <button onClick={onCancel}
            className="rounded-lg p-1.5 text-[#555] hover:bg-[#1a1a1a] transition-colors">
            <X size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}
