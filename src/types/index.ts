export type OpportunityStatus = 'Lead' | 'Proposal' | 'Forecast' | 'Order';

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

// Derived type — computed by joining Client + Opportunities
export interface ClientWithStats extends Client {
  totalValue: number;
  opportunityCount: number;
  topStatus: OpportunityStatus | null;
  forecastValue: number;
  opportunities: Opportunity[];
}

export interface ReminderAlert {
  id: string;
  type: 'stale_lead' | 'no_contact' | 'expiring_proposal';
  count: number;
  label: string;
  description: string;
}
