# VISION (2/2) — Workflow & Trạng thái

> File trước: `VISION-1-goals.md`

---

## 1. Workflow tổng quan

```
[NGUỒN VÀO] LinkedIn / hội nghị / referral / web form
     │
     │  Sales Rep nhập: tên + email + công ty + deal value
     ▼
[HỆ THỐNG TỰ ĐỘNG TẠO ĐỒNG THỜI]

  CLIENT (isProspect: true)  ────►  OPPORTUNITY (Lead, confidence: 15%)
       │                                   │
       │  clientId (hard FK) ──────────────┘
       │
     ··················· Nhân viên ghi ACTIVITY ···················
     :  type: call / email / meeting / demo / note                 :
     :  outcome: positive / neutral / negative                     :
     :  nextAction: "Gửi proposal trước thứ 6"                    :
     :  nextActionDate: "2026-03-15"  ◄── due date thật            :
     :  promoteOpportunityTo?: Qualified  ◄── tuỳ chọn            :
     ···············································~~~~~~~~~~~~~~~~

              có promoteOpportunityTo?
                YES                         NO
                 │                           │
       API PATCH opportunity             status giữ nguyên
       status + confidence (mặc định)
       append statusHistory
       nếu → Qualified: client.isProspect = false
                 │
                 ▼
   Lead → Qualified → Proposal → Negotiation → Won
              │                       │
        Client activated          Lost (giữ để phân tích)
```

---

## 2. Reminders Widget (proactive)

| Loại | Điều kiện |
|---|---|
| **overdue_task** | `nextActionDate < hôm nay`, chưa có Activity mới hơn cho opportunity đó |
| **stale_deal** | `lastContactDate > 3 ngày`, status ∈ [Lead, Qualified, Proposal], không có pending task |
| **expiring_proposal** | status = Proposal, `lastContactDate > 14 ngày` |

---

## 3. Forecast

- Đọc tất cả opportunities trừ Lost
- Tính: `value × confidence / 100`
- Confidence = mặc định theo stage + fine-tune nhân viên
- Hoàn toàn độc lập với pipeline stage — không thay đổi data nào

---

## 4. Goals — Trạng thái

- [x] Dashboard Home: Stats, KPI Chart, Reminders, Top Clients
- [x] Opportunities page: table, filter, inline edit, add/delete
- [x] Leads page: card view, stale indicator, promote modal
- [x] Clients page: grid + detail panel + modal, join stats
- [x] Forecast page: weighted revenue, funnel, confidence breakdown
- [x] Activities page: timeline by month, add/delete, KPI bar
- [ ] **Client isProspect**: tạo Lead → sinh Client liên kết
- [ ] **nextActionDate**: due date thật, Reminders đọc overdue tasks
- [ ] **Confidence theo stage**: promote → confidence tự nhảy về mặc định
- [ ] **Activity promote UI + API**: `promoteOpportunityTo` trong modal + PATCH logic
- [ ] Documents page: wire API
- [ ] Search toàn cục
