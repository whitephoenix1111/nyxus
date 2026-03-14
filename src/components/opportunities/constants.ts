import type { OpportunityStatus } from '@/types';

export const ALL_STATUSES: OpportunityStatus[] = [
  'Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost',
];

export const STATUS_LABELS: Record<OpportunityStatus, string> = {
  Lead: 'Tiềm năng', Qualified: 'Đủ điều kiện', Proposal: 'Đề xuất',
  Negotiation: 'Thương lượng', Won: 'Chốt đơn', Lost: 'Thất bại',
};

export const STATUS_STYLE: Record<OpportunityStatus, { bg: string; text: string; border: string }> = {
  Lead:        { bg: '#1A1A1A',   text: '#AAAAAA', border: '#333333' },
  Qualified:   { bg: '#0D1B2A',   text: '#5BA3F5', border: '#1A3A5C' },
  Proposal:    { bg: '#1A1000',   text: '#F5A742', border: '#3A2500' },
  Negotiation: { bg: '#1A1400',   text: '#F5C842', border: '#3A3000' },
  Won:         { bg: '#DFFF0015', text: '#DFFF00', border: '#DFFF0044' },
  Lost:        { bg: '#1C0505',   text: '#EF4444', border: '#7f1d1d' },
};

export type SortKey = 'clientName' | 'title' | 'value' | 'status' | 'date' | 'confidence';
export type SortDir = 'asc' | 'desc';
