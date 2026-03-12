'use client';

import { useEffect, useMemo } from 'react';
import { TrendingUp, Target, DollarSign, BarChart3, AlertTriangle } from 'lucide-react';
import { useOpportunityStore, useForecastRevenue, useStatsByStatus } from '@/store/useOpportunityStore';
import type { OpportunityStatus } from '@/types';
import { fmt } from '@/components/forecast/constants';
import { KpiCard, FunnelBar, OppRow, ConfidenceTiers } from '@/components/forecast/ForecastUI';

const FUNNEL_STAGES: OpportunityStatus[] = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won'];

export default function ForecastPage() {
  const { opportunities, fetchOpportunities, isLoading } = useOpportunityStore();
  const forecastRevenue = useForecastRevenue();
  const { counts, values } = useStatsByStatus();

  useEffect(() => { if (opportunities.length === 0) fetchOpportunities(); }, []);

  const activeOpps  = useMemo(() => opportunities.filter((o) => o.status !== 'Lost'), [opportunities]);
  const totalValue   = useMemo(() => activeOpps.reduce((s, o) => s + o.value, 0), [activeOpps]);
  const totalCount   = activeOpps.length;

  const weightedByStatus = useMemo(() => {
    const map: Record<OpportunityStatus, number> = { Lead: 0, Qualified: 0, Proposal: 0, Negotiation: 0, Won: 0, Lost: 0 };
    opportunities.forEach(o => { map[o.status] += o.value * (o.confidence / 100); });
    return map;
  }, [opportunities]);

  const winRate    = totalCount > 0 ? ((counts.Won || 0) / totalCount) * 100 : 0;
  // winRate tính trên activeOpps (Won / tất cả trừ Lost)
  const sortedOpps = useMemo(() => [...opportunities].sort((a, b) => b.value * (b.confidence / 100) - a.value * (a.confidence / 100)), [opportunities]);
  const riskyDeals = opportunities.filter(o => o.confidence < 40 && o.status !== 'Lead' && o.status !== 'Won' && o.status !== 'Lost');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Đang tải dự báo…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            Dự Báo Doanh Thu
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Pipeline có trọng số · {totalCount} cơ hội
          </p>
        </div>
        {riskyDeals.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
            style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)', border: '1px solid #3a2200' }}>
            <AlertTriangle size={14} />
            {riskyDeals.length} deal rủi ro — độ tin thấp
          </div>
        )}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard icon={TrendingUp} label="Dự Báo Có Trọng Số" value={fmt(forecastRevenue)}
          sub="Tổng giá trị × độ tin cậy" accent />
        <KpiCard icon={DollarSign} label="Tổng Pipeline" value={fmt(totalValue)}
          sub={`${totalCount} deal đang hoạt động (không tính Lost)`} />
        <KpiCard icon={Target} label="Tỉ Lệ Thắng" value={`${winRate.toFixed(1)}%`}
          sub={`${counts.Won || 0} đơn hàng đã chốt`} />
        <KpiCard icon={BarChart3} label="Giá Trị Deal TB"
          value={fmt(totalCount > 0 ? totalValue / totalCount : 0)} sub="Không tính Lost" />
      </div>

      {/* Main 2-col */}
      <div className="grid grid-cols-[1fr_320px] gap-4">

        {/* Left — bảng cơ hội */}
        <div className="card flex flex-col">
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
          <div className="flex flex-col overflow-y-auto" style={{ maxHeight: '480px' }}>
            {sortedOpps.map(o => <OppRow key={o.id} {...o} />)}
            {sortedOpps.length === 0 && (
              <p className="text-center py-12 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Chưa có cơ hội nào.
              </p>
            )}
          </div>
        </div>

        {/* Right — funnel + phân tích */}
        <div className="flex flex-col gap-4">
          <div className="card p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 style={{ color: 'var(--color-text-muted)' }}>Phễu Pipeline</h2>
              <div className="flex gap-3" style={{ color: 'var(--color-text-muted)' }}>
                <span>Giá trị</span>
                <span style={{ color: 'var(--color-brand)' }}>Trọng số</span>
              </div>
            </div>
            {FUNNEL_STAGES.map(s => (
              <FunnelBar key={s} status={s} count={counts[s] || 0} total={totalCount}
                value={values[s] || 0} weighted={weightedByStatus[s] || 0} />
            ))}
          </div>
          <ConfidenceTiers opportunities={opportunities} />
        </div>
      </div>
    </div>
  );
}
