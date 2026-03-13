# VISION (1/2) — Mục tiêu & Pipeline

> **Tagline**: "Pipeline clarity. Revenue velocity."
> File tiếp theo: `VISION-2-workflow.md`

---

## 1. Mục tiêu sản phẩm

Nyxus là Sales CRM dashboard tập trung vào:

- **Visibility** — Nhìn thấy toàn bộ pipeline từ Lead đến Won trong một màn hình.
- **Velocity** — Phát hiện ngay bottleneck, stale deals, tasks sắp đến hạn.
- **Forecasting** — Dự báo doanh thu dựa trên `confidence` gắn với stage — không phải cảm tính cá nhân.

**Người dùng mục tiêu**: Sales Manager và Sales Rep trong team B2B, quy mô 5–50 người.

---

## 2. Triết lý Pipeline

### Chiều dữ liệu B2B thực tế

Dữ liệu không bắt đầu từ Client mà từ một **contact** vừa gặp. Client chỉ được kích hoạt khi deal đủ nghiêm túc để qualify:

```
Contact (gặp lần đầu)
  │  Sales nhập: tên, email, công ty, deal value
  ▼
POST /api/leads
  → Client (isProspect: true)  +  Opportunity (Lead, confidence: 15%)
  → clientId hard FK

  Promote → Qualified
  → client.isProspect = false  →  xuất hiện ở trang Clients
```

Nhân viên không tạo Client riêng — `isProspect` xử lý toàn bộ lifecycle.

### Pipeline Stages

```
Lead → Qualified → Proposal → Negotiation → Won
                                           ↘ Lost
```

| Stage | Ý nghĩa | Confidence mặc định | Fine-tune range |
|---|---|---|---|
| **Lead** | Mới vào, chưa qualify | 15% | Cố định |
| **Qualified** | BANT pass | 35% | 20–50% |
| **Proposal** | Đã gửi đề xuất | 60% | 45–75% |
| **Negotiation** | Đang thương lượng | 80% | 70–90% |
| **Won** | Chốt đơn | 100% | Cố định |
| **Lost** | Thất bại — giữ để phân tích | 0% | Cố định |

> Khi promote, confidence tự nhảy về mặc định stage mới. Nhân viên chỉ fine-tune trong range. Forecast nhất quán toàn team.

---

## 3. Triết lý Activities & Tasks

| | Activity (quá khứ) | Task (tương lai) |
|---|---|---|
| Là gì | Tương tác đã xảy ra | Hành động cần làm, có deadline |
| Tạo bởi | Nhân viên log thủ công | Tạo thủ công hoặc auto từ `nextAction` của activity |
| Fields chính | `type`, `outcome`, `notes`, `nextAction`, `nextActionDate` | `title`, `dueDate`, `status` |
| Hiển thị | Activities page — timeline theo tháng | Tasks section + Dashboard Reminders |
| Khi quá hạn | — | Badge đỏ, cảnh báo proactive trên Dashboard |

**Overdue task**: `nextActionDate` đến hạn mà chưa có Activity mới → cảnh báo proactive.
Khác với stale deal (reactive, dựa vào `lastContactDate`).

**Promote**: Thủ công, nhân viên tự quyết qua PromoteModal. Một false promote làm sai forecast cả team.

---

## 4. Core Value Proposition

| Pain Point | Nyxus giải quyết |
|---|---|
| Phải tạo Client riêng rồi mới tạo Lead | `POST /api/leads` tạo đồng thời — `isProspect` xử lý lifecycle |
| Không biết deal nào bị stuck | Reminders: overdue tasks + stale deals + expiring proposals |
| `nextAction` chỉ là text, không ai nhớ | `nextActionDate` → task có due date, cảnh báo proactive trên Dashboard |
| Forecast không đáng tin | Confidence theo stage, fine-tune trong range — nhất quán toàn team |
| Không biết tháng này close bao nhiêu | Forecast page với weighted revenue = `SUM(value × confidence/100)` |
| Không có vết từ tiềm năng đến chốt | Activities timeline + `statusHistory` ghi nhận toàn hành trình |

---

## 5. Non-Goals (v1)

- Không tích hợp email / calendar
- Không real-time sync (JSON file làm backend)
- Không mobile app (responsive web đủ dùng)
- Không AI gợi ý confidence — stage default + fine-tune thủ công đủ cho team nhỏ
