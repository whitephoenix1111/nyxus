import type { OpportunityStatus, ClientTag } from '@/types';

export const STATUS_STYLE: Record<OpportunityStatus, { bg: string; text: string; border: string }> = {
  Lead:        { bg: '#1A1A1A',     text: '#AAAAAA', border: '#333333' },
  Qualified:   { bg: '#0D1B2A',     text: '#5BA3F5', border: '#1A3A5C' },
  Proposal:    { bg: '#1A1000',     text: '#F5A742', border: '#3A2500' },
  Negotiation: { bg: '#1A1400',     text: '#F5C842', border: '#3A3000' },
  Won:         { bg: '#DFFF0015',   text: '#DFFF00', border: '#DFFF0044' },
  Lost:        { bg: '#1C0505',     text: '#EF4444', border: '#7f1d1d' },
};

export const STATUS_LABELS: Record<OpportunityStatus, string> = {
  Lead: 'Tiềm năng', Qualified: 'Đủ điều kiện', Proposal: 'Đề xuất',
  Negotiation: 'Thương lượng', Won: 'Chốt đơn', Lost: 'Thất bại',
};

export const TAG_STYLE: Record<ClientTag, { bg: string; text: string }> = {
  enterprise:   { bg: '#1a0a2e', text: '#b388ff' },
  'mid-market': { bg: '#0d1b2a', text: '#5ba3f5' },
  priority:     { bg: 'var(--color-brand-muted)', text: 'var(--color-brand)' },
  warm:         { bg: '#1a0f00', text: '#f5a742' },
  cold:         { bg: 'var(--color-surface-hover)', text: 'var(--color-text-muted)' },
  'new-lead':   { bg: '#001a0f', text: '#42f5a7' },
};

export const TAG_LABELS: Record<ClientTag, string> = {
  'enterprise':   'Doanh nghiệp lớn',
  'mid-market':   'Doanh nghiệp vừa',
  'priority':     'Ưu tiên',
  'warm':         'Tiềm năng cao',
  'cold':         'Tiềm năng thấp',
  'new-lead':     'Lead mới',
};

export const ALL_TAGS: ClientTag[] = ['enterprise', 'mid-market', 'priority', 'warm', 'cold', 'new-lead'];

/** Tags do human gán thủ công — không tính lại bằng computed logic */
export const MANUAL_TAGS: ClientTag[] = ['enterprise', 'mid-market'];

export const INDUSTRIES = [
  'Consulting', 'Defense', 'Design', 'Finance', 'Investment',
  'Logistics', 'Manufacturing', 'Marketing', 'Media',
  'Retail', 'SaaS', 'Technology', 'Venture Capital',
];

export const INDUSTRY_VI: Record<string, string> = {
  'Consulting': 'Tư vấn', 'Defense': 'Quốc phòng', 'Design': 'Thiết kế',
  'Finance': 'Tài chính', 'Investment': 'Đầu tư', 'Logistics': 'Vận tải & Logistics',
  'Manufacturing': 'Sản xuất', 'Marketing': 'Marketing', 'Media': 'Truyền thông',
  'Retail': 'Bán lẻ', 'SaaS': 'Phần mềm (SaaS)', 'Technology': 'Công nghệ',
  'Venture Capital': 'Quỹ đầu tư mạo hiểm',
};

export function viIndustry(ind: string): string { return INDUSTRY_VI[ind] ?? ind; }

export function getInitials(name: string): string {
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}
