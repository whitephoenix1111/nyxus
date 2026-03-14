// src/components/leads/PromoteModal.tsx — Modal chuyển stage cho một opportunity
//
// Flow:
//   Qualified / Proposal / Negotiation → onPromote() ngay, đóng modal.
//   Won / Lost → mở ConfirmDialog thêm trước khi thực thi.
//
// Lý do double-confirm cho Won/Lost:
//   Won: client.isProspect sẽ bị set = false → client biến mất khỏi /leads,
//        xuất hiện ở /clients. Không undo được dễ dàng.
//   Lost: deal bị đóng vĩnh viễn. Khó rollback nếu nhấn nhầm.
//   Các stage khác (Qualified→Proposal→Negotiation) có thể thăng/giáng tự do,
//   nên không cần confirm thêm.
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

export function PromoteModal({ opp, clientName, clientCompany, onClose, onPromote }: {
  opp: Opportunity;
  clientName:    string;
  clientCompany: string;
  onClose: () => void;
  onPromote: (s: OpportunityStatus) => void;
}) {
  // pendingStage: stage đang chờ xác nhận (chỉ Won/Lost); null = không có confirm đang mở
  const [pendingStage, setPendingStage] = useState<OpportunityStatus | null>(null);

  const handleSelect = (s: OpportunityStatus) => {
    // Won và Lost cần confirm thêm vì action không thể undo dễ (xem file header)
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
            <span className="text-white font-medium">{clientName}</span> · {clientCompany}
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
                  // Dùng inline style cho hover thay vì Tailwind vì màu hover phụ thuộc
                  // vào từng stage (Lost = đỏ, Won/khác = brand yellow) — không thể
                  // encode logic này trong class tĩnh mà không dùng arbitrary values.
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

      {/* Confirm bổ sung cho Won / Lost — render chồng lên modal chính */}
      {pendingStage && (
        <ConfirmDialog
          title={pendingStage === 'Won' ? 'Xác nhận chốt đơn' : 'Xác nhận thất bại'}
          description={
            pendingStage === 'Won'
              ? `Chuyển "${clientName}" sang Won? Deal sẽ chốt và khách hàng sẽ chuyển sang danh sách Khách hàng.`
              : `Đánh dấu deal "${clientName}" là thất bại? Hành động này khó có thể hoàn tác.`
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
