# VISION — Nyxus Sales CRM

> **Tagline**: "Pipeline clarity. Revenue velocity."

---

## 1. Mục tiêu sản phẩm

Nyxus là một Sales CRM dashboard tập trung vào:
- **Visibility**: Nhìn thấy toàn bộ pipeline từ Contact → Won trong một màn hình.
- **Velocity**: Phát hiện ngay bottleneck, stale deals, và tasks sắp đến hạn.
- **Forecasting**: Dự báo doanh thu dựa trên `confidence` score gắn với stage — không phải cảm tính cá nhân.

**Người dùng mục tiêu**: Sales Manager và Sales Rep trong team B2B, quy mô 5–50 người.

---

## 2. Triết lý Pipeline

### Chiều dữ liệu thực tế B2B

Trong thực tế B2B, dữ liệu không bắt đầu từ Client — mà bắt đầu từ **Contact** (người bạn vừa gặp). Client chỉ được tạo ra khi deal đã đủ nghiêm túc để qualify. Đây là chiều dữ liệu đúng:

```
Contact (gặp lần đầu)
  │
  │  Qualify (BANT: Budget, Authority, Need, Timeline)
  ▼
Client (Account được tạo/kích hoạt) ──► Opportunity ──► Activity
```

**Giải pháp Nyxus**: Client có trường `isProspect`. Khi thêm Lead mới, hệ thống tự động tạo Client kèm theo với `isProspect: true`. Khi promote lên `Qualified`, Client được "activate" thành khách hàng thật (`isProspect: false`). Nhân viên không cần tạo Client riêng — tránh dữ liệu bị tách rời và nhập trùng.

### Pipeline Stage

**Pipeline stage** mô tả vị trí deal trong quy trình bán hàng:

```
Lead → Qualified → Proposal → Negotiation → Won
                                           ↘ Lost
```

| Stage | Ý nghĩa | Confidence mặc định | Override range |
|---|---|---|---|
| **Lead** | Mới vào, chưa qualify (BANT chưa pass) | 15% | ✗ cố định |
| **Qualified** | Đã xác nhận Budget, Authority, Need, Timeline | 35% | ✓ ±15% |
| **Proposal** | Đã gửi đề xuất, chờ phản hồi | 60% | ✓ ±15% |
| **Negotiation** | Đang thương lượng giá/điều khoản | 80% | ✓ ±10% |
| **Won** | Chốt đơn thành công | 100% | ✗ cố định |
| **Lost** | Deal thất bại — giữ lại để phân tích, không xóa | 0% | ✗ cố định |

> **Confidence theo stage, không theo cảm tính** — Khi promote deal, confidence tự nhảy về mức mặc định của stage mới. Nhân viên chỉ fine-tune trong range cho phép. Điều này đảm bảo Forecast của cả team nhất quán và đáng tin.

> **Forecast không phải stage** — Trang Forecast là công cụ phân tích độc lập, tính `value × confidence` trên toàn bộ pipeline (trừ Lost) để hỗ trợ chủ doanh nghiệp hiểu xu hướng và kế hoạch doanh thu.

---

## 3. Workflow tổng quan

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          NYXUS — SALES WORKFLOW (B2B)                       │
└─────────────────────────────────────────────────────────────────────────────┘

  [NGUỒN VÀO]
  LinkedIn / hội nghị / referral / web form
     │
     │  Sales Rep nhập thông tin cơ bản (tên + email + công ty + deal value)
     ▼
  [HỆ THỐNG TỰ ĐỘNG TẠO ĐỒNG THỜI]
  ┌──────────────────────────┐     ┌─────────────────────────────┐
  │  CLIENT                  │     │  OPPORTUNITY                │
  │  isProspect: true        │────►│  status: Lead               │
  │  (chưa phải khách thật)  │     │  confidence: 15% (cố định)  │
  └──────────────────────────┘     └─────────────────────────────┘
                                          │
     ┌────────────────────────────────────┘
     │
     │  ···················· Nhân viên ghi ACTIVITY ····················
     │  :                                                               :
     │  :   type: call / email / meeting / demo / note                 :
     │  :   outcome: positive / neutral / negative                     :
     │  :   nextAction: "Gửi proposal trước thứ 6"  (text mô tả)      :
     │  :   nextActionDate: "2026-03-15"  ◄── due date thật            :
     │  :   promoteOpportunityTo?: Qualified  ◄── tuỳ chọn nhân viên  :
     │  :..................................................................
     │                          │
     │              có promoteOpportunityTo?
     │                  YES ───┤                    NO
     │                         ▼                     │
     │               API tự động PATCH               │  status giữ nguyên
     │               opportunity.status              │  nhân viên tự update
     │               confidence → mặc định stage mới │  sau nếu muốn
     │               + append statusHistory           │
     │               + nếu promote → Qualified:       │
     │                 Client.isProspect = false      │
     │                         │                      │
     └──────────┬──────────────┘──────────────────────┘
                │
                ▼
         [PIPELINE STAGES]

   Lead ──► Qualified ──► Proposal ──► Negotiation ──► Won
    │          │                           │             │
    │    Client.isProspect                 │         doanh thu
    │    → false (activated)       Lost ◄──┘         ghi nhận
    │
    └──────────────────────────────────────────────────────►
              tiếp tục ghi Activities cho deal mới
              (upsell, renewal)


  ┌──────────────────────────────────────────────────────────────┐
  │                   REMINDERS (proactive)                      │
  │                                                              │
  │   Overdue tasks:  nextActionDate < hôm nay, chưa có Act mới  │
  │   Stale deals:    lastContactDate > 3 ngày, không có task    │
  │   Expiring:       Proposal stage > 14 ngày chưa phản hồi     │
  │                                                              │
  │   ← Widget Dashboard đọc real-time, cảnh báo proactive →     │
  └──────────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────────┐
  │                   FORECAST (trang phân tích)                 │
  │                                                              │
  │   Đọc tất cả opportunities (trừ Lost)                        │
  │   Confidence = mặc định theo stage + fine-tune nhân viên     │
  │   Tính: value × confidence / 100                             │
  │   Hiển thị: pipeline funnel, weighted revenue,               │
  │             confidence breakdown, risky deals                │
  │                                                              │
  │   ← Hoàn toàn độc lập với pipeline stage →                   │
  │     Forecast không thay đổi bất kỳ data nào                  │
  └──────────────────────────────────────────────────────────────┘
```

---

## 4. Triết lý Activities & Tasks

Activities phụ trách **ghi nhận mọi tương tác** đã xảy ra: gọi điện, email, họp, demo, ghi chú. Chúng là vết ghi nhận hành trình của deal.

**Hai chiều thời gian trong một Activity:**

| | Log (quá khứ) | Task (tương lai) |
|---|---|---|
| Là gì | Ghi lại tương tác đã xảy ra | Hành động cần làm, có deadline |
| Fields | `date`, `outcome`, `notes` | `nextAction` (text), `nextActionDate` (ISO date) |
| Hiển thị | Timeline trang Activities | Reminders Widget trên Dashboard |
| Khi quá hạn | — | Badge đỏ, cảnh báo proactive |

**Cơ chế Overdue Task**: Khi `nextActionDate` đến hạn mà chưa có Activity mới nào được ghi cho opportunity đó, hệ thống coi đây là task bị bỏ lỡ và hiện cảnh báo trên Reminders Widget. Khác với "stale deal" (reactive — đã trễ mới biết), overdue task là **proactive** — biết trước khi quá muộn.

**Promote deal: Thủ công có Nudge** — nhân viên tự quyết định khi nào promote, hệ thống gợi ý nhưng không tự động thay đổi. Một false promote làm sai forecast của cả team.

---

## 5. Core Value Proposition

| Pain Point | Nyxus giải quyết bằng |
|---|---|
| "Tôi phải tạo Client rồi mới tạo Lead — rất bất tiện, hay nhập sai" | Tạo Lead → Client tự sinh kèm (isProspect), kích hoạt khi qualify |
| "Tôi không biết deal nào đang bị stuck" | Reminders: stale deals + overdue tasks + expiring proposals |
| "nextAction chỉ là text, không ai nhớ follow up" | `nextActionDate` tạo task thật có due date, hiện cảnh báo trên Dashboard |
| "Forecast không đáng tin vì confidence do cá nhân tự nhập tuỳ ý" | Confidence mặc định theo stage, fine-tune trong range — nhất quán toàn team |
| "Tôi không biết tháng này sẽ close được bao nhiêu" | Forecast page với weighted revenue đáng tin |
| "Khách đi từ tiềm năng đến chốt đơn mà không có vết" | Activities timeline + statusHistory ghi nhận toàn bộ hành trình |

---

## 6. Goals — Trạng thái hiện tại

- [x] Dashboard Home: Stats, KPI Chart, Reminders, Top Clients
- [x] Opportunities page: table view, filter theo stage, inline edit, add/delete
- [x] Leads page: card view, stale indicator, promote modal
- [x] Clients page: grid + detail panel + add/edit modal, join stats từ opportunities
- [x] Forecast page: weighted revenue, funnel chart, confidence breakdown
- [x] Activities page: timeline grouped by month, add/delete, KPI bar
- [ ] **Client isProspect**: tạo Lead → tự sinh Client liên kết (isProspect: true)
- [ ] **nextActionDate**: Activities có due date thật, Reminders Widget đọc overdue tasks
- [ ] **Confidence theo stage**: promote → confidence tự nhảy về mặc định stage mới, fine-tune trong range
- [ ] **Activity promote UI + API**: field `promoteOpportunityTo` trong AddActivityModal + PATCH logic
- [ ] Documents page: hiện dùng mock data — chưa wire API
- [ ] Search toàn cục

---

## 7. Non-Goals (Loại trừ khỏi scope v1)

- Không tích hợp email/calendar (không có lead scoring tự động từ open rate, click-through)
- Không có role-based access control
- Không có real-time sync (JSON file làm backend)
- Không có mobile app (responsive web đủ dùng)
- Không có AI gợi ý confidence — stage default + fine-tune thủ công là đủ cho team nhỏ
