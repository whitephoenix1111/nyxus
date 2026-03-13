# LLD — API Routes

> File trước: `lld-data-types.md` · File tiếp theo: `lld-store.md`

---

## 1. Auth

| Method | Path | Mô tả |
|---|---|---|
| POST | `/api/auth/login` | Body: `{ email, password }` — set JWT `httpOnly` cookie `nyxus_session` TTL 8h |
| GET | `/api/auth/me` | Trả về session user hiện tại (không có `passwordHash`) |
| POST | `/api/auth/logout` | Clear cookie |

---

## 2. Users

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/users` | Không trả `passwordHash`. Filter: `?role=salesperson\|manager` |

---

## 3. Leads — entry point duy nhất tạo Lead mới

### `POST /api/leads`

**Body**: `{ name, company, email?, phone?, avatar?, value, notes?, ownerId }`

**Returns**: `{ client: Client, opportunity: Opportunity }`

**Logic**:
1. Tạo `Client` với `isProspect: true`, `ownerId = body.ownerId`
2. Tạo `Opportunity` với `status: 'Lead'`, `confidence: 15`, `clientId` liên kết chặt

### `PATCH /api/leads/[id]/assign`

**Guard**: Manager only

**Body**: `{ ownerId: string }`

Cập nhật `client.ownerId` và `opportunity.ownerId` đồng thời.

---

## 4. Opportunities

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/opportunities` | Filter: `?status=`, `?clientId=` |
| POST | `/api/opportunities` | Internal only — UI không gọi trực tiếp (dùng `/api/leads`) |
| GET | `/api/opportunities/[id]` | — |
| PATCH | `/api/opportunities/[id]` | Partial update |
| DELETE | `/api/opportunities/[id]` | — |

---

## 5. Clients

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/clients` | Filter: `?industry=`, `?tag=`, `?search=`, `?isProspect=` — không trả `archivedAt` records |
| POST | `/api/clients` | Tạo client thủ công (không qua `/api/leads`) |
| GET | `/api/clients/[id]` | — |
| PATCH | `/api/clients/[id]` | Partial update |
| DELETE | `/api/clients/[id]` | **Soft delete** — xem logic bên dưới. **Guard**: Manager only |
| POST | `/api/clients/existing` | Import khách hàng cũ: tạo `Client (isProspect: false)` + `Opportunity (Won, 100%)` |

### DELETE `/api/clients/[id]` — side effects

```
1. client.archivedAt = today
2. Cascade xóa:
   - opportunities có status ≠ 'Won'
   - tasks có status = 'pending'
3. Giữ lại:
   - activities (tất cả)
   - tasks có status = 'done'
   - opportunities có status = 'Won'
```

---

## 6. Activities — POST có side effects

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/activities` | Filter: `?type=`, `?outcome=`, `?clientId=`, `?search=` |
| POST | `/api/activities` | Xem side effects bên dưới |
| GET | `/api/activities/[id]` | — |
| PATCH | `/api/activities/[id]` | — |
| DELETE | `/api/activities/[id]` | — |

### POST `/api/activities` — side effects (atomic)

```
1. Lưu activity mới vào activities.json
2. PATCH opportunity.lastContactDate = activity.date
3. Nếu body.promoteOpportunityTo có giá trị:
   a. PATCH opportunity.status = newStatus
   b. PATCH opportunity.confidence = STAGE_DEFAULT_CONFIDENCE[newStatus]
   c. Append vào opportunity.statusHistory: { from, to, date, activityId }
   d. Nếu newStatus === 'Qualified': PATCH client.isProspect = false
4. Nếu body.nextAction có giá trị: trả về flag để UI hỏi tạo Task follow-up
```

---

## 7. Tasks

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/tasks` | Filter: `?clientId=`, `?opportunityId=`, `?status=` |
| POST | `/api/tasks` | — |
| PATCH | `/api/tasks/[id]` | Auto set `completedAt = now` khi `status → done`; clear khi `status → pending` |
| DELETE | `/api/tasks/[id]` | — |

---

## 8. Documents

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/documents` | Filter theo `client.ownerId === me` (salesperson) hoặc all (manager). Filter: `?clientId=`, `?category=` |
| POST | `/api/documents` | Metadata only — `url` có thể là `null` (placeholder) |
| PATCH | `/api/documents/[id]` | **Guard**: `client.ownerId === me` hoặc manager |
| DELETE | `/api/documents/[id]` | **Guard**: `client.ownerId === me` hoặc manager |

---

## 9. Guard Rules — tổng hợp

| Endpoint | Salesperson (owner) | Salesperson (non-owner) | Manager |
|---|:---:|:---:|:---:|
| GET any resource | ✅ (filter own) | ❌ | ✅ (all) |
| POST lead/activity/task/doc | ✅ | ✅ | ✅ |
| PATCH opp/activity/task | ✅ | ❌ | ✅ |
| PATCH/DELETE document | ✅ | ❌ | ✅ |
| DELETE client (soft) | ❌ | ❌ | ✅ |
| PATCH lead/assign | ❌ | ❌ | ✅ |

`requireSession()` — tất cả API routes
`requireRole('manager')` — DELETE client, PATCH assign, GET /forecast
