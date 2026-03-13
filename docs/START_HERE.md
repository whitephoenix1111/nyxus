# START HERE — Nyxus Sales CRM

---

## Đọc theo thứ tự này

### Hiểu sản phẩm
1. `1-vision/VISION-1-goals.md` — mục tiêu, pipeline, triết lý confidence
2. `1-vision/VISION-2-workflow.md` — workflow B2B đầy đủ, reminders, trạng thái goals

### Hiểu kiến trúc
3. `2-hld/HLD-1-architecture.md` — tech stack, domain model, data flow, routing, stores
4. `2-hld/HLD-2-conventions.md` — coding conventions, design system, auth & phân quyền

### Hiểu chi tiết kỹ thuật
5. `3-lld/lld-data-types.md` — TypeScript interfaces, JSON schema, hằng số confidence
6. `3-lld/lld-data-api.md` — API routes đầy đủ, side effects, guard rules
7. `3-lld/lld-store.md` — Zustand stores, actions, selectors
8. `3-lld/lld-components.md` — Component tree, props, layout rules

### Hiểu từng tính năng
9. `4-features/` — Acceptance criteria và data dependencies từng trang

---

## Tổng quan nhanh

**Stack**: Next.js App Router · TypeScript · Tailwind CSS · Zustand · JSON file DB

**Data hierarchy**: `Client → Opportunity → Activity → Task / Document`

**Hai role**: `salesperson` (thấy client của mình) · `manager` (thấy tất cả)

**Ownership**: Gắn tại `Client.ownerId` — mọi resource con kế thừa quyền từ đây

**Entry point duy nhất**: `POST /api/leads` tạo đồng thời `Client (isProspect: true)` + `Opportunity (Lead, 15%)`

**Pipeline**: `Lead → Qualified → Proposal → Negotiation → Won / Lost`

**Confidence**: Tự nhảy về mặc định khi promote — không nhập tay, chỉ fine-tune trong range

---

## Lưu ý quan trọng

- `REFACTOR.md` ở root là **source of truth** — docs này mô tả chi tiết hơn nhưng không thêm gì ngoài REFACTOR.
- Auth: JWT `httpOnly` cookie, TTL 8h. Demo: `sale@nyxus.vn / sale123` · `manager@nyxus.vn / manager123`
- JSON files là DB dev — không có migration, đọc/ghi trực tiếp qua `src/lib/json-db.ts`
