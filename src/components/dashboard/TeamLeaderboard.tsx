'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, TrendingUp, Users } from 'lucide-react';
import { useUsersStore } from '@/store/useUsersStore';
import { formatCurrencyFull } from '@/lib/utils';
import type { Opportunity, Task } from '@/types';

interface TeamLeaderboardProps {
  opportunities: Opportunity[]; // toàn bộ — chưa filter owner
  tasks: Task[];                // toàn bộ
}

interface SalesRow {
  userId: string;
  name: string;
  leads: number;
  pipeline: number;
  wonCount: number;
  wonValue: number;
  overdueCount: number;
}

export default function TeamLeaderboard({ opportunities, tasks }: TeamLeaderboardProps) {
  const router   = useRouter();
  const { users } = useUsersStore();

  const today      = new Date().toISOString().split('T')[0];
  const now        = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

  const salespersons = useMemo(
    () => users.filter(u => u.role === 'salesperson'),
    [users]
  );

  const rows: SalesRow[] = useMemo(() => {
    return salespersons.map(user => {
      const myOpps = opportunities.filter(o => o.ownerId === user.id);
      const myClientIds = new Set(myOpps.map(o => o.clientId));

      const leads = myOpps.filter(o =>
        ['Lead', 'Qualified', 'Proposal', 'Negotiation'].includes(o.status)
      ).length;

      const pipeline = myOpps
        .filter(o => !['Won', 'Lost'].includes(o.status))
        .reduce((s, o) => s + o.value, 0);

      // lastContactDate đã xóa khỏi schema — dùng o.date (ngày deal) để filter Won tháng này.
      // statusHistory có thể chính xác hơn nhưng optional và có thể rỗng,
      // o.date luôn có và đủ dùng cho mục đích leaderboard tháng.
      const wonThisMonth = myOpps.filter(
        o => o.status === 'Won' && o.date >= monthStart
      );

      const overdueCount = tasks.filter(t =>
        myClientIds.has(t.clientId) &&
        t.status === 'pending' &&
        t.dueDate && t.dueDate < today
      ).length;

      return {
        userId:      user.id,
        name:        user.name,
        leads,
        pipeline,
        wonCount:    wonThisMonth.length,
        wonValue:    wonThisMonth.reduce((s, o) => s + o.value, 0),
        overdueCount,
      };
    });
  }, [salespersons, opportunities, tasks, monthStart, today]);

  // Sort theo wonValue tháng này desc
  const sorted = useMemo(
    () => [...rows].sort((a, b) => b.wonValue - a.wonValue),
    [rows]
  );

  const medals = ['🥇', '🥈', '🥉'];

  if (salespersons.length === 0) return null;

  return (
    <div className="rounded-2xl bg-[#111] p-4">
      <div className="flex items-center gap-2 mb-4">
        <Users size={16} className="text-[#555]" />
        <h2 className="text-lg font-semibold text-white">Hiệu suất team</h2>
        <span className="ml-1 text-xs text-[#555]">tháng này</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-[#555] uppercase tracking-widest border-b border-[#1a1a1a]">
              <th className="pb-2 text-left font-medium w-8">#</th>
              <th className="pb-2 text-left font-medium">Sales</th>
              <th className="pb-2 text-right font-medium">Leads</th>
              <th className="pb-2 text-right font-medium">Pipeline</th>
              <th className="pb-2 text-right font-medium">Won / tháng</th>
              <th className="pb-2 text-right font-medium">Overdue</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, idx) => (
              <tr
                key={row.userId}
                onClick={() => router.push(`/leads?owner=${row.userId}`)}
                className="border-b border-[#1a1a1a] last:border-0 cursor-pointer hover:bg-[#ffffff08] transition-colors"
              >
                {/* Rank */}
                <td className="py-3 pr-2 text-base">
                  {idx < 3 ? medals[idx] : (
                    <span className="text-xs text-[#444]">{idx + 1}</span>
                  )}
                </td>

                {/* Name */}
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 shrink-0 rounded-full bg-[#1a1a1a] flex items-center justify-center text-xs font-bold text-[#DFFF00]">
                      {row.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-white font-medium truncate max-w-[120px]">{row.name}</span>
                  </div>
                </td>

                {/* Leads đang có */}
                <td className="py-3 text-right tabular-nums">
                  <span className={row.leads === 0 ? 'text-[#444]' : 'text-white'}>
                    {row.leads}
                  </span>
                </td>

                {/* Pipeline value */}
                <td className="py-3 text-right tabular-nums text-[#888]">
                  {row.pipeline > 0
                    ? formatCurrencyFull(row.pipeline).replace('$', '')
                    : <span className="text-[#444]">—</span>
                  }
                </td>

                {/* Won tháng này */}
                <td className="py-3 text-right tabular-nums">
                  {row.wonCount > 0 ? (
                    <div className="flex flex-col items-end">
                      <span className="text-[#DFFF00] font-semibold flex items-center gap-1">
                        <TrendingUp size={11} />
                        {formatCurrencyFull(row.wonValue).replace('$', '')}
                      </span>
                      <span className="text-[#555] text-xs">{row.wonCount} deal</span>
                    </div>
                  ) : (
                    <span className="text-[#444]">—</span>
                  )}
                </td>

                {/* Overdue tasks */}
                <td className="py-3 text-right tabular-nums">
                  {row.overdueCount > 0 ? (
                    <span className="flex items-center justify-end gap-1 text-[#EF4444]">
                      <AlertTriangle size={11} />
                      {row.overdueCount}
                    </span>
                  ) : (
                    <span className="text-[#444]">0</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
