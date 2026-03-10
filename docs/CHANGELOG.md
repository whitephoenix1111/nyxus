# CHANGELOG

> Ghi lại các thay đổi lớn về spec/kiến trúc theo thời gian.

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
- Thêm **industry filter** (dropdown tiếng Việt)
- Thêm **tag badges** với màu riêng mỗi tag
- Detail panel: hiển thị email, phone, website, country, ghi chú, nút xóa
- **Modal "Thêm khách hàng"**: form đầy đủ, live avatar preview, tag toggle, validate, loading state

### Added — Design System

#### `src/app/globals.css`
- Mở rộng neutral scale từ 9 → 11 bước (thêm `550`, `650`, `750`)
- Thêm 8 semantic text tokens:
  - `--color-text-primary` (#fff) — heading, số liệu chính
  - `--color-text-body` (#ccc) — paragraph
  - `--color-text-secondary` (#aaa) — tên secondary
  - `--color-text-tertiary` (#999) — placeholder input
  - `--color-text-muted` (#888) — contact info, meta
  - `--color-text-subtle` (#777) — company, secondary text
  - `--color-text-faint` (#666) — label uppercase, caption
  - `--color-text-disabled` (#555) — icon mờ, disabled
- Thêm `.input-base` — class chung cho tất cả input (placeholder tự dùng `--color-text-tertiary`)
- Thêm `.select-base` — class chung cho tất cả select

### Decisions
- **Client data độc lập** với Opportunities: `clients.json` riêng, join runtime qua `company` name
- **Không dùng raw hex** trong components — toàn bộ màu qua CSS variable
- **Industry label** lưu bằng English key, dịch sang tiếng Việt ở UI layer (dễ filter, dễ extend)

---

## [Unreleased] — 2026-03-09

### Added
- Khởi tạo toàn bộ cấu trúc docs (VISION, HLD, LLD, Features)
- Thêm field `lastContactDate` vào `Opportunity` interface (dùng cho Reminders logic)
- Định nghĩa 5 selectors trong lld-store.md
- Chi tiết 6 feature specs (F01–F06)

### Decisions
- Backend: JSON file thay vì database (đơn giản, migrate sau)
- State: Zustand thay vì Redux (ít boilerplate hơn cho team nhỏ)
- Charts: Recharts thay vì D3 (React-native, dễ maintain)
