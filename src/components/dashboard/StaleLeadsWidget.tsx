'use client';

import { useMemo } from 'react';
import type { Opportunity } from '@/types';

interface StaleLeadsWidgetProps {
  opportunities: Opportunity[];
}

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export default function StaleLeadsWidget({ opportunities }: StaleLeadsWidgetProps) {
  const staleLeads = useMemo(() => {
    return [...opportunities]
      .filter(o => ['Lead', 'Qualified', 'Proposal'].includes(o.status))
      .sort(
        (a, b) =>
          new Date(a.lastContactDate).getTime() - new Date(b.lastContactDate).getTime()
      )
      .slice(0, 15);
  }, [opportunities]);

  if (staleLeads.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-bold text-white mb-3">Leads cần liên hệ</h2>
        <div className="rounded-2xl border border-[#1a1a1a] bg-[#111] px-4 py-6 text-center">
          <p className="text-sm text-[#555]">Không có lead nào cần liên hệ.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-3">Leads cần liên hệ</h2>
      <div className="flex flex-col gap-2">
        {staleLeads.map(opp => {
          const days = daysSince(opp.lastContactDate);
          const urgent = days >= 3;

          return (
            <div
              key={opp.id}
              className="rounded-xl bg-[#111] hover:bg-[#161616] transition-colors px-3 py-2.5 flex items-center gap-3"
            >
              {/* Avatar */}
              <div className="h-8 w-8 shrink-0 rounded-full bg-[#222] flex items-center justify-center text-xs font-bold text-white">
                {opp.avatar}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{opp.clientName}</p>
                <p className="text-xs text-[#555] truncate">{opp.company}</p>
              </div>

              {/* Stale badge */}
              <div className="shrink-0 text-right">
                <span
                  className={`text-xs font-medium ${
                    urgent ? 'text-[#F5C842]' : 'text-[#555]'
                  }`}
                >
                  {days === 0 ? 'Hôm nay' : `${days} ngày`}
                </span>
                <p className="text-xs text-[#444]">{opp.status}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
