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

export interface Client {
  id: string;
  name: string;
  company: string;
  avatar: string;
  totalValue: number;
  opportunityCount: number;
}

export interface ReminderAlert {
  id: string;
  type: 'stale_lead' | 'no_contact' | 'expiring_proposal';
  count: number;
  label: string;
  description: string;
}
