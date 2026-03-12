// ── Opportunity Status ────────────────────────────────────────────

export type OpportunityStatus = 'Lead' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';

// Confidence mặc định khi promote vào stage mới
// Lead và Won/Lost là cố định, không cho phép override
export const STAGE_DEFAULT_CONFIDENCE: Record<OpportunityStatus, number> = {
  Lead:        15,
  Qualified:   35,
  Proposal:    60,
  Negotiation: 80,
  Won:         100,
  Lost:        0,
};

// Range fine-tune cho phép (±) — null = không cho phép override
export const STAGE_CONFIDENCE_RANGE: Record<OpportunityStatus, number | null> = {
  Lead:        null,  // cố định 15%
  Qualified:   15,    // 20–50%
  Proposal:    15,    // 45–75%
  Negotiation: 10,    // 70–90%
  Won:         null,  // cố định 100%
  Lost:        null,  // cố định 0%
};

export interface Opportunity {
  id: string;
  clientId: string;              // hard FK → Client.id (không join bằng company name)
  clientName: string;            // denormalized để tránh join mỗi render
  company: string;               // denormalized
  avatar: string;
  value: number;                 // USD, integer
  status: OpportunityStatus;
  date: string;                  // ISO 8601: "2025-07-15"
  lastContactDate: string;       // ISO 8601 — cập nhật mỗi khi ghi Activity
  confidence: number;            // 0–100 (%) — mặc định theo stage, fine-tune trong range
  notes?: string;
  statusHistory?: Array<{        // lịch sử promote, append-only
    from: OpportunityStatus;
    to: OpportunityStatus;
    date: string;
    activityId?: string;
  }>;
}

// ── Client ───────────────────────────────────────────────────────

export type ClientTag = 'enterprise' | 'mid-market' | 'priority' | 'warm' | 'cold' | 'new-lead';

export interface Client {
  id: string;
  name: string;
  company: string;
  avatar: string;
  email: string;
  phone: string;
  industry: string;              // English key — dịch sang VI ở UI layer
  country: string;
  website: string;
  tags: ClientTag[];
  notes: string;
  isProspect: boolean;           // true = Lead chưa qualify, false = Client thật (activated)
  createdAt: string;             // ISO date: "2025-09-15"
}

// Derived type — computed bằng cách join Client + Opportunities qua clientId
export interface ClientWithStats extends Client {
  totalValue: number;
  opportunityCount: number;
  topStatus: OpportunityStatus | null;
  forecastValue: number;         // SUM(value * confidence/100)
  opportunities: Opportunity[];
}

// ── Activities ────────────────────────────────────────────────────

export type ActivityType = 'call' | 'email' | 'meeting' | 'demo' | 'note';
export type ActivityOutcome = 'positive' | 'neutral' | 'negative';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  date: string;                  // ISO 8601 — khi activity xảy ra
  clientId: string;              // hard FK → Client.id
  clientName: string;            // denormalized
  company: string;               // denormalized
  opportunityId?: string;        // optional — có thể ghi activity không gắn deal
  outcome: ActivityOutcome;
  nextAction: string;            // mô tả bước tiếp theo (text)
  nextActionDate?: string;       // ISO 8601 — due date thật, tạo reminder khi đến hạn
  promoteOpportunityTo?: OpportunityStatus; // nếu có → API tự promote khi lưu
  notes: string;
  createdAt: string;
}

// ── Tasks ───────────────────────────────────────────────────────────

export type TaskStatus = 'pending' | 'done';

export interface Task {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  company: string;
  opportunityId?: string;
  dueDate?: string;              // ISO 8601 — ngày đến hạn
  status: TaskStatus;
  assignedTo?: string;           // text tự do, chưa có auth
  createdFrom?: string;          // activityId nếu auto-created từ nextAction
  notes?: string;
  createdAt: string;             // ISO 8601
  completedAt?: string;          // ISO 8601 — set khi status → done
}

// ── Misc ──────────────────────────────────────────────────────────

export interface ReminderAlert {
  id: string;
  type: 'overdue_task' | 'stale_deal' | 'expiring_proposal';
  count: number;
  label: string;
  description: string;
}
