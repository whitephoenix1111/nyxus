'use client';

import { formatCurrencyFull } from '@/lib/utils';

interface PersonalStatItem {
  label: string;
  value: number | string;
  sub?: string;
  accent?: boolean;
}

interface PersonalStatCardsProps {
  leadCount: number;
  pipelineValue: number;
  wonThisMonth: number;
  pendingTaskCount: number;
}

function MiniCard({ label, value, sub, accent }: PersonalStatItem) {
  return (
    <div
      className={`rounded-2xl p-5 flex flex-col justify-between transition-all ${
        accent ? 'bg-[#DFFF00] text-black' : 'bg-[#111] text-white'
      }`}
      style={{ minHeight: '130px' }}
    >
      <p className={`text-sm font-medium ${accent ? 'text-black/60' : 'text-[#888]'}`}>
        {label}
      </p>
      <div>
        <p className={`text-4xl font-bold tracking-tight ${accent ? 'text-black' : 'text-white'}`}>
          {value}
        </p>
        {sub && (
          <p className={`mt-0.5 text-xs ${accent ? 'text-black/50' : 'text-[#555]'}`}>{sub}</p>
        )}
      </div>
    </div>
  );
}

export default function PersonalStatCards({
  leadCount,
  pipelineValue,
  wonThisMonth,
  pendingTaskCount,
}: PersonalStatCardsProps) {
  const thisMonth = new Date().toLocaleString('vi-VN', { month: 'long' });

  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      <MiniCard
        label="Leads đang có"
        value={leadCount}
        sub="trong pipeline của bạn"
        accent
      />
      <MiniCard
        label="Tổng pipeline"
        value={formatCurrencyFull(pipelineValue).replace('$', '')}
        sub="tất cả deal đang mở"
      />
      <MiniCard
        label={`Won ${thisMonth}`}
        value={formatCurrencyFull(wonThisMonth).replace('$', '')}
        sub="doanh thu tháng này"
      />
      <MiniCard
        label="Tasks đang chờ"
        value={pendingTaskCount}
        sub="cần xử lý"
      />
    </div>
  );
}
