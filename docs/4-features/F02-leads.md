# F02 — Leads Page

> **Route**: `/leads`
> **Accessible by**: Salesperson (ownerId === me) · Manager (tất cả)

---

## Mục tiêu

Workspace chính của sales — quản lý toàn bộ leads đang trong pipeline, từ Lead đến Negotiation. Client đã Won biến mất khỏi đây, xuất hiện ở `/clients`.

---

## Hiển thị & Lọc

- Card view — mỗi card là 1 cặp Client + Opportunity
- Chỉ hiển thị `client.isProspect = true` (Won sẽ chuyển isProspect = false)
- `<OwnerFilter />` dropdown — chỉ hiện với Manager
- Smart tags hiển thị trên mỗi card (computed — không lưu DB)

---

## Tạo Lead mới — `POST /api/leads`

```
LeadModal → nhập: name, company, email?, phone?, value, notes?
  → hệ thống tự tạo:
       Client (isProspect: true, ownerId: currentUser.id)
     + Opportunity (status: Lead, confidence: 15%)
  → Optional: checkbox "Tạo task liên hệ đầu tiên"
       → tạo Task (không phải Activity)
```

Không có input confidence — 15% tự động.

---

## Thăng stage — PromoteModal

```
PromoteModal
  → chọn stage mới (chỉ forward, không skip ngược)
  → confidence preview tự tính = STAGE_DEFAULT_CONFIDENCE[newStage]
  → fine-tune slider nếu stage có range
  → Won / Lost: confirm dialog thêm

Khi confirm:
  → PATCH /api/opportunities/[id]: status + confidence
  → Append statusHistory
  → Nếu → Qualified: client.isProspect = false
  → Nếu → Won: client biến mất khỏi /leads, xuất hiện ở /clients
```

---

## Assign Lead — Manager only

`AssignLeadModal` → chọn salesperson từ danh sách → `PATCH /api/leads/[id]/assign`
Cập nhật `client.ownerId` + `opportunity.ownerId`.

---

## Smart Tags hiển thị

| Tag | Điều kiện | Style |
|---|---|---|
| `new-lead` ⚡ | createdAt < 7 ngày | computed — lime border |
| `warm` ⚡ | lastContactDate < 14 ngày | computed — xanh |
| `cold` ⚡ | lastContactDate > 30 ngày | computed — xám |
| `priority` ⚡ | totalValue > $50,000 | computed — vàng |
| `enterprise` | lưu DB | solid badge |
| `mid-market` | lưu DB | solid badge |

Tags row: `h-[46px]` cố định — tránh layout shift.

---

## Acceptance Criteria

- [x] Hiển thị card cho mọi `isProspect = true` client thuộc ownership của user
- [x] Manager thấy OwnerFilter, có thể lọc theo sales
- [x] Tạo lead: không có confidence input, tự set 15%
- [x] PromoteModal: confidence tự preview đúng mặc định stage, fine-tune trong range
- [x] Won → client.isProspect = false → biến mất khỏi Leads page
- [x] Qualified → client.isProspect = false (client xuất hiện ở /clients)
- [x] Assign lead chỉ hiện với Manager
- [x] Smart tags computed đúng điều kiện, không lưu DB
- [x] Tags row height cố định h-[46px]
