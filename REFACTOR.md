# Nyxus — Context Briefing
> Next.js App Router · **Neon Postgres** · Zustand stores
> Stack: `src/app/api/` routes · `src/store/` · `src/components/` · `src/lib/` · `src/types/index.ts`
> Refactor hoàn tất 2026-03-14. Migration JSON → Neon hoàn tất 2026-03-17.

---

## Infrastructure

**DB:** Neon Postgres (thay JSON file DB). Connection string trong `.env.local` → `POSTGRES_URL`.
**Schema:** `db/schema.sql` — paste vào Neon SQL Editor để tạo bảng.
**Migration:** `npx tsx db/migrate.ts` — chạy 1 lần, idempotent (`ON CONFLICT DO NOTHING`).
**DB client:** `src/lib/db.ts` (postgres.js, ssl required).
**Query helpers:** `src/lib/queries.ts` — toàn bộ SQL, thay thế `json-db.ts`. Caller không viết raw SQL.

Column naming: DB dùng `snake_case`, app dùng `camelCase` — mapper `rowToXxx()` trong `queries.ts` xử lý.

Lưu ý migrate: activity/task/document có `opportunityId` trỏ tới opp đã hard delete → migrate tự null hóa thay vì crash FK.

---

## Schema — Field đã xóa / đổi tên

| Field cũ | Bảng | Thay bằng |
|---|---|---|
| `isProspect` | clients | `useClientStatus()` selector |
| `lastContactDate` | opportunities | `MAX(activities.date)` tính động |
| `clientName`, `company`, `avatar` | opps, activities, tasks, docs | Join từ `clients[clientId]` |
| `ownerId` | documents | Đổi thành `uploadedBy` |

Field đã thêm: `title: string` vào opportunities · `useClientStatus(): 'active'|'won'|'no-deal'` trong useClientStore · `computeClientTags(client, opps, activities)` — **bắt buộc truyền `activities`**.

---

## Data Model

**6 bảng, 4 layer:** `users · clients` → `opportunities` → `activities · tasks` → `documents`
Mọi bảng neo vào `clientId`. Ownership nằm ở **`client.ownerId`**, không phải resource con.

**Client** — `id, ownerId(FK→User), name, company, avatar(2 initials), email, phone, industry(EN key), country, website, tags(chỉ lưu enterprise|mid-market), notes, createdAt, archivedAt?`

**Opportunity** — `id, clientId, ownerId(copy từ client khi tạo), title, value(USD), status(Lead·Qualified·Proposal·Negotiation·Won·Lost), confidence(0-100), date, notes?, statusHistory?(append-only)`

Confidence mặc định: Lead=15%(fixed) · Qualified=35%(20-50%) · Proposal=60%(45-75%) · Negotiation=80%(70-90%) · Won=100%(fixed) · Lost=0%(fixed)

**Activity** — `id, clientId, opportunityId?, type, title, date, outcome, nextAction, nextActionDate?, promoteOpportunityTo?, notes, createdAt`
→ POST side effect: `promoteOpportunityTo` có giá trị → API tự promote opp.

**Task** — `id, clientId, opportunityId?, title, status, dueDate?, assignedTo?(FK→User.id), createdFrom?(FK→Activity.id), createdAt, completedAt?`
→ `assignedTo` là FK, không còn free text. Salesperson không truyền → API inject `session.id`.

**Document** — `id, clientId, opportunityId?, name, type, category, size, url, starred, uploadedBy(FK→User.id), uploadedAt`
→ Guard PATCH/DELETE qua `client.ownerId`, không qua `doc.uploadedBy`.

**User** — `role: salesperson|manager`. Demo: `sale@nyxus.vn/sale123` · `manager@nyxus.vn/manager123`

---

## Business Rules

### Hiển thị client/lead (không mutually exclusive)
- `≥1 opp Won` → hiện `/clients` (kể cả khi đang có opp active)
- `≥1 opp active` (Lead/Qualified/Proposal/Negotiation) → hiện `/leads` tab "Đang theo dõi"
- Client có Won + deal mới → **xuất hiện ở cả hai trang**
- Chỉ Lost / không có opp → không hiện ở đâu
- `archivedAt` set → chỉ hiện tab "Đã lưu trữ" trong `/clients`, ẩn khỏi mọi nơi khác

### Hai kho lưu trữ — cơ chế khác nhau
| | Lưu trữ Clients | Lưu trữ Leads |
|---|---|---|
| Trigger | Xóa client | Xóa lead / opp → Lost |
| Cơ chế | `client.archivedAt` set | `opp.status = 'Lost'` |
| Xem ở | Tab "Đã lưu trữ" `/clients` | Tab "Lưu trữ" `/leads` |

Xóa lead KHÔNG soft-delete client. Xóa client → cascade xóa opps chưa Won + tasks pending (giữ activities, tasks done, opps Won).

### Smart Tags — computed, không lưu DB
`new-lead`: createdAt < 7 ngày · `warm`: MAX(activities.date) < 14 ngày · `cold`: > 30 ngày AND NOT new-lead · `priority`: tổng opp value > $50k

### Pattern `showAssignedTo`
Field "Giao cho" ẩn với salesperson ở TaskModal + ActivityTaskStep. Prop `showAssignedTo = isManager`. Sales filter theo `client.ownerId` nên giao cho người khác không có tác dụng — API tự inject `assignedTo = session.id`.

---

## API Gotchas

**PATCH null = xóa field** (dùng cho restore `archivedAt`): truyền `null` → `queries.updateClient()` set column = NULL. Truyền `undefined` bị bỏ qua — không có tác dụng.

**GET /api/opportunities**: tự lọc opps của archived clients bằng JOIN trong SQL — không cần filter thủ công.

**DELETE /api/clients/[id]**: soft delete + cascade. Store gọi `removeByClientId(id)` ngay + `invalidate(['clients','opportunities','activities','tasks'])`.

**Restore client**: `PATCH { archivedAt: null }` → `invalidate(['clients','opportunities'])` — phải refetch opps vì đã bị `removeByClientId` trước đó.

**Xóa lead**: `updateStatus(id, 'Lost')` — KHÔNG gọi `deleteOpportunity`.

**POST /api/tasks**: salesperson không truyền `assignedTo` → server inject `session.id`.

**POST /api/documents**: client không truyền `uploadedBy` → server inject từ session.

**Assign lead** (`/api/leads/[id]/assign`): dùng `sql.begin()` transaction — update client + tất cả opps atomic.

---

## Auth & Phân quyền
JWT `httpOnly` cookie `nyxus_session` TTL 8h. `middleware.ts` guard tất cả route. `requireSession()` / `requireRole()` trong API.

Ownership ở `client.ownerId`: Sales-owner xem/sửa được · Sales-non-owner không · Manager toàn quyền.
`/forecast` — manager only. Sales chỉ thấy client/opp có `ownerId === me`.

---

## Stores
`useAuthStore` · `useUsersStore` (useUserById, useSalespersons) · `useClientStore` (useClientStatus, useClientsWithComputedTags(opps,activities)) · `useOpportunityStore` (**removeByClientId** xóa ngay store không gọi API, updateStatus tự populate statusHistory) · `useActivityStore` · `useTaskStore` (useTasksForClients(Set)) · `useDocumentStore` (AddDocumentPayload không có uploadedBy) · `useToastStore`

---

## API Routes
`/api/auth/` login·me·logout · `/api/users?role=` · `/api/clients` GET,POST · `/api/clients/[id]` GET,PATCH(null=xóa field),DELETE(soft+cascade) · `/api/clients/existing` POST · `/api/leads` POST(client+opp đồng thời) · `/api/leads/[id]/assign` PATCH(manager only, transaction) · `/api/opportunities` GET(JOIN filter archived),POST · `/api/opportunities/[id]` GET,PATCH,DELETE · `/api/activities` GET,POST · `/api/tasks` GET,POST(auto assignedTo),`/[id]` PATCH(auto completedAt),DELETE · `/api/documents` GET,POST(uploadedBy từ session),`/[id]` PATCH,DELETE(guard by client.ownerId)

---

## DB State
21 clients active/archived. `cli-017` = archived. Hard deleted (không trong DB): `cli-002, cli-009, cli-021, cli-022`. `act-008` opportunityId null hóa vì `opp-008` đã hard delete.

---

## Comment Convention
Chỉ comment: lý do kiến trúc / business rule · side effect không hiển nhiên · magic number nghiệp vụ · guard clause dễ gây bug · JSDoc trên public API.
Format: `// src/path — mô tả` · section: `// ── Tên ─────────`
