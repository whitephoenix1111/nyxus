# LLD — Data Layer

---

## 1. TypeScript Interfaces

```typescript
// src/types/index.ts

export type OpportunityStatus = 'Lead' | 'Proposal' | 'Forecast' | 'Order';

export interface Opportunity {
  id: string;                    // uuid v4
  clientName: string;
  company: string;
  avatar: string;                // URL hoặc initials string
  value: number;                 // USD, integer
  status: OpportunityStatus;
  date: string;                  // ISO 8601: "2025-07-15"
  lastContactDate: string;       // ISO 8601 — dùng cho Reminders logic
  confidence: number;            // 0–100 (%)
  notes?: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  avatar: string;
  totalValue: number;            // Sum of all won opportunities
  opportunityCount: number;
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
    "date": "2025-07-10",
    "lastContactDate": "2025-07-08",
    "confidence": 100
  },
  {
    "id": "opp-002",
    "clientName": "Elliot Burke",
    "company": "Quantum Solutions",
    "avatar": "EB",
    "value": 80000,
    "status": "Forecast",
    "date": "2025-06-22",
    "lastContactDate": "2025-06-20",
    "confidence": 75
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
    "totalValue": 120600,
    "opportunityCount": 3
  }
]
```

---

## 3. API Routes

### `GET /api/opportunities`
- Đọc `/data/opportunities.json`
- Returns: `Opportunity[]`
- Query params: `?status=Lead` (optional filter)

### `POST /api/opportunities`
- Body: `Omit<Opportunity, 'id'>` — id tự sinh bằng `crypto.randomUUID()`
- Append vào JSON file
- Returns: `Opportunity` (với id mới)

### `PATCH /api/opportunities/[id]`
- Body: `Partial<Opportunity>`
- Update record by id trong JSON file
- Returns: `Opportunity` (đã update)

### `DELETE /api/opportunities/[id]`
- Xóa record by id
- Returns: `{ success: true }`

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
