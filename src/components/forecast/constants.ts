import type { OpportunityStatus } from '@/types';

export const STATUS_CONFIG: Record<OpportunityStatus, { bar: string; label: string }> = {
  Lead:        { bar: '#555555', label: 'Tiềm năng' },
  Qualified:   { bar: '#5BA3F5', label: 'Đủ điều kiện' },
  Proposal:    { bar: '#F5A742', label: 'Đề xuất' },
  Negotiation: { bar: '#F5C842', label: 'Thương lượng' },
  Won:         { bar: '#DFFF00', label: 'Chốt đơn' },
  Lost:        { bar: '#EF4444', label: 'Thất bại' },
};

export function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}
