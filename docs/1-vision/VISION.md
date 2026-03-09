# VISION — Nyxus Sales CRM

> **Tagline**: "Pipeline clarity. Revenue velocity."

---

## 1. Mục tiêu sản phẩm

Nyxus là một Sales CRM dashboard tập trung vào:
- **Visibility**: Nhìn thấy toàn bộ pipeline từ Lead → Order trong một màn hình.
- **Velocity**: Phát hiện ngay bottleneck, stale deals, và cơ hội cần hành động.
- **Forecasting**: Dự báo doanh thu dựa trên confidence score của từng opportunity.

**Người dùng mục tiêu**: Sales Manager và Sales Rep trong team B2B, quy mô 5–50 người.

---

## 2. Core Value Proposition

| Pain Point | Nyxus giải quyết bằng |
|---|---|
| "Tôi không biết deal nào đang bị stuck" | Reminders widget cảnh báo deals không có activity > 3 ngày |
| "Tôi không biết tháng này sẽ close được bao nhiêu" | Forecast page với weighted revenue (value × confidence) |
| "Báo cáo doanh thu phải export từ nhiều nơi" | KPI Scatter Chart tổng hợp tất cả opportunities theo thời gian |

---

## 3. Goals (Ngắn hạn — MVP)

- [x] Dashboard Home với Stats, KPI Chart, Reminders, Top Clients
- [ ] Leads page: list + add/edit lead
- [ ] Opportunities page: Kanban hoặc table view theo status
- [ ] Clients page: list clients với total value
- [ ] Forecast page: revenue projection
- [ ] Documents page: placeholder

## 4. Non-Goals (Loại trừ khỏi scope)

- Không tích hợp email/calendar trong v1
- Không có role-based access control trong v1
- Không có real-time sync (dùng JSON file làm backend)
- Không có mobile app (responsive web đủ dùng)

---

## 5. Design Philosophy

- **Black (#000000)** nền tuyệt đối — không compromise
- **Lime (#DFFF00)** accent — chỉ dùng cho element quan trọng nhất, không lạm dụng
- Mọi số liệu phải **scannable trong 3 giây**
- Animation: purposeful, không decorative
