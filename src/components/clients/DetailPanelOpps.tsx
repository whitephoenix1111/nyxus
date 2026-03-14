// src/components/clients/DetailPanelOpps.tsx — Tab "Cơ hội" trong DetailPanel của một Client

import { Plus } from 'lucide-react';
import { formatCurrency, formatCurrencyFull } from '@/lib/utils';
import type { ClientWithStats, OpportunityStatus } from '@/types';
import { StatusBadge } from './_atoms';

// ── Props ─────────────────────────────────────────────────────────────────────

/**
 * Nhận vào `ClientWithStats` — type đã được join sẵn với danh sách `opportunities[]`
 * và các trường tổng hợp (`totalValue`, `forecastValue`, `opportunityCount`).
 * Dữ liệu này được tính trong store bằng `useClientsWithComputedTags`, không fetch lại.
 */
interface DetailPanelOppsProps {
  client: ClientWithStats;
  /** Callback mở AddDealModal — undefined khi caller không cho phép tạo deal (VD: archived client) */
  onAddDeal?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Hiển thị toàn bộ thông tin cơ hội của một client trong DetailPanel.
 *
 * Bố cục gồm 3 phần:
 * 1. Stats row — 3 KPI cards: Tổng giá trị, Số cơ hội, Dự báo doanh thu
 * 2. Status breakdown — phân bổ số lượng deal theo từng stage
 * 3. Opportunity list — danh sách từng deal, sort theo value giảm dần
 *
 * Component này read-only — không có action tạo/sửa/xóa deal ở đây.
 * Để promote stage hoặc log activity, dùng PromoteModal / AddActivityModal từ Leads/Opps page.
 */
export function DetailPanelOpps({ client, onAddDeal }: DetailPanelOppsProps) {

  // ── Tính phân bổ theo status ───────────────────────────────────────────────

  /**
   * Gom số lượng deals theo từng OpportunityStatus để render breakdown chips.
   * VD: { Lead: 2, Proposal: 1, Won: 3 }
   * Dùng Record<string, number> thay vì Record<OpportunityStatus, number>
   * vì reduce cần khởi tạo với `{}` trống — cast sang OpportunityStatus khi render.
   */
  const byStatus = client.opportunities.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            /**
             * Tổng GT: SUM(value) của toàn bộ deals, kể cả Lost — phản ánh tổng pipeline
             * lịch sử, không chỉ deals đang active.
             * Cơ hội: số lượng deals (opportunityCount = opportunities.length từ store).
             * Dự báo: SUM(value × confidence / 100) — đã tính sẵn trong ClientWithStats.
             *   Math.round vì forecastValue là số thực (VD: 123456.67), formatCurrency
             *   chỉ nhận integer để hiển thị gọn ($123k).
             */
            { label: 'Tổng GT', value: formatCurrency(client.totalValue),               color: 'var(--color-text-primary)' },
            { label: 'Cơ hội',  value: client.opportunityCount,                         color: 'var(--color-text-primary)' },
            { label: 'Dự báo',  value: formatCurrency(Math.round(client.forecastValue)), color: 'var(--color-brand)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl px-3 py-2.5"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-faint)' }}>{label}</p>
              <p className="text-base font-bold tabular-nums" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Status breakdown ──────────────────────────────────────────────── */}
        {/* Guard: chỉ render khi client có ít nhất 1 deal (byStatus sẽ có keys).
            Điều kiện này tương đương với client.opportunities.length > 0 nhưng
            check trực tiếp trên byStatus để nhất quán với dữ liệu đang render. */}
        {Object.keys(byStatus).length > 0 && (
          <>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-faint)' }}>
              Phân bổ trạng thái
            </p>
            <div className="flex flex-wrap gap-2">
              {/* Cast sang OpportunityStatus[] để StatusBadge nhận đúng type */}
              {(Object.keys(byStatus) as OpportunityStatus[]).map(s => (
                <div key={s} className="flex items-center gap-1.5">
                  <StatusBadge status={s} />
                  {/* ×N: số lượng deals ở stage này, tabular-nums để căn đều */}
                  <span className="text-xs tabular-nums" style={{ color: 'var(--color-text-subtle)' }}>×{byStatus[s]}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Opportunity list ──────────────────────────────────────────────────── */}
      {client.opportunities.length > 0 ? (
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-text-faint)' }}>
              Tất cả cơ hội
            </p>
            {onAddDeal && (
              <button onClick={onAddDeal}
                className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80"
                style={{ color: 'var(--color-brand)' }}>
                <Plus size={11} /> Thêm deal
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {/*
             * Spread trước khi sort để không mutate mảng gốc từ store.
             * Sort theo value DESC — deal giá trị cao nhất hiện lên trước,
             * giúp sales nhìn thấy ngay deal quan trọng nhất của client.
             */}
            {[...client.opportunities].sort((a, b) => b.value - a.value).map(opp => (
              <div key={opp.id} className="rounded-xl px-4 py-3"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>

                {/* Header: tên deal + ngày tạo + status badge */}
                <div className="flex items-start justify-between mb-2">
                  <div className='w-[70%]'>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{opp.title}</p>
                    {/* opp.date là ngày tạo deal (ISO 8601), format theo vi-VN: DD/MM/YYYY */}
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-subtle)' }}>
                      {new Date(opp.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                  </div>
                  <StatusBadge status={opp.status} />
                </div>

                {/* Footer: giá trị đầy đủ + thanh confidence */}
                <div className="flex items-center justify-between">
                  {/* formatCurrencyFull thay vì formatCurrency vì đây là row chi tiết,
                      không giới hạn không gian như badge — hiển thị $1,500,000 thay vì $1.5M */}
                  <span className="text-sm font-bold tabular-nums font-mono" style={{ color: 'var(--color-text-primary)' }}>
                    {formatCurrencyFull(opp.value)}
                  </span>

                  {/* Thanh confidence — màu theo ngưỡng nghiệp vụ:
                      ≥75% → brand  (Negotiation 80%, Won 100%  — deal gần chốt hoặc đã chốt)
                      ≥40% → forecast color  (Proposal 60%         — deal đang tiến triển tốt)
                      <40% → disabled  (Lead 15%, Qualified 35%  — deal mới, chưa đủ tín hiệu) */}
                  <div className="flex items-center gap-1.5">
                    <div className="h-1 w-16 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                      <div className="h-full rounded-full" style={{
                        width: `${opp.confidence}%`,
                        background: opp.confidence >= 75 ? 'var(--color-brand)'
                          : opp.confidence >= 40 ? 'var(--color-status-forecast-text)'
                          : 'var(--color-text-disabled)',
                      }} />
                    </div>
                    <span className="text-xs tabular-nums" style={{ color: 'var(--color-text-subtle)' }}>{opp.confidence}%</span>
                  </div>
                </div>

                {/* Notes: chỉ render nếu có, line-clamp-2 để tránh card bị kéo dài
                    khi notes dài — người dùng có thể đọc đầy đủ ở trang chi tiết deal */}
                {opp.notes && (
                  <p className="mt-2 text-xs line-clamp-2" style={{ color: 'var(--color-text-subtle)' }}>{opp.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Empty state — client chưa có deal nào (có thể vừa import hoặc lead mới) */
        <div className="px-6 py-8 flex flex-col items-center gap-3">
          <p className="text-sm" style={{ color: 'var(--color-text-faint)' }}>Chưa có cơ hội nào.</p>
          {onAddDeal && (
            <button onClick={onAddDeal}
              className="btn-primary flex items-center gap-1.5 text-xs px-3 py-2">
              <Plus size={12} /> Thêm cơ hội đầu tiên
            </button>
          )}
        </div>
      )}
    </>
  );
}
