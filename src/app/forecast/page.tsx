'use client';

import { useEffect } from 'react';
import { TrendingUp, Target, DollarSign, BarChart3, AlertTriangle } from 'lucide-react';
import {
  useOpportunityStore,
  useForecastRevenue,
  useStatsByStatus,
} from '@/store/useOpportunityStore';
import { useMemo } from 'react';
import type { OpportunityStatus } from '@/types';

// ── Helpers ────────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

// ── Status colour map ──────────────────────────────────────────
const STATUS_CONFIG: Record<OpportunityStatus, { bar: string; label: string; conf: number }> = {
  Lead:     { bar: '#333333', label: 'Lead',     conf: 10 },
  Proposal: { bar: '#5BA3F5', label: 'Đề xuất',  conf: 40 },
  Forecast: { bar: '#F5C842', label: 'Dự báo',   conf: 75 },
  Order:    { bar: '#DFFF00', label: 'Đơn hàng', conf: 100 },
};

// ── Sub-components ─────────────────────────────────────────────
function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={`card p-5 flex flex-col gap-3 ${accent ? 'card-brand' : ''}`}>
      <div className="flex items-center justify-between">
        <span
          className="text-sm font-medium"
          style={{ color: accent ? '#00000088' : 'var(--color-text-muted)' }}
        >
          {label}
        </span>
        <Icon
          size={16}
          style={{ color: accent ? '#00000066' : 'var(--color-text-muted)' }}
        />
      </div>
      <span
        className=" text-3xl font-bold tracking-tight"
        style={{ color: accent ? '#000000' : 'var(--color-text-primary)' }}
      >
        {value}
      </span>
      {sub && (
        <span
          className="text-xs"
          style={{
            fontFamily: 'var(--font-body)',
            color: accent ? '#00000066' : 'var(--color-text-muted)',
          }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

// ── Pipeline funnel bar ────────────────────────────────────────
function FunnelBar({
  status,
  count,
  total,
  value,
  weighted,
}: {
  status: OpportunityStatus;
  count: number;
  total: number;
  value: number;
  weighted: number;
}) {
  const cfg = STATUS_CONFIG[status];
  const widthPct = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: cfg.bar }}
          />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {cfg.label}
          </span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {count} cơ hội
          </span>
        </div>
        <div className="flex gap-6 text-right">
          <span className=" text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {fmt(value)}
          </span>
          <span className=" text-sm font-semibold" style={{ color: cfg.bar }}>
            {fmt(weighted)}
          </span>
        </div>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: 'var(--color-border)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${widthPct}%`, background: cfg.bar }}
        />
      </div>
    </div>
  );
}

// ── Opportunity row ────────────────────────────────────────────
function OppRow({
  clientName,
  company,
  avatar,
  value,
  confidence,
  status,
  date,
}: {
  clientName: string;
  company: string;
  avatar: string;
  value: number;
  confidence: number;
  status: OpportunityStatus;
  date: string;
}) {
  const cfg = STATUS_CONFIG[status];
  const weighted = value * (confidence / 100);

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 rounded-xl transition-colors"
      style={{ borderBottom: '1px solid var(--color-border)' }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{
          fontFamily: 'var(--font-display)',
          background: 'var(--color-surface-hover)',
          color: 'var(--color-text-secondary)',
        }}
      >
        {avatar}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold truncate"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        >
          {clientName}
        </p>
        <p className="text-xs truncate" style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)' }}>
          {company}
        </p>
      </div>
      <span className={`badge badge-${status.toLowerCase()} flex-shrink-0`}>
        {cfg.label}
      </span>
      <div className="flex items-center gap-2 w-24 flex-shrink-0">
        <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--color-border)' }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${confidence}%`, background: cfg.bar }}
          />
        </div>
        <span className=" text-xs w-8 text-right" style={{ color: 'var(--color-text-muted)' }}>
          {confidence}%
        </span>
      </div>
      <span className=" text-sm w-20 text-right flex-shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
        {fmt(value)}
      </span>
      <span className=" text-sm font-semibold w-20 text-right flex-shrink-0" style={{ color: cfg.bar }}>
        {fmt(weighted)}
      </span>
      <span className="text-xs w-20 text-right flex-shrink-0" style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)' }}>
        {new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' })}
      </span>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────
export default function ForecastPage() {
  const { opportunities, fetchOpportunities, isLoading } = useOpportunityStore();
  const forecastRevenue = useForecastRevenue();
  const { counts, values } = useStatsByStatus();

  useEffect(() => {
    if (opportunities.length === 0) fetchOpportunities();
  }, []);

  const totalValue = useMemo(() => opportunities.reduce((s, o) => s + o.value, 0), [opportunities]);
  const totalCount = opportunities.length;

  const weightedByStatus = useMemo(() => {
    const map: Record<OpportunityStatus, number> = { Lead: 0, Proposal: 0, Forecast: 0, Order: 0 };
    opportunities.forEach((o) => {
      map[o.status] += o.value * (o.confidence / 100);
    });
    return map;
  }, [opportunities]);

  const winRate = totalCount > 0 ? ((counts.Order || 0) / totalCount) * 100 : 0;

  const sortedOpps = useMemo(
    () => [...opportunities].sort((a, b) => b.value * (b.confidence / 100) - a.value * (a.confidence / 100)),
    [opportunities]
  );

  const riskyDeals = opportunities.filter((o) => o.confidence < 40 && o.status !== 'Lead');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          Đang tải dự báo…
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1400px] mx-auto">

      {/* ── Tiêu đề trang ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Dự Báo Doanh Thu
          </h1>
          <p className="text-sm mt-1" style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)' }}>
            Pipeline có trọng số · {totalCount} cơ hội
          </p>
        </div>
        {riskyDeals.length > 0 && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
            style={{
              fontFamily: 'var(--font-body)',
              background: 'var(--color-warning-bg)',
              color: 'var(--color-warning)',
              border: '1px solid #3a2200',
            }}
          >
            <AlertTriangle size={14} />
            {riskyDeals.length} deal rủi ro — độ tin thấp
          </div>
        )}
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          icon={TrendingUp}
          label="Dự Báo Có Trọng Số"
          value={fmt(forecastRevenue)}
          sub="Tổng giá trị × độ tin cậy"
          accent
        />
        <KpiCard
          icon={DollarSign}
          label="Tổng Pipeline"
          value={fmt(totalValue)}
          sub={`${totalCount} deal đang hoạt động`}
        />
        <KpiCard
          icon={Target}
          label="Tỉ Lệ Thắng"
          value={`${winRate.toFixed(1)}%`}
          sub={`${counts.Order || 0} đơn hàng đã chốt`}
        />
        <KpiCard
          icon={BarChart3}
          label="Giá Trị Deal TB"
          value={fmt(totalCount > 0 ? totalValue / totalCount : 0)}
          sub="Tất cả giai đoạn"
        />
      </div>

      {/* ── Main 2-col ── */}
      <div className="grid grid-cols-[1fr_320px] gap-4">

        {/* Left — bảng cơ hội */}
        <div className="card flex flex-col">
          <div
            className="flex items-center gap-4 px-4 py-3 "
            style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}
          >
            <div className="w-8 flex-shrink-0" />
            <div className="flex-1">Khách hàng</div>
            <div className="w-24 flex-shrink-0">Giai đoạn</div>
            <div className="w-24 flex-shrink-0">Độ tin cậy</div>
            <div className="w-20 text-right flex-shrink-0">Giá trị</div>
            <div className="w-20 text-right flex-shrink-0">Trọng số</div>
            <div className="w-20 text-right flex-shrink-0">Ngày</div>
          </div>
          <div className="flex flex-col overflow-y-auto" style={{ maxHeight: '480px' }}>
            {sortedOpps.map((o) => (
              <OppRow key={o.id} {...o} />
            ))}
            {sortedOpps.length === 0 && (
              <p
                className="text-center py-12 text-sm"
                style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)' }}
              >
                Chưa có cơ hội nào.
              </p>
            )}
          </div>
        </div>

        {/* Right — funnel + phân tích */}
        <div className="flex flex-col gap-4">
          {/* Pipeline funnel */}
          <div className="card p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="" style={{ color: 'var(--color-text-muted)' }}>
                Phễu Pipeline
              </h2>
              <div className="flex gap-3 " style={{ color: 'var(--color-text-muted)' }}>
                <span>Giá trị</span>
                <span style={{ color: 'var(--color-brand)' }}>Trọng số</span>
              </div>
            </div>
            {(['Lead', 'Proposal', 'Forecast', 'Order'] as OpportunityStatus[]).map((s) => (
              <FunnelBar
                key={s}
                status={s}
                count={counts[s] || 0}
                total={totalCount}
                value={values[s] || 0}
                weighted={weightedByStatus[s] || 0}
              />
            ))}
          </div>

          {/* Phân tích độ tin cậy */}
          <div className="card p-5 flex flex-col gap-3">
            <h2 style={{ color: 'var(--color-text-muted)' }}>
              Phân Tầng Độ Tin Cậy
            </h2>
            {[
              { label: 'Cao (≥ 75%)', color: '#DFFF00', filter: (c: number) => c >= 75 },
              { label: 'Trung (40–74%)', color: '#F5C842', filter: (c: number) => c >= 40 && c < 75 },
              { label: 'Thấp (< 40%)', color: '#EF4444', filter: (c: number) => c < 40 },
            ].map(({ label, color, filter }) => {
              const group = opportunities.filter((o) => filter(o.confidence));
              const groupVal = group.reduce((s, o) => s + o.value * (o.confidence / 100), 0);
              return (
                <div key={label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
                    <span style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>
                      {label}
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {group.length} deal
                    </span>
                    <span className="text-sm font-semibold" style={{ color }}>
                      {fmt(groupVal)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
