# F01 — Dashboard (Home Page)

> **Status**: Phase 1 — MVP Priority  
> **Route**: `/`

---

## Mục tiêu

Trang chính cho phép Sales Manager nhìn toàn bộ pipeline trong 1 màn hình.

## Acceptance Criteria

- [ ] Hiển thị 4 StatCard với số lượng và tổng value theo từng status
- [ ] StatCard "Opportunities" (Lead) có lime background là active state mặc định
- [ ] KPI Scatter Chart hiển thị tất cả opportunities theo thời gian (12 tháng)
- [ ] ReferenceLine ngang tại giá trị trung bình
- [ ] Dot màu lime = Order, dot xám = Lead/Proposal/Forecast
- [ ] KPI Summary bên phải chart: Total Sales, Open Quotes, Opportunities + trend %
- [ ] Reminders widget: hiển thị count stale leads và no-contact counts
- [ ] Top 25 Clients: 2-column grid, sort by value desc
- [ ] Responsive: collapsible SidePanel trên màn hình < 1280px

## Data Dependencies

- `useStatsByStatus()` → StatsBar
- `useMonthlyChartData()` + `useAverageValue()` → ScatterChart
- `useStaleLeads()` → RemindersWidget
- `useTopClients(25)` → TopClientsWidget

## UI Reference

Xem mockup: `docs/assets/dashboard-mockup.png`  
Màu nền StatsBar Opportunity card: `#DFFF00`, text: `#000000`
