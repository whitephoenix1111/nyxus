export type OpportunityStatus = 'Lead' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';

export interface Opportunity {
  id: string;
  clientName: string;
  company: string;
  avatar: string;
  value: number;
  status: OpportunityStatus;
  date: string;
  lastContactDate: string;
  confidence: number;
  notes?: string;
  statusHistory?: Array<{
    from: OpportunityStatus;
    to: OpportunityStatus;
    date: string;
    activityId?: string;
  }>;
}

export type ClientTag = 'enterprise' | 'mid-market' | 'priority' | 'warm' | 'cold' | 'new-lead';

export interface Client {
  id: string;
  name: string;
  company: string;
  avatar: string;
  email: string;
  phone: string;
  industry: string;
  country: string;
  website: string;
  tags: ClientTag[];
  notes: string;
  createdAt: string;
}

export interface ClientWithStats extends Client {
  totalValue: number;
  opportunityCount: number;
  topStatus: OpportunityStatus | null;
  forecastValue: number;
  opportunities: Opportunity[];
}

// ── Activities ────────────────────────────────────────────────────

export type ActivityType = 'call' | 'email' | 'meeting' | 'demo' | 'note';
export type ActivityOutcome = 'positive' | 'neutral' | 'negative';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  date: string;              // ISO 8601: "2025-07-15"
  clientId: string;          // ref → clients.json
  clientName: string;        // denormalized — tránh join mỗi lần render
  company: string;           // denormalized
  opportunityId?: string;    // optional ref → opportunities.json
  promoteOpportunityTo?: OpportunityStatus; // nếu có → tự promote opportunity khi lưu
  outcome: ActivityOutcome;
  nextAction: string;        // bước tiếp theo cần làm
  notes: string;
  createdAt: string;
}

// ── Misc ──────────────────────────────────────────────────────────

export interface ReminderAlert {
  id: string;
  type: 'stale_lead' | 'no_contact' | 'expiring_proposal';
  count: number;
  label: string;
  description: string;
}
