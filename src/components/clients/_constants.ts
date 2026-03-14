// src/components/clients/_constants.ts — Style config và helpers dùng trong /clients
// Prefix "_" = internal module, chỉ dùng trong thư mục /clients.
import type { OpportunityStatus, ClientTag } from '@/types';

// ── Opportunity status ────────────────────────────────────────────────────────

/** Màu nền, chữ, border cho badge status trong DetailPanelOpps và ClientCard. */
export const STATUS_STYLE: Record<OpportunityStatus, { bg: string; text: string; border: string }> = {
  Lead:        { bg: '#1A1A1A',     text: '#AAAAAA', border: '#333333' },
  Qualified:   { bg: '#0D1B2A',     text: '#5BA3F5', border: '#1A3A5C' },
  Proposal:    { bg: '#1A1000',     text: '#F5A742', border: '#3A2500' },
  Negotiation: { bg: '#1A1400',     text: '#F5C842', border: '#3A3000' },
  Won:         { bg: '#DFFF0015',   text: '#DFFF00', border: '#DFFF0044' },
  Lost:        { bg: '#1C0505',     text: '#EF4444', border: '#7f1d1d' },
};

/** Nhãn tiếng Việt cho từng status, dùng trong UI hiển thị. */
export const STATUS_LABELS: Record<OpportunityStatus, string> = {
  Lead: 'Tiềm năng', Qualified: 'Đủ điều kiện', Proposal: 'Đề xuất',
  Negotiation: 'Thương lượng', Won: 'Chốt đơn', Lost: 'Thất bại',
};

// ── Client tags ───────────────────────────────────────────────────────────────

/** Màu nền và chữ cho từng tag, dùng trong TagBadge. */
export const TAG_STYLE: Record<ClientTag, { bg: string; text: string }> = {
  enterprise:   { bg: '#1a0a2e', text: '#b388ff' },
  'mid-market': { bg: '#0d1b2a', text: '#5ba3f5' },
  priority:     { bg: 'var(--color-brand-muted)', text: 'var(--color-brand)' },
  warm:         { bg: '#1a0f00', text: '#f5a742' },
  cold:         { bg: 'var(--color-surface-hover)', text: 'var(--color-text-muted)' },
  'new-lead':   { bg: '#001a0f', text: '#42f5a7' },
};

/** Nhãn tiếng Việt cho từng tag, dùng trong tooltip hoặc filter. */
export const TAG_LABELS: Record<ClientTag, string> = {
  'enterprise':   'Doanh nghiệp lớn',
  'mid-market':   'Doanh nghiệp vừa',
  'priority':     'Ưu tiên',
  'warm':         'Tiềm năng cao',
  'cold':         'Tiềm năng thấp',
  'new-lead':     'Lead mới',
};

/** Tất cả tag values, dùng để render danh sách filter/selector. */
export const ALL_TAGS: ClientTag[] = ['enterprise', 'mid-market', 'priority', 'warm', 'cold', 'new-lead'];

/**
 * Tags do người dùng gán thủ công — chỉ có 2 loại này vì chúng mang ý nghĩa
 * phân khúc khách hàng (enterprise/mid-market) mà không thể tính tự động từ data.
 * Các tag còn lại (priority, warm, cold, new-lead) là computed — tính từ value/date,
 * không lưu vào DB và không xuất hiện trong dropdown chọn tag.
 */
export const MANUAL_TAGS: ClientTag[] = ['enterprise', 'mid-market'];

// ── Industry ──────────────────────────────────────────────────────────────────

/** Danh sách ngành nghề hỗ trợ, dùng trong ClientFormModal select. */
export const INDUSTRIES = [
  'Consulting', 'Defense', 'Design', 'Finance', 'Investment',
  'Logistics', 'Manufacturing', 'Marketing', 'Media',
  'Retail', 'SaaS', 'Technology', 'Venture Capital',
];

/** Map ngành nghề tiếng Anh → tiếng Việt để hiển thị trong UI. */
export const INDUSTRY_VI: Record<string, string> = {
  'Consulting': 'Tư vấn', 'Defense': 'Quốc phòng', 'Design': 'Thiết kế',
  'Finance': 'Tài chính', 'Investment': 'Đầu tư', 'Logistics': 'Vận tải & Logistics',
  'Manufacturing': 'Sản xuất', 'Marketing': 'Marketing', 'Media': 'Truyền thông',
  'Retail': 'Bán lẻ', 'SaaS': 'Phần mềm (SaaS)', 'Technology': 'Công nghệ',
  'Venture Capital': 'Quỹ đầu tư mạo hiểm',
};

/** Trả về tên ngành tiếng Việt, fallback về tên gốc nếu không có trong map. */
export function viIndustry(ind: string): string { return INDUSTRY_VI[ind] ?? ind; }

// ── String helpers ────────────────────────────────────────────────────────────

/**
 * Lấy 2 ký tự đầu từ tên để làm avatar initials.
 * Tách theo whitespace, lấy ký tự đầu mỗi từ, giới hạn 2 ký tự, viết hoa.
 */
export function getInitials(name: string): string {
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}
