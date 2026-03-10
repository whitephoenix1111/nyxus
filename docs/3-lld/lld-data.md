# LLD — Data Layer

---

## 1. TypeScript Interfaces

```typescript
// src/types/index.ts

export type OpportunityStatus = 'Lead' | 'Proposal' | 'Forecast' | 'Order';

export interface Opportunity {
  id: string;
  clientName: string;
  company: string;
  avatar: string;                // initials string (e.g. "TC")
  value: number;                 // USD, integer
  status: OpportunityStatus;
  date: string;                  // ISO 8601: "2025-07-15"
  lastContactDate: string;       // ISO 8601 — dùng cho Reminders logic
  confidence: number;            // 0–100 (%)
  notes?: string;
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
  createdAt: string;             // ISO date: "2025-09-15"
}

// Derived type — computed bằng cách join Client + Opportunities (match theo company)
export interface ClientWithStats extends Client {
  totalValue: number;
  opportunityCount: number;
  topStatus: OpportunityStatus | null;
  forecastValue: number;         // SUM(value * confidence/100)
  opportunities: Opportunity[];
}

export interface ReminderAlert {
  id: string;
  type: 'stale_lead' | 'no_contact' | 'expiring_proposal';
  count: number;
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
    "clientName": "Tommy Cox",
    "company": "Tech Solution, Inc.",
    "avatar": "TC",
    "value": 120600,
    "status": "Order",
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
    "createdAt": "2024-09-15"
  }
]
```

> **Lưu ý join:** `ClientWithStats` được tính runtime bằng cách match `client.company` với `opportunity.company` (case-insensitive). Không có foreign key cứng.

---

## 3. API Routes

### Opportunities

| Method | Path | Body | Returns |
|--------|------|------|---------|
| GET | `/api/opportunities` | — | `Opportunity[]` (filter: `?status=`) |
| POST | `/api/opportunities` | `Omit<Opportunity, 'id'>` | `Opportunity` |
| PATCH | `/api/opportunities/[id]` | `Partial<Opportunity>` | `Opportunity` |
| DELETE | `/api/opportunities/[id]` | — | `{ success: true }` |

### Clients

| Method | Path | Body | Returns |
|--------|------|------|---------|
| GET | `/api/clients` | — | `Client[]` (filter: `?industry=`, `?tag=`, `?search=`) |
| POST | `/api/clients` | `Omit<Client, 'id' \| 'createdAt'>` | `Client` |
| GET | `/api/clients/[id]` | — | `Client` |
| PATCH | `/api/clients/[id]` | `Partial<Client>` | `Client` |
| DELETE | `/api/clients/[id]` | — | `{ success: true }` |

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
| `useOpportunityStore.ts` | `opportunities[]` | `useStatsByStatus`, `useMonthlyChartData`, `useForecastRevenue`, `useTopClients`, `useStaleLeads` |
| `useClientStore.ts` | `clients[]` | `useClientsWithStats(opps)`, `useClientIndustries()`, `useTopClientsByValue(opps, limit)` |
