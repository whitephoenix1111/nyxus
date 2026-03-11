'use client';

import { X } from 'lucide-react';
import type { Opportunity, OpportunityStatus } from '@/types';

const PROMOTE_STEPS: OpportunityStatus[] = ['Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
const PROMOTE_LABELS: Record<string, string> = {
  Qualified: 'Đủ điều kiện', Proposal: 'Đề xuất',
  Negotiation: 'Thương lượng', Won: 'Chốt đơn', Lost: 'Thất bại',
};

export function PromoteModal({ opp, onClose, onPromote }: {
  opp: Opportunity;
  onClose: () => void;
  onPromote: (s: OpportunityStatus) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-[#222] bg-[#111] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">Chuyển trạng thái</h2>
          <button onClick={onClose}
            className="rounded-lg p-1.5 text-[#555] hover:bg-[#1a1a1a] hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>
        <p className="text-sm text-[#888] mb-5">
          <span className="text-white font-medium">{opp.clientName}</span> · {opp.company}
        </p>
        <div className="flex flex-col gap-2">
          {PROMOTE_STEPS.map(s => (
            <button key={s}
              onClick={() => { onPromote(s); onClose(); }}
              className="flex items-center justify-between rounded-xl border border-[#222] px-4 py-3 text-sm font-medium text-white hover:border-[#DFFF00] hover:bg-[#DFFF0008] transition-all">
              {PROMOTE_LABELS[s]}
              <span className="text-[#DFFF00] text-xs">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
