# F07 — Activities Page

> **Status**: Phase 2 — hoàn thành UI + data layer  
> **Route**: `/activities`

---

## Mục tiêu

Ghi lại và theo dõi mọi tương tác giữa sales rep và khách hàng — cuộc gọi, email, họp mặt, demo, ghi chú. Đây là "nhật ký sales" giúp team không bao giờ mất context.

## Data Model

```typescript
type ActivityType    = 'call' | 'email' | 'meeting' | 'demo' | 'note';
type ActivityOutcome = 'positive' | 'neutral' | 'negative';

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  date: string;              // ISO 8601
  clientId: string;          // ref → clients.json
  clientName: string;        // denormalized
  company: string;           // denormalized
  opportunityId?: string;    // optional ref → opportunities.json
  outcome: ActivityOutcome;
  nextAction: string;
  notes: string;
  createdAt: string;
}
```

## API Routes

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/api/activities` | Lấy danh sách, filter: `?type=`, `?outcome=`, `?clientId=`, `?search=` |
| POST | `/api/activities` | Tạo mới |
| PATCH | `/api/activities/[id]` | Cập nhật |
| DELETE | `/api/activities/[id]` | Xóa |

## Store (`useActivityStore.ts`)

Selectors:
- `useActivitiesByType()` — count theo từng loại
- `useActivitiesByOutcome()` — count theo kết quả
- `useRecentActivities(limit)` — N hoạt động mới nhất
- `useActivitiesForClient(clientId)` — lọc theo client (dùng cho detail panel)

## UI Features

- **KPI bar** — tổng hoạt động, tỷ lệ tích cực, breakdown theo outcome với progress bar
- **Timeline grouped by month** — mỗi card có thể expand để xem ghi chú + next action
- **Next action highlight** — nổi bật bằng lime border khi expand card
- **Filter** — theo loại (call/email/...) và kết quả (positive/neutral/negative)
- **Modal thêm mới** — type selector, validate, date picker, outcome select

## Acceptance Criteria

- [x] Hiển thị timeline grouped theo tháng, sort mới nhất trước
- [x] KPI: tổng số, tỷ lệ positive, breakdown outcome
- [x] Filter theo type + outcome + search
- [x] Expand card để xem notes + nextAction
- [x] Modal thêm mới đầy đủ fields + validate
- [x] Xóa activity
- [x] `lastContactDate` trên Opportunity nên được update khi thêm Activity (future: auto-sync)
