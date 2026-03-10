# CHANGELOG

> Ghi lại các thay đổi lớn về spec/kiến trúc theo thời gian.

---

## [0.6.0] — 2026-03-10

### Changed — B2B Workflow Redesign (3 cải tiến cốt lõi)

#### Bối cảnh
Phân tích workflow thực tế B2B phát hiện 3 mâu thuẫn trong thiết kế cũ:
1. Client và Lead là hai entity tách rời, join bằng `company` name — dễ sai, khó maintain
2. `nextAction` chỉ là text thuần — không có due date, không tạo reminder, dead data
3. `confidence` do cá nhân tự nhập tuỳ ý — forecast không nhất quán giữa các rep

#### Thay đổi 1: Client isProspect + Lead Creation Flow

**Thiết kế cũ**: Nhân viên tạo Client riêng, rồi tạo Lead riêng, match bằng `company` string.

**Thiết kế mới**: Một action duy nhất (`POST /api/leads`) tạo đồng thời:
- `Client` với `isProspect: true` (chưa phải khách thật)
- `Opportunity` với `status: Lead`, `clientId` liên kết chặt (hard FK, không join bằng tên)

Khi promote → Qualified: `client.isProspect = false` (Client được activate).

Client page có thể filter `?isProspect=false` để chỉ hiện khách hàng thật.

#### Thay đổi 2: nextActionDate — Tasks có Due Date

**Thiết kế cũ**: `nextAction` chỉ là string, không ai nhớ follow up.

**Thiết kế mới**: Thêm field `nextActionDate?: string` (ISO 8601) vào `Activity`.

- Khi `nextActionDate` đến hạn mà opportunity chưa có activity mới hơn → **overdue task**
- Reminders Widget hiển thị 3 loại: `overdue_task`, `stale_deal`, `expiring_proposal`
- `stale_deal` được cập nhật để loại trừ deals đã có `nextActionDate` pending (có kế hoạch rồi)

Selectors mới: `useOverdueTasks()`, `useExpiringProposals()`. `useStaleLeads()` mở rộng sang `[Lead, Qualified, Proposal]`.

#### Thay đổi 3: Confidence theo Stage — Nhất quán toàn team

**Thiết kế cũ**: Nhân viên tự nhập confidence tuỳ ý khi tạo/edit opportunity.

**Thiết kế mới**:
- Confidence có **giá trị mặc định theo stage** (constants `STAGE_DEFAULT_CONFIDENCE`)
- Khi promote deal: confidence tự nhảy về mặc định của stage mới
- Nhân viên chỉ điều chỉnh trong range cho phép (`STAGE_CONFIDENCE_RANGE`)
- Lead (15%) và Won (100%) và Lost (0%) không được override

| Stage | Default | Range |
|---|---|---|
| Lead | 15% | cố định |
| Qualified | 35% | ±15% (20–50%) |
| Proposal | 60% | ±15% (45–75%) |
| Negotiation | 80% | ±10% (70–90%) |
| Won | 100% | cố định |
| Lost | 0% | cố định |

#### Types thay đổi (`src/types/index.ts`)
- `STAGE_DEFAULT_CONFIDENCE` — constant mới
- `STAGE_CONFIDENCE_RANGE` — constant mới
- `Opportunity.clientId` — field mới (hard FK)
- `Client.isProspect: boolean` — field mới
- `Activity.nextActionDate?: string` — field mới
- `Activity.promoteOpportunityTo?` — đã có từ trước
- `ReminderAlert.type` — đổi thành `overdue_task | stale_deal | expiring_proposal`

#### API mới
- `POST /api/leads` — entry point cho Lead mới, tạo đồng thời Client + Opportunity
- `GET /api/reminders` — tính toán server-side, trả về `ReminderAlert[]`

#### Files cần cập nhật (Phase 4)
- `src/types/index.ts` — thêm constants + sửa interfaces
- `src/app/api/leads/route.ts` — tạo mới
- `src/app/api/reminders/route.ts` — tạo mới
- `src/app/api/activities/route.ts` — thêm side effects (promote + isProspect)
- `src/store/useOpportunityStore.ts` — thêm `useOverdueTasks`, sửa `useStaleLeads`
- `src/store/useActivityStore.ts` — thêm `nextActionDate` vào form
- `src/app/leads/page.tsx` — dùng `POST /api/leads` thay vì `POST /api/opportunities`
- `src/app/activities/page.tsx` — thêm `nextActionDate` field trong AddActivityModal
- `src/components/dashboard/RemindersWidget.tsx` — hiển thị 3 loại reminder mới
- `data/clients.json` — thêm `isProspect` field cho tất cả records
- `data/opportunities.json` — thêm `clientId` field
- `data/activities.json` — thêm `nextActionDate` field (một số records có giá trị)

---

## [0.5.0] — 2026-03-10

### Changed — Refactor Pipeline Status + Activity Design Philosophy

#### Quyết định kiến trúc quan trọng
- **`Forecast` không còn là một pipeline stage** — đây chỉ là trang phân tích/dự báo dựa trên `confidence` score, không phải bước trong quy trình bán hàng
- **`Order` đổi thành `Won`** — rõ nghĩa hơn trong ngữ cảnh sales pipeline
- **Thêm `Lost`** — ghi nhận deal thất bại để phân tích, không bị xóa khỏi hệ thống
- **Thêm `Qualified` và `Negotiation`** — phân biệt rõ các giai đoạn thực tế

#### Pipeline mới
```
Cũ: Lead → Proposal → Forecast → Order
Mới: Lead → Qualified → Proposal → Negotiation → Won / Lost
```

| Stage | Ý nghĩa | Confidence gợi ý |
|---|---|---|
| Lead | Mới vào, chưa qualify | 10–20% |
| Qualified | Đã xác nhận nhu cầu, budget, timeline | 30–50% |
| Proposal | Đã gửi đề xuất, chờ phản hồi | 50–70% |
| Negotiation | Đang thương lượng giá/điều khoản | 70–90% |
| Won | Chốt đơn thành công | 100% |
| Lost | Deal thất bại (giữ lại để phân tích) | 0% |

#### Types (`src/types/index.ts`)
- `OpportunityStatus` union: `'Lead' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost'`
- `Opportunity` interface: thêm `statusHistory?` — lưu lịch sử promote với `activityId` để trace
- `Activity` interface: thêm `promoteOpportunityTo?: OpportunityStatus` — khi lưu activity có field này, API tự động promote opportunity tương ứng

#### Data Migration (`data/opportunities.json`)
- `Forecast` → `Negotiation` (deal đã đủ chín để dự báo = đang negotiate)
- `Order` → `Won`
- `opp-009` (Derek Stone — không phản hồi 3 tháng) → `Lost`, `confidence: 0`
- `opp-025` (Ben Carter — budget không đủ) → `Lost`, `confidence: 0`
- `opp-014`, `opp-020` → `Qualified` (lead đã contact nhưng chưa có proposal)

#### Store (`src/store/useOpportunityStore.ts`)
- `useStatsByStatus` — counts/values map cập nhật 6 keys mới
- `useStaleLeads` — filter cả `Lead` lẫn `Qualified` (không chỉ Lead)
- `useReminders` — `expiringProposals` bao gồm cả `Negotiation`
- `useForecastRevenue` — exclude `Lost` khỏi weighted sum
- `useNoContactLeads` — không đổi logic, vẫn dùng `lastContactDate`

#### Store (`src/store/useClientStore.ts`)
- `topStatus` priority array: `Won > Negotiation > Proposal > Qualified > Lead > Lost`

#### UI — Màu sắc status mới
| Status | Text | Background |
|---|---|---|
| Lead | `#AAAAAA` | `#1A1A1A` |
| Qualified | `#5BA3F5` | `#0D1B2A` |
| Proposal | `#F5A742` | `#1A1000` |
| Negotiation | `#F5C842` | `#1A1400` |
| Won | `#DFFF00` | `#DFFF0015` |
| Lost | `#EF4444` | `#1C0505` |

#### Files cập nhật
- `src/lib/utils.ts` — `STATUS_COLORS`
- `src/app/opportunities/page.tsx` — constants, filter tabs, modal select
- `src/app/leads/page.tsx` — `PromoteModal` steps
- `src/app/forecast/page.tsx` — `STATUS_CONFIG`, funnel (không render `Lost`), winRate dùng `counts.Won`
- `src/components/dashboard/StatCard.tsx` — icons + labels, hiển thị `Negotiation`/`Won`
- `src/components/dashboard/KPIScatterChart.tsx` — `STATUS_VI`, dot glow cho `Won`
- `src/app/page.tsx` — StatCards dùng `Negotiation`/`Won`, recalc `totalSales`/`openQuotes`
- `src/app/clients/_components/_constants.ts` — `STATUS_STYLE` + `STATUS_LABELS`

#### Bug fixes (phát hiện trong session này)
- `GET /api/activities/[id]` — bị thiếu, đã thêm vào `src/app/api/activities/[id]/route.ts`
- `useReminders()` selector — chưa tồn tại, đã thêm vào `useOpportunityStore.ts`

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
