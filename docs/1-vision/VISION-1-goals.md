# VISION (1/2) — Mục tiêu & Pipeline

> **Tagline**: "Pipeline clarity. Revenue velocity."
> File tiếp theo: `VISION-2-workflow.md`

---

## 1. Mục tiêu sản phẩm

Nyxus là Sales CRM dashboard tập trung vào:
- **Visibility**: Nhìn thấy toàn bộ pipeline từ Contact → Won trong một màn hình.
- **Velocity**: Phát hiện ngay bottleneck, stale deals, tasks sắp đến hạn.
- **Forecasting**: Dự báo doanh thu dựa trên `confidence` score gắn với stage — không phải cảm tính cá nhân.

**Người dùng mục tiêu**: Sales Manager và Sales Rep trong team B2B, quy mô 5–50 người.

---

## 2. Triết lý Pipeline

### Chiều dữ liệu thực tế B2B

Dữ liệu không bắt đầu từ Client — mà từ **Contact** (người vừa gặp). Client chỉ được tạo khi deal đủ nghiêm túc để qualify:

```
Contact (gặp lần đầu)
  │  Qualify (BANT: Budget, Authority, Need, Timeline)
  ▼
Client (activated) ──► Opportunity ──► Activity
```

**Giải pháp**: Client có field `isProspect`. Tạo Lead → Client sinh kèm với `isProspect: true`. Promote → Qualified → `isProspect: false`. Nhân viên không cần tạo Client riêng.

### Pipeline Stage

```
Lead → Qualified → Proposal → Negotiation → Won
                                           ↘ Lost
```

| Stage | Ý nghĩa | Confidence mặc định | Override range |
|---|---|---|---|
| **Lead** | Mới vào, chưa qualify | 15% | ✗ cố định |
| **Qualified** | BANT pass | 35% | ✓ ±15% |
| **Proposal** | Đã gửi đề xuất | 60% | ✓ ±15% |
| **Negotiation** | Đang thương lượng | 80% | ✓ ±10% |
| **Won** | Chốt đơn | 100% | ✗ cố định |
| **Lost** | Thất bại — giữ để phân tích | 0% | ✗ cố định |

> **Confidence theo stage** — Khi promote, confidence tự nhảy về mặc định stage mới. Nhân viên chỉ fine-tune trong range. Forecast nhất quán toàn team.

---

## 3. Triết lý Activities & Tasks

| | Log (quá khứ) | Task (tương lai) |
|---|---|---|
| Là gì | Tương tác đã xảy ra | Hành động cần làm, có deadline |
| Fields | `date`, `outcome`, `notes` | `nextAction` (text), `nextActionDate` (ISO date) |
| Hiển thị | Timeline Activities | Reminders Widget Dashboard |
| Khi quá hạn | — | Badge đỏ, cảnh báo proactive |

**Overdue Task**: `nextActionDate` đến hạn mà chưa có Activity mới → cảnh báo proactive (khác stale deal — reactive).

**Promote**: Thủ công, nhân viên tự quyết. Một false promote làm sai forecast cả team.

---

## 4. Core Value Proposition

| Pain Point | Nyxus giải quyết |
|---|---|
| Phải tạo Client riêng rồi mới tạo Lead | Tạo Lead → Client tự sinh (isProspect), kích hoạt khi qualify |
| Không biết deal nào bị stuck | Reminders: overdue tasks + stale deals + expiring proposals |
| nextAction chỉ là text, không ai nhớ | `nextActionDate` tạo task có due date, hiện cảnh báo Dashboard |
| Forecast không đáng tin | Confidence theo stage, fine-tune trong range — nhất quán toàn team |
| Không biết tháng này close bao nhiêu | Forecast page với weighted revenue đáng tin |
| Không có vết từ tiềm năng đến chốt | Activities timeline + statusHistory ghi nhận toàn hành trình |

---

## 5. Non-Goals (scope v1)

- Không tích hợp email/calendar
- Không role-based access control
- Không real-time sync (JSON file làm backend)
- Không mobile app (responsive web đủ dùng)
- Không AI gợi ý confidence — stage default + fine-tune thủ công là đủ cho team nhỏ
