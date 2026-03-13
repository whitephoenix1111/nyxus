'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { Opportunity, OpportunityStatus } from '@/types';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const PROMOTE_STEPS: OpportunityStatus[] = ['Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
const PROMOTE_LABELS: Record<string, string> = {
  Qualified: 'Đủ điều kiện', Proposal: 'Đề xuất',
  Negotiation: 'Thương lượng', Won: 'Chốt đơn ✓', Lost: 'Thất bại',
};
const PROMOTE_VARIANT: Partial<Record<OpportunityStatus, 'danger' | 'warning' | 'info'>> = {
  Won:  'info',
  Lost: 'danger',
};

export function PromoteModal({ opp, onClose, onPromote }: {
  opp: Opportunity;
  onClose: () => void;
  onPromote: (s: OpportunityStatus) => void;
}) {
  const [pendingStage, setPendingStage] = useState<OpportunityStatus | null>(null);

  const handleSelect = (s: OpportunityStatus) => {
    // Won và Lost cần confirm thêm vì không thể undo dễ
    if (s === 'Won' || s === 'Lost') {
      setPendingStage(s);
    } else {
      onPromote(s);
      onClose();
    }
  };

  return (
    <>
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
            {PROMOTE_STEPS.map(s => {
              const isWon  = s === 'Won';
              const isLost = s === 'Lost';
              return (
                <button key={s}
                  onClick={() => handleSelect(s)}
                  className="flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-all"
                  style={{
                    borderColor: isLost ? '#ef444433' : '#222',
                    color:       isLost ? '#f87171' : isWon ? '#4ade80' : 'white',
                    background:  'transparent',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget;
                    el.style.borderColor = isLost ? '#ef4444' : '#DFFF00';
                    el.style.background  = isLost ? '#1a050508' : '#DFFF0008';
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget;
                    el.style.borderColor = isLost ? '#ef444433' : '#222';
                    el.style.background  = 'transparent';
                  }}
                >
                  {PROMOTE_LABELS[s]}
                  <span className="text-xs" style={{ color: isLost ? '#ef4444' : '#DFFF00' }}>→</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Confirm cho Won / Lost */}
      {pendingStage && (
        <ConfirmDialog
          title={pendingStage === 'Won' ? 'Xác nhận chốt đơn' : 'Xác nhận thất bại'}
          description={
            pendingStage === 'Won'
              ? `Chuyển "${opp.clientName}" sang Won? Deal sẽ chốt và khách hàng sẽ chuyển sang danh sách Khách hàng.`
              : `Đánh dấu deal "${opp.clientName}" là thất bại? Hành động này khó có thể hoàn tác.`
          }
          confirmLabel={pendingStage === 'Won' ? 'Chốt đơn' : 'Xác nhận thất bại'}
          variant={PROMOTE_VARIANT[pendingStage] ?? 'info'}
          onConfirm={() => { onPromote(pendingStage); setPendingStage(null); onClose(); }}
          onCancel={() => setPendingStage(null)}
        />
      )}
    </>
  );
}
