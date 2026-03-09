# CHANGELOG

> Ghi lại các thay đổi lớn về spec/kiến trúc theo thời gian.

---

## [Unreleased] — 2026-03-09

### Added
- Khởi tạo toàn bộ cấu trúc docs (VISION, HLD, LLD, Features)
- Thêm field `lastContactDate` vào `Opportunity` interface (dùng cho Reminders logic)
- Định nghĩa 5 selectors trong lld-store.md
- Chi tiết 6 feature specs (F01–F06)

### Decisions
- Backend: JSON file thay vì database (đơn giản, migrate sau)
- State: Zustand thay vì Redux (ít boilerplate hơn cho team nhỏ)
- Charts: Recharts thay vì D3 (React-native, dễ maintain)
