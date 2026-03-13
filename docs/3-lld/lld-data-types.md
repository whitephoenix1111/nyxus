# LLD — Data Types & JSON Schema

> File tiếp theo: `lld-data-api.md`

---

## 1. TypeScript Types (`src/types/index.ts`)

### Opportunity

```typescript
export type OpportunityStatus =
  'Lead' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';

export const STAGE_DEFAULT_CONFIDENCE: Record<OpportunityStatus, number> = {
  Lead: 15,
  Qualified: 35,
  Proposal: 60,
  Negotiation: 80,
  Won: 100,
  Lost: 0,
};

// null = cố định, không override
export const STAGE_CONFIDENCE_RANGE: Record<OpportunityStatus, number | null> = {
  Lead: null,
  Qualified: 15,   // ±15% quanh 35%  →  20–50%
  Proposal: 15,    // ±15% quanh 60%  →  45–75%
  Negotiation: 10, // ±10% quanh 80%  →  70–90%
  Won: null,
  Lost: null,
};

export interface Opportunity {
  id: string;
  clientId: string;           // hard FK → Client.id
  ownerId: string;            // denormalized từ client.ownerId
  clientName: string;         // denormalized
  company: string;            // denormalized
  avatar: string;
  value: number;
  status: OpportunityStatus;
  date: string;               // ISO 8601 — ngày tạo / ngày deal
  lastContactDate: string;    // ISO 8601 — cập nhật mỗi khi ghi Activity
  confidence: number;         // mặc định theo stage, fine-tune trong range
  notes?: string;
  statusHistory?: Array<{
    from: OpportunityStatus;
    to: OpportunityStatus;
    date: string;
    activityId?: string;
  }>;
}
```

### Client

```typescript
export type ClientTag =
  | 'enterprise'   // lưu DB
  | 'mid-market'   // lưu DB
  | 'priority'     // computed — totalValue > $50,000
  | 'warm'         // computed — lastContactDate < 14 ngày
  | 'cold'         // computed — lastContactDate > 30 ngày && không phải new-lead
  | 'new-lead';    // computed — createdAt < 7 ngày

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
  tags: ClientTag[];          // chỉ lưu enterprise / mid-market; computed tags không lưu
  notes: string;
  isProspect: boolean;        // true = Lead chưa qualify; false = Client thật
  ownerId: string;            // FK → User.id — Sales phụ trách
  archivedAt?: string;        // ISO 8601 — soft delete; ẩn khỏi toàn bộ UI
  createdAt: string;          // ISO 8601
}

export interface ClientWithStats extends Client {
  totalValue: number;
  opportunityCount: number;
  topStatus: OpportunityStatus | null;
  forecastValue: number;      // SUM(opp.value × opp.confidence/100)
  opportunities: Opportunity[];
}
```

### Activity

```typescript
export type ActivityType    = 'call' | 'email' | 'meeting' | 'demo' | 'note';
export type ActivityOutcome = 'positive' | 'neutral' | 'negative';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  date: string;               // ISO 8601
  clientId: string;           // FK → Client.id
  clientName: string;         // denormalized
  company: string;            // denormalized
  opportunityId?: string;     // FK → Opportunity.id (optional)
  outcome: ActivityOutcome;
  nextAction: string;         // text mô tả hành động tiếp theo
  nextActionDate?: string;    // ISO 8601 — due date thật → tạo Task / Reminder
  promoteOpportunityTo?: OpportunityStatus;  // promote khi lưu activity
  notes: string;
  createdAt: string;
}
```

### Task

```typescript
export interface Task {
  id: string;
  title: string;
  clientId: string;           // FK → Client.id
  opportunityId?: string;     // FK → Opportunity.id
  dueDate?: string;           // ISO 8601
  status: 'pending' | 'done';
  createdFrom?: string;       // activityId — nếu auto-tạo từ nextAction
  completedAt?: string;       // ISO 8601 — auto set/clear khi PATCH status
  createdAt: string;
}
```

### Document

```typescript
export type DocumentFileType = 'pdf' | 'doc' | 'xls' | 'img' | 'other';
export type DocumentCategory = 'Hợp đồng' | 'Đề xuất' | 'Báo cáo' | 'Hoá đơn';

export interface Document {
  id: string;
  name: string;
  type: DocumentFileType;
  category: DocumentCategory;
  clientId: string;           // FK → Client.id
  opportunityId?: string;     // FK → Opportunity.id (optional)
  url: string | null;         // null = placeholder; không lưu binary
  isStarred: boolean;
  uploadedAt: string;         // ISO 8601
  createdAt: string;
}
```

### User

```typescript
export type UserRole = 'salesperson' | 'manager';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  passwordHash: string;       // plain-text dev; nâng bcrypt khi prod
}
```

### Reminder

```typescript
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
  "ownerId": "usr-001",
  "createdAt": "2024-09-15"
}
```

### `data/opportunities.json`
```json
{
  "id": "opp-001",
  "clientId": "cli-001",
  "ownerId": "usr-001",
  "clientName": "Tommy Cox",
  "company": "Tech Solution, Inc.",
  "avatar": "TC",
  "value": 120600,
  "status": "Won",
  "date": "2025-01-10",
  "lastContactDate": "2025-01-08",
  "confidence": 100,
  "statusHistory": [
    { "from": "Lead", "to": "Qualified", "date": "2024-10-01" },
    { "from": "Qualified", "to": "Proposal", "date": "2024-11-15" },
    { "from": "Proposal", "to": "Won", "date": "2025-01-08", "activityId": "act-001" }
  ]
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
  "promoteOpportunityTo": "Won",
  "notes": "Khách hàng đồng ý với mức giá.",
  "createdAt": "2025-01-08"
}
```

### `data/tasks.json`
```json
{
  "id": "tsk-001",
  "title": "Gửi hợp đồng để ký",
  "clientId": "cli-001",
  "opportunityId": "opp-001",
  "dueDate": "2025-01-12",
  "status": "done",
  "createdFrom": "act-001",
  "completedAt": "2025-01-11",
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
  await fs.writeFile(
    path.join(dataDir, filename),
    JSON.stringify(data, null, 2),
    'utf-8'
  );
}
```
