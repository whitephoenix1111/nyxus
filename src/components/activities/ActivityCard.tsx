'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, Calendar, ArrowRight, Clock, Trash2, AlertTriangle } from 'lucide-react';
import type { Activity as ActivityType } from '@/types';
import { TYPE_CONFIG, OUTCOME_CONFIG, formatDate, relativeDate, isOverdue } from './constants';
import { OwnerBadge } from '@/components/ui/OwnerBadge';
import { useIsManager } from '@/store/useAuthStore';

function TypeBadge({ type }: { type: ActivityType['type'] }) {
  const c = TYPE_CONFIG[type];
  const Icon = c.icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: c.bg, color: c.color }}>
      <Icon size={10} />{c.label}
    </span>
  );
}

function OutcomeBadge({ outcome }: { outcome: ActivityType['outcome'] }) {
  const c = OUTCOME_CONFIG[outcome];
  const Icon = c.icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      <Icon size={10} />{c.label}
    </span>
  );
}

// nextActionDate badge — vàng nếu sắp đến, đỏ nếu quá hạn
function NextActionDateBadge({ date }: { date: string }) {
  const overdue = isOverdue(date);

  /**
   * Tính số ngày còn lại / đã quá hạn so với hôm nay.
   * Dùng useMemo thay vì gọi Date.now() trực tiếp trong render —
   * React Strict Mode cấm gọi Date.now() trực tiếp vì là impure function
   * (kết quả thay đổi mỗi lần gọi, gây render không ổn định).
   * useMemo đảm bảo giá trị chỉ tính lại khi `date` prop thay đổi.
   */
  const daysLeft = useMemo(() => {
    const now = new Date();
    return Math.ceil((new Date(date).getTime() - now.getTime()) / 86400000);
  }, [date]);

  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        background: overdue ? '#1C0505' : '#1A1400',
        color:      overdue ? '#EF4444' : '#F5C842',
        border:     `1px solid ${overdue ? '#7f1d1d' : '#3A3000'}`,
      }}>
      <AlertTriangle size={10} />
      {overdue
        ? `Quá hạn ${Math.abs(daysLeft)}n`
        : daysLeft === 0 ? 'Hôm nay' : `Còn ${daysLeft}n`}
    </span>
  );
}

export function ActivityCard({
  activity,
  clientName,
  clientCompany,
  clientOwnerId,
  onDelete,
}: {
  activity: ActivityType;
  /** Join từ clients[activity.clientId].name — không lấy từ activity.clientName (đã xóa) */
  clientName: string;
  /** Join từ clients[activity.clientId].company — không lấy từ activity.company (đã xóa) */
  clientCompany: string;
  /** Join từ clients[activity.clientId].ownerId — để hiện OwnerBadge cho manager */
  clientOwnerId: string;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isManager = useIsManager();
  const cfg  = TYPE_CONFIG[activity.type];
  const Icon = cfg.icon;

  return (
    <div className="rounded-2xl transition-all"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>

      {/* Main row */}
      <div className="flex items-start gap-4 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-0.5"
          style={{ background: cfg.bg, color: cfg.color }}>
          <Icon size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
              {activity.title}
            </p>
            <div className="flex items-center gap-1.5 shrink-0">
              <OutcomeBadge outcome={activity.outcome} />
              {activity.nextActionDate && <NextActionDateBadge date={activity.nextActionDate} />}
              <button onClick={() => setExpanded(e => !e)}
                className="rounded-lg p-1 transition-colors hover:bg-white/5"
                style={{ color: 'var(--color-text-disabled)' }}>
                <ChevronDown size={13} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <TypeBadge type={activity.type} />
            {/* clientName/company join từ caller — không lấy từ activity (field đã xóa) */}
            <span className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>{clientName}</span>
            <span style={{ color: 'var(--color-text-disabled)' }}>·</span>
            <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>{clientCompany}</span>
            <span style={{ color: 'var(--color-text-disabled)' }}>·</span>
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-faint)' }}>
              <Calendar size={10} />
              {formatDate(activity.date)}
              <span className="ml-0.5" style={{ color: 'var(--color-text-disabled)' }}>
                ({relativeDate(activity.date)})
              </span>
            </span>
            {/* Manager: hiện avatar + tên sales phụ trách — join từ client.ownerId */}
            {isManager && <OwnerBadge ownerId={clientOwnerId} size="sm" />}
          </div>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 space-y-3"
          style={{ borderTop: '1px solid var(--color-border)' }}>
          {activity.notes && (
            <div className="pt-3">
              <p className="text-xs uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-faint)' }}>Ghi chú</p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-tertiary)' }}>{activity.notes}</p>
            </div>
          )}
          {activity.nextAction && (
            <div className="flex items-start gap-2 rounded-xl p-3"
              style={{ background: 'var(--color-brand-muted)', border: '1px solid var(--color-brand-border)' }}>
              <ArrowRight size={13} className="mt-0.5 shrink-0" style={{ color: 'var(--color-brand)' }} />
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-brand)' }}>Bước tiếp theo</p>
                  {activity.nextActionDate && (
                    <span className="text-xs font-mono" style={{ color: isOverdue(activity.nextActionDate) ? '#EF4444' : '#F5C842' }}>
                      · {new Date(activity.nextActionDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                  )}
                </div>
                <p className="text-sm" style={{ color: 'var(--color-text-body)' }}>{activity.nextAction}</p>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between pt-1">
            {activity.opportunityId && (
              <span className="text-xs font-mono" style={{ color: 'var(--color-text-disabled)' }}>
                #{activity.opportunityId}
              </span>
            )}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--color-text-disabled)' }}>
                <Clock size={10} className="inline mr-1" />Tạo {formatDate(activity.createdAt)}
              </span>
              <button onClick={() => onDelete(activity.id)}
                className="flex items-center gap-1 text-xs transition-colors hover:text-red-400"
                style={{ color: 'var(--color-text-disabled)' }}>
                <Trash2 size={11} /> Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
