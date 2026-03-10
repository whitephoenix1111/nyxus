# LLD — Data Layer

---

## 1. TypeScript Interfaces

```typescript
// src/types/index.ts

export type OpportunityStatus = 'Lead' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';

// Confidence mặc định khi promote vào stage mới
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
  clientId: string;              // hard ref đến Client.id (không join bằng company name)
  clientName: string;            // denormalized để tránh join mỗi render
  company: string;               // denormalized
  avatar: string;                // initials string (e.g. "TC")
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

export type ClientTag = 'enterprise' | 'mid-market' | 'priority' | 'warm' | 'cold' | 'new-lead';

export interface Client {
  id: string;
  name: string;
  company: string;
  avatar: string;                // initials string
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

export type ActivityType = 'call' | 'email' | 'meeting' | 'demo' | 'note';
export type ActivityOutcome = 'positive' | 'neutral' | 'negative';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  date: string;                  // ISO 8601 — khi activity xảy ra
  clientId: string;              // hard ref đến Client.id
  clientName: string;            // denormalized
  company: string;               // denormalized
  opportunityId?: string;        // optional — có thể ghi activity không gắn deal
  outcome: ActivityOutcome;
  nextAction: string;            // mô tả bước tiếp theo (text)
  nextActionDate?: string;       // ISO 8601 — due date thật, tạo reminder khi đến hạn
  notes?: string;
  promoteOpportunityTo?: OpportunityStatus;  // nếu có → API tự promote khi lưu
  createdAt: string;
}

export interface ReminderAlert {
  id: string;
  type: 'overdue_task' | 'stale_deal' | 'expiring_proposal';
  opportunityId: string;
  clientName: string;
  company: string;
  daysOverdue?: number;          // cho overdue_task và stale_deal
  label: string;
  description: string;
}
```

---

## 2. JSON File Structure

### `/data/opportunities.json`
```json
[
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
]
```

### `/data/clients.json`
```json
[
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
]
```

### `/data/activities.json`
```json
[
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
]
```

> **Quan hệ**: `Opportunity.clientId` → `Client.id` (hard FK). `Activity.clientId` → `Client.id`. Không còn join bằng `company` name — tránh sai khi tên công ty có dấu cách hoặc viết khác nhau.

---

## 3. API Routes

### Leads (entry point mới — tạo đồng thời Client + Opportunity)

| Method | Path | Body | Returns |
|--------|------|------|---------|
| POST | `/api/leads` | `{ name, company, email?, phone?, avatar?, value, notes? }` | `{ client: Client, opportunity: Opportunity }` |

> Khi POST /api/leads: tạo Client (isProspect: true) + Opportunity (status: Lead, confidence: 15%, clientId liên kết chặt). Đây là entry point duy nhất cho lead mới từ UI Leads page.

### Opportunities

| Method | Path | Body | Returns |
|--------|------|------|---------|
| GET | `/api/opportunities` | — | `Opportunity[]` (filter: `?status=`, `?clientId=`) |
| PATCH | `/api/opportunities/[id]` | `Partial<Opportunity>` | `Opportunity` |
| DELETE | `/api/opportunities/[id]` | — | `{ success: true }` |

> POST trực tiếp vào `/api/opportunities` chỉ dùng nội bộ (từ `/api/leads` và `/api/activities`). UI không gọi trực tiếp.

### Clients

| Method | Path | Body | Returns |
|--------|------|------|---------|
| GET | `/api/clients` | — | `Client[]` (filter: `?industry=`, `?tag=`, `?search=`, `?isProspect=`) |
| POST | `/api/clients` | `Omit<Client, 'id' \| 'createdAt'>` | `Client` |
| GET | `/api/clients/[id]` | — | `Client` |
| PATCH | `/api/clients/[id]` | `Partial<Client>` | `Client` |
| DELETE | `/api/clients/[id]` | — | `{ success: true }` |

### Activities

| Method | Path | Body | Returns |
|--------|------|------|---------|
| GET | `/api/activities` | — | `Activity[]` (filter: `?type=`, `?outcome=`, `?clientId=`, `?search=`) |
| POST | `/api/activities` | `Omit<Activity, 'id'\|'createdAt'>` | `Activity` + side effects |
| PATCH | `/api/activities/[id]` | `Partial<Activity>` | `Activity` |
| DELETE | `/api/activities/[id]` | — | `{ success: true }` |

**POST /api/activities — side effects (atomic, trong 1 request):**
1. Lưu activity mới vào `activities.json`
2. PATCH `opportunity.lastContactDate = activity.date`
3. Nếu `promoteOpportunityTo` có giá trị:
   - PATCH `opportunity.status` = giá trị mới
   - PATCH `opportunity.confidence` = `STAGE_DEFAULT_CONFIDENCE[newStatus]`
   - Append `statusHistory` entry (with `activityId`)
   - Nếu promote → Qualified: PATCH `client.isProspect = false`

### Reminders

| Method | Path | Returns |
|--------|------|---------|
| GET | `/api/reminders` | `ReminderAlert[]` — tính toán server-side từ 3 nguồn |

**Logic tính Reminders (server-side):**
1. **overdue_task**: Tìm activities có `nextActionDate < today`. Với mỗi activity đó, kiểm tra xem opportunity có activity MỚI HƠN không. Nếu không → overdue.
2. **stale_deal**: Opportunities có `lastContactDate > 3 ngày`, `status` trong `[Lead, Qualified, Proposal]`, và không có `nextActionDate` pending.
3. **expiring_proposal**: Opportunities `status === 'Proposal'` và `lastContactDate > 14 ngày`.

---

## 4. Helper: JSON File Read/Write (Server)

```typescript
// src/lib/json-db.ts
import fs from 'fs/promises';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');

export async function readJSON<T>(filename: string): Promise<T> {
  const filePath = path.join(dataDir, filename);
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

export async function writeJSON<T>(filename: string, data: T): Promise<void> {
  const filePath = path.join(dataDir, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}
```

---

## 5. Stores

| File | Store | Key Selectors |
|------|-------|---------------|
| `useOpportunityStore.ts` | `opportunities[]` | `useStatsByStatus`, `useMonthlyChartData`, `useForecastRevenue`, `useTopClients`, `useStaleLeads`, `useOverdueTasks` |
| `useClientStore.ts` | `clients[]` | `useClientsWithStats(opps)`, `useClientIndustries()`, `useTopClientsByValue(opps, limit)` |
| `useActivityStore.ts` | `activities[]` | `useActivitiesByType`, `useActivitiesByOutcome`, `useRecentActivities`, `useActivitiesForClient` |
