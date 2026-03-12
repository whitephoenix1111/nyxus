'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

// Map reminder type → trang đích
const REMINDER_HREF: Record<string, string> = {
  overdue_task:      '/activities',
  stale_deal:        '/activities',
  expiring_proposal: '/opportunities',
};

interface ReminderCardProps {
  count: number;
  label: string;
  description: string;
  accentColor?: string;
  type?: string;   // 'overdue_task' | 'stale_deal' | 'expiring_proposal'
}

export default function ReminderCard({
  count,
  description,
  accentColor = '#DFFF00',
  type,
}: ReminderCardProps) {
  const href = (type && REMINDER_HREF[type]) ?? '/activities';

  return (
    <div className="rounded-2xl bg-[#111] p-4 hover:bg-[#161616] transition-colors">
      <div className="flex items-start justify-between">
        {/* Icon ring */}
        <div className="relative h-9 w-9 shrink-0">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" stroke="#222" strokeWidth="2.5" />
            <circle
              cx="18" cy="18" r="15"
              fill="none"
              stroke={accentColor}
              strokeWidth="2.5"
              strokeDasharray={`${2 * Math.PI * 15 * 0.7} ${2 * Math.PI * 15}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
          </div>
        </div>

        {/* Arrow link */}
        <Link
          href={href}
          className="text-[#444] hover:text-white transition-colors"
          title="Xem chi tiết"
        >
          <ArrowUpRight size={16} />
        </Link>
      </div>

      <p className="mt-3 text-3xl font-bold text-white tabular-nums">{count}</p>
      <p className="mt-1 text-xs text-[#555] leading-relaxed">{description}</p>
    </div>
  );
}
