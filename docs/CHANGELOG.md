# CHANGELOG

> Chỉ giữ 2 version gần nhất. Xem `CHANGELOG-archive.md` cho lịch sử cũ hơn.

---

## [0.6.0] — 2026-03-10 — B2B Workflow Redesign

3 thay đổi cốt lõi (chi tiết sửa code xem `CODING_DELTA.md`):

**1. `Client.isProspect`**
- `POST /api/leads` tạo đồng thời Client (isProspect: true) + Opportunity (Lead, 15%)
- Promote → Qualified: `client.isProspect = false`
- `Opportunity.clientId` là hard FK, không còn join bằng company name

**2. `Activity.nextActionDate`**
- Field mới: due date thật cho nextAction
- Reminders Widget: 3 loại — `overdue_task`, `stale_deal`, `expiring_proposal`
- `useStaleLeads` mở rộng sang [Lead, Qualified, Proposal], loại trừ deals có pending task
- Thêm selector `useOverdueTasks(activities)`

**3. Confidence theo stage**
- Constants: `STAGE_DEFAULT_CONFIDENCE`, `STAGE_CONFIDENCE_RANGE`
- Promote → confidence tự nhảy về mặc định stage mới
- Lead (15%), Won (100%), Lost (0%) cố định — không override được

Files thay đổi: `src/types/index.ts`, `data/opportunities.json`, `docs/*`

---

## [0.5.0] — 2026-03-10 — Refactor Pipeline Status

- `Forecast` → không còn là pipeline stage, chỉ là trang phân tích
- `Order` → `Won`, thêm `Lost`, `Qualified`, `Negotiation`
- Pipeline mới: `Lead → Qualified → Proposal → Negotiation → Won/Lost`
- `Activity.promoteOpportunityTo?` — promote khi lưu activity
- `Opportunity.statusHistory[]` — lịch sử promote, append-only
- Status colors cập nhật cho 6 stages mới
