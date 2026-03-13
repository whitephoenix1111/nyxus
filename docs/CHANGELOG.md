# CHANGELOG — Nyxus Sales CRM

> Giữ 2 version gần nhất.

---

## [0.6.0] — 2026-03-10 — B2B Workflow Redesign

### 3 thay đổi cốt lõi

**1. `Client.isProspect` — Lead và Client thống nhất**

Trước đây Lead và Client là 2 entity riêng, join bằng company name string → dễ sai.
Nay: `POST /api/leads` tạo đồng thời `Client (isProspect: true)` + `Opportunity (Lead, 15%)`.
Promote → Qualified → `client.isProspect = false`, client xuất hiện ở trang Clients.

**2. `Activity.nextActionDate` — due date thật**

Trước đây `nextAction` chỉ là text chết, không ai nhớ follow-up.
Nay: `nextActionDate` là ISO date thật, Dashboard Reminders Widget đọc và cảnh báo proactive khi quá hạn.

3 loại reminder: `overdue_task` · `stale_deal` · `expiring_proposal`

**3. Confidence theo stage — nhất quán toàn team**

Trước đây nhân viên tự nhập confidence tuỳ ý → Forecast không đáng tin.
Nay: promote → confidence tự nhảy về mặc định stage mới. Chỉ fine-tune trong range cố định.
Lead (15%) · Won (100%) · Lost (0%) cố định — không override được.

### Files thay đổi
`src/types/index.ts` · `data/opportunities.json` · `data/clients.json` · `docs/*`

---

## [0.5.0] — 2026-03-10 — Refactor Pipeline Status

- `Forecast` không còn là pipeline stage — chỉ là trang phân tích riêng
- Pipeline mới 6 stages: `Lead → Qualified → Proposal → Negotiation → Won / Lost`
- Thêm `Activity.promoteOpportunityTo?` — promote opportunity khi lưu activity
- Thêm `Opportunity.statusHistory[]` — lịch sử promote, append-only
- Status colors cập nhật cho 6 stages mới
- Auth layer: JWT cookie, `middleware.ts` guard, role-based UI
