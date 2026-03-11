# LLD — API Routes

> File trước: `lld-data-types.md`

---

## 1. `POST /api/leads` — entry point duy nhất tạo Lead mới

**Body**: `{ name, company, email?, phone?, avatar?, value, notes? }`
**Returns**: `{ client: Client, opportunity: Opportunity }`

Tạo đồng thời:
- `Client` với `isProspect: true`
- `Opportunity` với `status: Lead`, `confidence: 15%`, `clientId` liên kết chặt

---

## 2. Opportunities

| Method | Path | Notes |
|---|---|---|
| GET | `/api/opportunities` | filter: `?status=`, `?clientId=` |
| PATCH | `/api/opportunities/[id]` | partial update |
| DELETE | `/api/opportunities/[id]` | — |

POST internal only — UI không gọi trực tiếp.

---

## 3. Clients

| Method | Path | Notes |
|---|---|---|
| GET | `/api/clients` | filter: `?industry=`, `?tag=`, `?search=`, `?isProspect=` |
| POST | `/api/clients` | tạo client thủ công (không qua /api/leads) |
| GET | `/api/clients/[id]` | — |
| PATCH | `/api/clients/[id]` | partial update |
| DELETE | `/api/clients/[id]` | — |

---

## 4. Activities — POST có side effects

| Method | Path | Notes |
|---|---|---|
| GET | `/api/activities` | filter: `?type=`, `?outcome=`, `?clientId=`, `?search=` |
| POST | `/api/activities` | xem side effects bên dưới |
| PATCH | `/api/activities/[id]` | — |
| DELETE | `/api/activities/[id]` | — |

**POST side effects (atomic):**
1. Lưu activity mới
2. `PATCH opportunity.lastContactDate = activity.date`
3. Nếu `promoteOpportunityTo` có giá trị:
   - `PATCH opportunity.status` = newStatus
   - `PATCH opportunity.confidence` = `STAGE_DEFAULT_CONFIDENCE[newStatus]`
   - Append `statusHistory` entry
   - Nếu newStatus === `'Qualified'`: `PATCH client.isProspect = false`

---

## 5. Reminders logic (client-side selector `useReminders`)

| Type | Điều kiện |
|---|---|
| `overdue_task` | activity có `nextActionDate < today`, opportunity chưa có activity mới hơn |
| `stale_deal` | `lastContactDate > 3 ngày`, status ∈ [Lead, Qualified, Proposal], không có pending task |
| `expiring_proposal` | status = Proposal, `lastContactDate > 14 ngày` |
