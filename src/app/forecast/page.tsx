// src/app/forecast/page.tsx — Trang Dự Báo Doanh Thu (Manager only)
// Guard ở middleware.ts — Sales bị redirect về / nếu cố truy cập trực tiếp.
// Không fetch riêng theo owner vì trang này cần toàn bộ pipeline để tính forecast chính xác.

'use client';

import { useEffect, useMemo } from 'react';
import { TrendingUp, Target, DollarSign, BarChart3, AlertTriangle } from 'lucide-react';
import { useOpportunityStore, useForecastRevenue, useStatsByStatus } from '@/store/useOpportunityStore';
import { useClientStore } from '@/store/useClientStore';
import type { OpportunityStatus } from '@/types';
import { fmt } from '@/components/forecast/constants';
import { KpiCard, FunnelBar, OppRow, ConfidenceTiers } from '@/components/forecast/ForecastUI';

// Won được giữ trong funnel để hiện doanh thu đã chốt — Lost bị loại vì không còn đóng góp pipeline
const FUNNEL_STAGES: OpportunityStatus[] = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won'];

export default function ForecastPage() {
  // ── Store ─────────────────────────────────────────────────────────────────
  const { opportunities, fetchOpportunities, isLoading } = useOpportunityStore();
  const { clients } = useClientStore();

  // forecastRevenue = Σ(value × confidence%) — loại Lost (confidence=0%), giữ Won (confidence=100%)
  const forecastRevenue = useForecastRevenue();

  // counts & values theo từng stage — dùng cho tab count trong FunnelBar
  const { counts, values } = useStatsByStatus();

  // ── Bootstrap fetch ───────────────────────────────────────────────────────
  useEffect(() => {
    // Chỉ fetch khi store rỗng — tránh refetch thừa nếu user navigate qua lại
    if (opportunities.length === 0) fetchOpportunities();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Dependency array rỗng có chủ đích: fetch đúng một lần khi mount.
  // fetchOpportunities là stable ref (Zustand), nhưng thêm vào deps sẽ trigger lại
  // mỗi khi store update — sai logic "chỉ fetch khi rỗng".

  // ── Derived: pipeline metrics ─────────────────────────────────────────────

  // activeOpps = tất cả trừ Lost — dùng làm denominator cho winRate và avgDeal
  const activeOpps = useMemo(
    () => opportunities.filter((o) => o.status !== 'Lost'),
    [opportunities]
  );
  const totalValue = useMemo(
    () => activeOpps.reduce((s, o) => s + o.value, 0),
    [activeOpps]
  );
  const totalCount = activeOpps.length;

  // ── Derived: weighted value theo stage ────────────────────────────────────
  // Tính riêng per-stage để FunnelBar hiển thị cả cột "Giá trị thô" lẫn "Trọng số"
  // mà không cần FunnelBar tự tính lại từ toàn bộ opportunity list
  const weightedByStatus = useMemo(() => {
    const map: Record<OpportunityStatus, number> = {
      Lead: 0, Qualified: 0, Proposal: 0, Negotiation: 0, Won: 0, Lost: 0,
    };
    opportunities.forEach(o => {
      map[o.status] += o.value * (o.confidence / 100);
    });
    return map;
  }, [opportunities]);

  // ── Derived: win rate ─────────────────────────────────────────────────────
  // Won / (tổng active) — loại Lost khỏi denominator vì Lost là nhánh thất bại,
  // không phải deal chưa kết thúc. Tránh bị "pha loãng" bởi deal đã thua.
  const winRate = totalCount > 0 ? ((counts.Won || 0) / totalCount) * 100 : 0;

  // ── Derived: bảng cơ hội ──────────────────────────────────────────────────
  // Sắp giảm dần theo weighted value (value × confidence) — deal quan trọng nhất lên đầu.
  // Dùng toàn bộ opportunities (kể cả Lost) để manager thấy full picture.
  const sortedOpps = useMemo(
    () => [...opportunities].sort(
      (a, b) => b.value * (b.confidence / 100) - a.value * (a.confidence / 100)
    ),
    [opportunities]
  );

  // ── Derived: risky deals ──────────────────────────────────────────────────
  // Deal đang ở stage quan trọng (Qualified/Proposal/Negotiation) nhưng confidence < 40%
  // → cần manager chú ý vì có nguy cơ rớt cao mà vẫn đang được tính vào forecast.
  // Loại Lead vì confidence thấp là bình thường ở stage đầu (default 15%).
  // Loại Won/Lost vì đã kết thúc — không còn "rủi ro" nữa.
  const riskyDeals = opportunities.filter(
    o => o.confidence < 40 &&
         o.status !== 'Lead' &&
         o.status !== 'Won' &&
         o.status !== 'Lost'
  );

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Đang tải dự báo…</span>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            Dự Báo Doanh Thu
          </h1>
          {/* totalCount tính trên activeOpps — không đếm Lost */}
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Pipeline có trọng số · {totalCount} cơ hội
          </p>
        </div>

        {/* Cảnh báo rủi ro — chỉ hiện khi có ít nhất 1 deal confidence thấp ở stage quan trọng */}
        {riskyDeals.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
            style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)', border: '1px solid #3a2200' }}>
            <AlertTriangle size={14} />
            {riskyDeals.length} deal rủi ro — độ tin thấp
          </div>
        )}
      </div>

      {/* KPI row — 4 chỉ số tổng quan */}
      <div className="grid grid-cols-4 gap-4">
        {/* Card chính: forecast có trọng số — dùng accent để nổi bật */}
        <KpiCard
          icon={TrendingUp}
          label="Dự Báo Có Trọng Số"
          value={fmt(forecastRevenue)}
          sub="Tổng giá trị × độ tin cậy"
          accent
        />
        {/* Tổng pipeline thô — không nhân confidence để thấy "trần" tiềm năng */}
        <KpiCard
          icon={DollarSign}
          label="Tổng Pipeline"
          value={fmt(totalValue)}
          sub={`${totalCount} deal đang hoạt động (không tính Lost)`}
        />
        {/* Win rate = Won / activeOpps — xem lý do loại Lost ở derived section trên */}
        <KpiCard
          icon={Target}
          label="Tỉ Lệ Thắng"
          value={`${winRate.toFixed(1)}%`}
          sub={`${counts.Won || 0} đơn hàng đã chốt`}
        />
        {/* Deal trung bình — denominator là totalCount (active), không tính Lost */}
        <KpiCard
          icon={BarChart3}
          label="Giá Trị Deal TB"
          value={fmt(totalCount > 0 ? totalValue / totalCount : 0)}
          sub="Không tính Lost"
        />
      </div>

      {/* Main 2-col: bảng deal (trái) + funnel & phân tầng (phải) */}
      <div className="grid grid-cols-[1fr_320px] gap-4">

        {/* Left: bảng tất cả opportunities, sort theo weighted value giảm dần */}
        <div className="card flex flex-col">
          {/* Header row — không dùng <thead> vì đây là div layout, không phải table */}
          <div className="flex items-center gap-4 px-4 py-3"
            style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>
            <div className="w-8 flex-shrink-0" />
            <div className="flex-1">Khách hàng</div>
            <div className="w-24 flex-shrink-0">Giai đoạn</div>
            <div className="w-24 flex-shrink-0">Độ tin cậy</div>
            <div className="w-20 text-right flex-shrink-0">Giá trị</div>
            <div className="w-20 text-right flex-shrink-0">Trọng số</div>
            <div className="w-20 text-right flex-shrink-0">Ngày</div>
          </div>

          {/* maxHeight cố định để bảng không đẩy phần phải ra ngoài viewport */}
          <div className="flex flex-col overflow-y-auto" style={{ maxHeight: '480px' }}>
            {sortedOpps.map(o => {
              const client = clients.find(c => c.id === o.clientId);
              return (
                <OppRow
                  key={o.id}
                  clientName={client?.name ?? ''}
                  company={client?.company ?? ''}
                  avatar={client?.avatar ?? ''}
                  value={o.value}
                  confidence={o.confidence}
                  status={o.status}
                  date={o.date}
                />
              );
            })}
            {sortedOpps.length === 0 && (
              <p className="text-center py-12 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Chưa có cơ hội nào.
              </p>
            )}
          </div>
        </div>

        {/* Right: Phễu Pipeline + Phân Tầng Độ Tin Cậy */}
        <div className="flex flex-col gap-4">

          {/* Funnel: mỗi stage 1 FunnelBar — width bar = count / totalCount */}
          <div className="card p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 style={{ color: 'var(--color-text-muted)' }}>Phễu Pipeline</h2>
              {/* Legend: trắng = giá trị thô, brand = weighted */}
              <div className="flex gap-3" style={{ color: 'var(--color-text-muted)' }}>
                <span>Giá trị</span>
                <span style={{ color: 'var(--color-brand)' }}>Trọng số</span>
              </div>
            </div>
            {FUNNEL_STAGES.map(s => (
              <FunnelBar
                key={s}
                status={s}
                count={counts[s] || 0}
                // total = totalCount (active) để bar width phản ánh tỉ lệ trong pipeline đang sống
                total={totalCount}
                value={values[s] || 0}
                weighted={weightedByStatus[s] || 0}
              />
            ))}
          </div>

          {/* Phân tầng confidence: Cao ≥75% / Trung 40-74% / Thấp <40% */}
          <ConfidenceTiers opportunities={opportunities} />
        </div>
      </div>
    </div>
  );
}
