# LLD — Data Types & JSON Schema

> File tiếp theo: `lld-data-api.md`

---

## 1. TypeScript Types (`src/types/index.ts`)

```typescript
export type OpportunityStatus = 'Lead' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';

export const STAGE_DEFAULT_CONFIDENCE: Record<OpportunityStatus, number> = {
  Lead: 15, Qualified: 35, Proposal: 60, Negotiation: 80, Won: 100, Lost: 0,
};

export const STAGE_CONFIDENCE_RANGE: Record<OpportunityStatus, number | null> = {
  Lead: null, Qualified: 15, Proposal: 15, Negotiation: 10, Won: null, Lost: null,
};

export interface Opportunity {
  id: string;
  clientId: string;              // hard FK → Client.id
  clientName: string;            // denormalized
  company: string;               // denormalized
  avatar: string;
  value: number;
  status: OpportunityStatus;
  date: string;                  // ISO 8601
  lastContactDate: string;       // ISO 8601 — cập nhật mỗi khi ghi Activity
  confidence: number;            // mặc định theo stage, fine-tune trong range
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
  isProspect: boolean;           // true = Lead chưa qualify, false = Client thật
  createdAt: string;
}

export interface ClientWithStats extends Client {
  totalValue: number;
  opportunityCount: number;
  topStatus: OpportunityStatus | null;
  forecastValue: number;
  opportunities: Opportunity[];
}

export type ActivityType = 'call' | 'email' | 'meeting' | 'demo' | 'note';
export type ActivityOutcome = 'positive' | 'neutral' | 'negative';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  date: string;
  clientId: string;
  clientName: string;
  company: string;
  opportunityId?: string;
  outcome: ActivityOutcome;
  nextAction: string;
  nextActionDate?: string;       // ISO 8601 — due date thật, tạo reminder khi đến hạn
  promoteOpportunityTo?: OpportunityStatus;
  notes: string;
  createdAt: string;
}

export interface ReminderAlert {
  id: string;
  type: 'overdue_task' | 'stale_deal' | 'expiring_proposal';
  count: number;
  label: string;
  description: string;
}
```

---

## 2. JSON Schema Examples

### `data/opportunities.json`
```json
{
  "id": "opp-001",
  "clientId": "cli-001",
  "clientName": "Tommy Cox",
  "company": "Tech Solution, Inc.",
  "avatar": "TC",
  "value": 120600,
  "status": "Won",
  "date": "2025-01-10",
  "lastContactDate": "2025-01-08",
  "confidence": 100
}
```

### `data/clients.json`
```json
{
  "id": "cli-001",
  "name": "Tommy Cox",
  "company": "Tech Solution, Inc.",
  "avatar": "TC",
  "email": "tommy.cox@techsolution.com",
  "phone": "+1 (415) 882-3301",
  "industry": "Technology",
  "country": "USA",
  "website": "techsolution.com",
  "tags": ["enterprise", "priority"],
  "notes": "Long-term partner.",
  "isProspect": false,
  "createdAt": "2024-09-15"
}
```

### `data/activities.json`
```json
{
  "id": "act-001",
  "type": "call",
  "title": "Gọi tư vấn gói Enterprise Q1",
  "date": "2025-01-08",
  "clientId": "cli-001",
  "clientName": "Tommy Cox",
  "company": "Tech Solution, Inc.",
  "opportunityId": "opp-001",
  "outcome": "positive",
  "nextAction": "Gửi hợp đồng để ký",
  "nextActionDate": "2025-01-12",
  "notes": "Khách hàng đồng ý với mức giá.",
  "createdAt": "2025-01-08"
}
```

---

## 3. JSON Read/Write Helper

```typescript
// src/lib/json-db.ts
import fs from 'fs/promises';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');

export async function readJSON<T>(filename: string): Promise<T> {
  const raw = await fs.readFile(path.join(dataDir, filename), 'utf-8');
  return JSON.parse(raw) as T;
}

export async function writeJSON<T>(filename: string, data: T): Promise<void> {
  await fs.writeFile(path.join(dataDir, filename), JSON.stringify(data, null, 2), 'utf-8');
}
```
