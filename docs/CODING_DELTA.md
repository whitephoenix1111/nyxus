# CODING DELTA — Tổng quan

## ⚠️ Đọc phần này trước khi làm bất cứ điều gì

**Code hiện tại được viết theo workflow CŨ.** Trong một session trước, workflow B2B đã được phân tích lại và phát hiện 3 chỗ sai thiết kế cốt lõi. Docs (VISION.md, HLD.md, lld-data.md) đã được cập nhật theo workflow mới — nhưng **code chưa được sửa**.

Nếu bạn chỉ đọc docs rồi nhìn vào code, code sẽ trông *có vẻ hợp lý* — vì nó nhất quán nội tại với chính nó. Nhưng nó đang sai so với workflow mới.

**3 file tiếp theo liệt kê từng chỗ code đang SAI**, kèm code cũ và code mới cụ thể. Đây không phải gợi ý — đây là danh sách việc cần làm.

---

## 3 thay đổi workflow cốt lõi

| # | Thay đổi | Vấn đề cũ | Hành vi mới |
|---|---|---|---|
| 1 | **`Client.isProspect`** | Lead và Client là 2 entity riêng, join bằng company string → dễ sai | Tạo Lead → tự sinh Client (`isProspect: true`). Promote → Qualified → Client activated |
| 2 | **`Activity.nextActionDate`** | `nextAction` chỉ là text chết, không ai nhớ follow up | `nextActionDate` là due date thật, Dashboard hiển thị overdue task proactive |
| 3 | **`Confidence theo stage`** | Nhân viên tự nhập confidence tuỳ ý → Forecast không nhất quán | Promote → confidence tự nhảy về mặc định stage, chỉ fine-tune trong range |

---

## Thứ tự thực hiện (theo đúng thứ tự này)

```
DELTA-1-data-api.md:
  1. data/clients.json              ← thêm isProspect vào 25 records
  2. data/activities.json           ← thêm nextActionDate vào một số records
  3. src/app/api/leads/route.ts     ← TẠO MỚI
  4. src/app/api/activities/route.ts ← sửa POST thêm side effects

DELTA-2-stores.md:
  5. src/store/useClientStore.ts    ← sửa join logic + thêm addLead
  6. src/store/useOpportunityStore.ts ← sửa useStaleLeads + thêm useOverdueTasks + sửa useReminders

DELTA-3-ui.md:
  7. src/app/leads/page.tsx         ← sửa handleAdd + LeadModal + PromoteModal
  8. src/app/activities/page.tsx    ← thêm nextActionDate vào modal + card
  9. src/app/page.tsx               ← thêm fetch activities + 3 reminder cards
```

---

## Checklist sau khi hoàn thành toàn bộ

- [ ] Thêm lead mới từ Leads page → xuất hiện cả ở Clients page với badge "Prospect"
- [ ] Promote Lead → Qualified → `client.isProspect` chuyển `false`
- [ ] Ghi activity có `nextActionDate` → deadline hiển thị màu vàng/đỏ trên card
- [ ] Dashboard Reminders có 3 card: overdue tasks, stale deals, expiring proposals
- [ ] Confidence khi tạo lead mới = 15% tự động, không có input field
- [ ] Promote deal → confidence tự nhảy về mặc định stage mới
