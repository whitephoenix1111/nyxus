# CHANGELOG

> Ghi lại các thay đổi lớn về spec/kiến trúc theo thời gian.

---

## [0.4.0] — 2026-03-10

### Added — Activities Module (hoàn chỉnh)

#### Data
- `data/activities.json` — 25 activities, 1 per client, đầy đủ: `type`, `outcome`, `nextAction`, `notes`, `opportunityId`

#### Types (`src/types/index.ts`)
- Thêm `ActivityType` union: `call | email | meeting | demo | note`
- Thêm `ActivityOutcome` union: `positive | neutral | negative`
- Thêm `Activity` interface đầy đủ với denormalized `clientName` và `company`

#### API Routes
- `GET /api/activities` — filter: `?type=`, `?outcome=`, `?clientId=`, `?search=`, sort mới nhất trước
- `POST /api/activities`
- `PATCH /api/activities/[id]`
- `DELETE /api/activities/[id]`

#### Store (`src/store/useActivityStore.ts`)
- Zustand store CRUD + optimistic update
- Selectors: `useActivitiesByType`, `useActivitiesByOutcome`, `useRecentActivities`, `useActivitiesForClient`

#### UI (`src/app/activities/page.tsx`)
- KPI bar: tổng, tỷ lệ tích cực, breakdown outcome + progress bar màu
- Timeline grouped by month, sort mới nhất trước
- Activity card expand/collapse: notes + next action highlight lime
- Filter: search + type + outcome
- Modal thêm mới: type selector toggle, validate, date picker

#### Navigation
- `TopNav.tsx` — thêm link "Hoạt động" → `/activities`
- `docs/4-features/F07-activities.md` — feature spec mới

---

## [0.3.0] — 2026-03-10

### Added — Clients Module (Data Layer hoàn chỉnh)

#### Data
- `data/clients.json` — 25 clients đầy đủ: `email`, `phone`, `industry`, `country`, `website`, `tags`, `notes`, `createdAt`

#### Types (`src/types/index.ts`)
- Mở rộng `Client` interface: thêm `email`, `phone`, `industry`, `country`, `website`, `tags: ClientTag[]`, `notes`, `createdAt`
- Thêm `ClientTag` union type: `enterprise | mid-market | priority | warm | cold | new-lead`
- Thêm `ClientWithStats` — derived type: `Client` + computed stats từ Opportunities (join theo `company`)

#### API Routes
- `GET /api/clients` — filter theo `industry`, `tag`, `search`
- `POST /api/clients` — tạo mới, auto-generate `id` và `createdAt`
- `GET /api/clients/[id]`
- `PATCH /api/clients/[id]` — partial update
- `DELETE /api/clients/[id]`

#### Store (`src/store/useClientStore.ts`)
- Zustand store với đầy đủ CRUD actions + optimistic update
- Selector `useClientsWithStats(opportunities)` — join Client + Opportunity data
- Selector `useClientIndustries()` — danh sách industry duy nhất
- Selector `useTopClientsByValue(opportunities, limit)` — top N theo totalValue

#### UI (`src/app/clients/page.tsx`)
- Wire vào `useClientStore` thật thay vì derive từ Opportunities
- Thêm industry filter (dropdown tiếng Việt), tag badges
- Detail panel: email, phone, website, country, ghi chú, nút xóa
- Modal "Thêm khách hàng": form đầy đủ, live avatar preview, tag toggle, validate

#### Design System
- `globals.css` — 8 text tokens, `.input-base`, `.select-base`

---

## [Unreleased] — 2026-03-09

### Added
- Khởi tạo toàn bộ cấu trúc docs (VISION, HLD, LLD, Features)
- Thêm field `lastContactDate` vào `Opportunity` interface
- Định nghĩa selectors trong lld-store.md
- Chi tiết 6 feature specs (F01–F06)

### Decisions
- Backend: JSON file thay vì database
- State: Zustand thay vì Redux
- Charts: Recharts thay vì D3
