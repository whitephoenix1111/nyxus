# LLD — Component Breakdown

> File trước: `lld-store.md`

---

## 1. Component Tree

```
app/layout.tsx (RootLayout)
└── <TopNav />
      ├── Logo (lime dot grid)
      ├── NavLinks: Home · Leads · Opportunities · Clients · Forecast · Activities · Documents
      │     Active: bg-[#1A1A1A] rounded-full
      ├── UserAvatar
      └── Logout button → <ConfirmDialog variant="warning" />

app/page.tsx (Dashboard)
├── <PageHeader title="Home" />
├── <StatsBar />
│     ├── <StatCard status="Lead" />
│     ├── <StatCard status="Proposal" />
│     ├── <StatCard status="Negotiation" />
│     └── <StatCard status="Won" />
│
├── <MainPanel /> (flex-1)
│     └── <KPISection />
│           ├── <KPIScatterChart />   ← Recharts ScatterChart
│           └── <KPISummary />
│                 ├── Total weighted revenue + trend
│                 ├── Open deals count + trend
│                 └── Opportunities count + trend
│
└── <SidePanel /> (w-80)
      ├── <RemindersWidget />
      │     ├── <ReminderCard type="overdue_task" />
      │     ├── <ReminderCard type="stale_deal" />
      │     └── <ReminderCard type="expiring_proposal" />
      └── <TopClientsWidget />
            └── <ClientMiniCard /> ×N (2-column grid)

app/leads/page.tsx
├── <PageHeader />
├── <OwnerFilter /> (manager only)
├── <LeadCard /> ×N
│     ├── Tags row (h-[46px] cố định)
│     ├── Client name, company, value
│     ├── <OwnerBadge /> (manager only)
│     └── Status bar bottom
├── <LeadModal />          ← Tạo lead + optional first task
├── <PromoteModal />       ← Thăng stage; Won/Lost có confirm thêm
└── <AssignLeadModal />    ← Manager only

app/opportunities/page.tsx
├── <PageHeader />
├── Filter tabs: All | Lead | Qualified | Proposal | Negotiation | Won | Lost
├── <OwnerFilter /> (manager only)
└── Table: clientName · company · value · confidence · status badge · lastContactDate
    (Read-only — không có action buttons)

app/clients/page.tsx
├── <PageHeader />
├── <OwnerFilter /> (manager only)
├── <ClientCard /> ×N (grid)
│     └── <OwnerBadge /> góc dưới (manager only)
└── <DetailPanel /> (slide-over)
      ├── Tab "Cơ hội" — danh sách opportunities
      ├── Tab "Tài liệu" — documents của client
      └── canEdit guard: ẩn Edit/Delete nếu non-owner

app/forecast/page.tsx  (Manager only)
├── Header: Weighted Revenue = SUM(value × confidence/100)
├── Funnel chart by stage
├── Table: opportunities trừ Lost
│     Columns: Client · Value · Confidence (%) · Weighted Value · Stage
└── Confidence fine-tune inline (trong range của stage)

app/activities/page.tsx
├── <KpiBar />            ← tổng hoạt động, tỷ lệ positive, breakdown outcome
├── <OwnerFilter /> (manager only)
├── Filter: type + outcome + search
└── Timeline grouped by month (mới nhất trước)
      └── <ActivityCard />
            ├── Expand → notes + nextAction + nextActionDate
            └── nextActionDate: badge vàng (pending) / đỏ (overdue)

app/documents/page.tsx
├── <OwnerFilter /> (manager only)
├── Filter: category + search
├── <DocumentCard /> ×N
└── <UploadDocModal />
      ├── Searchable client select (chỉ client của mình)
      ├── Deal select filter theo clientId (optional)
      └── category / type select
```

---

## 2. Component Props

### `<StatCard />`
```typescript
interface StatCardProps {
  status: OpportunityStatus;
  count: number;
  totalValue: number;
  delta?: number;       // % change — xanh nếu dương, đỏ nếu âm
  isActive?: boolean;   // true → lime background (.card-brand)
}
```

### `<KPIScatterChart />`
```typescript
interface KPIScatterChartProps {
  data: Array<{
    month: number;        // 0–11
    value: number;
    status: OpportunityStatus;
    clientName: string;
  }>;
  averageValue: number;  // ReferenceLine ngang
  height?: number;       // default: 320
}
```

Recharts config:
- `<Scatter shape>` custom: `fill="#DFFF00"` nếu Won, `fill="#555"` nếu khác
- `<ReferenceLine y={averageValue} stroke="#DFFF0088" strokeDasharray="4 4" />`
- `<Tooltip>` custom dark background
- X-axis: tên tháng viết thường (jan, feb, ...)

### `<ReminderCard />`
```typescript
interface ReminderCardProps {
  type: 'overdue_task' | 'stale_deal' | 'expiring_proposal';
  count: number;
  label: string;
  description: string;
  icon: LucideIcon;
  accentColor?: string;  // default: lime; warning: amber; danger: red
}
```

### `<LeadCard />`
```typescript
interface LeadCardProps {
  client: Client;
  opportunity: Opportunity;
  tags: ClientTag[];        // computed tags
  onPromote: (id: string) => void;
  onAssign?: (id: string) => void;  // manager only
}
```

Tags row: `h-[46px]` cố định — tránh layout shift khi tags khác nhau.

### `<PromoteModal />`
```typescript
interface PromoteModalProps {
  opportunity: Opportunity;
  onClose: () => void;
}
```

Logic:
- Hiển thị stages hợp lệ tiếp theo (không cho skip ngược)
- Confidence preview tự tính theo `STAGE_DEFAULT_CONFIDENCE[selectedStage]`
- Fine-tune slider hiện nếu stage có range
- Won / Lost: confirm dialog thêm trước khi thực thi

### `<AddActivityModal />`
```typescript
interface AddActivityModalProps {
  clientId?: string;         // pre-fill nếu mở từ client detail
  opportunityId?: string;    // pre-fill
  onClose: () => void;
}
```

2 bước:
1. Form log activity: type, title, date, outcome, nextAction, nextActionDate, promoteOpportunityTo (optional)
2. Nếu nextAction có giá trị → confirm "Tạo task follow-up?" với deadline = nextActionDate

### `<ConfirmDialog />`
```typescript
interface ConfirmDialogProps {
  title: string;
  message: string;
  variant: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}
```

### `<OwnerBadge />` / `<OwnerFilter />`
- `<OwnerBadge ownerId={string} />` — chỉ render nếu `useIsManager()` trả true
- `<OwnerFilter onChange={(ownerId) => void} />` — chỉ render nếu manager; dropdown danh sách salespersons

---

## 3. Layout & Grid

### Dashboard
```
┌──────────────────────────────────┬──────────┐
│  StatsBar (full width, 4 cards)  │          │
├──────────────────────────────────┤ SidePanel│
│  KPISection                      │ w-80     │
│    KPIScatterChart (flex-1)      │ Reminders│
│    KPISummary                    │          │
│                                  │ Top      │
│                                  │ Clients  │
└──────────────────────────────────┴──────────┘
```

SidePanel collapse (`hidden`) trên màn hình `< 1280px`.

### Color Rules

| Element | Token |
|---|---|
| Page background | `--color-bg` (#000) |
| Card background | `--color-surface` (#111) |
| Card hover | `--color-surface-hover` (#1A1A1A) |
| Active StatCard | `.card-brand` (lime bg, black text) |
| Accent / CTA | `--color-brand` (#DFFF00) |
| Body text | `--color-text-primary` (#FFF) |
| Muted text | `--color-text-muted` (#888) |
| Border default | `--color-border` (#222) |
| Overdue badge | `--color-danger` (#EF4444) |
| Warning badge | `--color-warning` (#F59E0B) |
