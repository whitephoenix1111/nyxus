# LLD — Component Breakdown

---

## 1. Component Tree (Home Dashboard)

```
app/layout.tsx
├── <TopNav />
│     ├── Logo (lime dot grid)
│     ├── NavLinks: [Home, Leads, Opportunities, Clients, Forecast, Documents]
│     ├── SearchBar
│     ├── AddButton (+)
│     └── UserAvatar
│
app/page.tsx  (Dashboard)
├── <PageHeader title="Home" />
├── <StatsBar />
│     ├── <StatCard status="Lead" />       ← lime bg, active state
│     ├── <StatCard status="Proposal" />
│     ├── <StatCard status="Forecast" />
│     └── <StatCard status="Order" />
│
├── <MainPanel />
│     ├── <SalesTabBar />                  ← All Sales / Transactions / Tools / Reports
│     ├── <FilterToolbar />                ← icon buttons (time, people, phone, timer...)
│     └── <KPISection />
│           ├── <KPIScatterChart />        ← Recharts ScatterChart
│           └── <KPISummary />
│                 ├── Total Sales value + trend
│                 ├── Open Quotes count + trend
│                 └── Opportunities count + trend
│
└── <SidePanel />
      ├── <RemindersWidget />
      │     ├── <ReminderCard type="stale_lead" />
      │     └── <ReminderCard type="no_contact" />
      └── <TopClientsWidget />
            └── <ClientCard />  (×25, 2-column grid)
```

---

## 2. Component Props

### `<StatCard />`
```typescript
interface StatCardProps {
  status: OpportunityStatus;
  count: number;
  totalValue: number;
  delta?: number;         // +28, hiển thị màu xanh/đỏ
  isActive?: boolean;     // true → lime background
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
  averageValue: number;   // Cho ReferenceLine
  height?: number;        // default: 320
}
```
**Recharts config quan trọng:**
- `<Scatter>` với `shape` custom: circle có `fill="#DFFF00"` nếu status === 'Order', `fill="#555"` nếu khác
- `<ReferenceLine y={averageValue} stroke="#DFFF00" strokeDasharray="4 4" />`
- `<Tooltip>` custom styled với dark background
- X-axis: label tháng viết thường (jan, feb, ...)

### `<ReminderCard />`
```typescript
interface ReminderCardProps {
  count: number;
  label: string;          // "Leads, prospects, and customer without..."
  icon: LucideIcon;
  accentColor?: string;   // default: lime
}
```

### `<ClientCard />`
```typescript
interface ClientCardProps {
  clientName: string;
  company: string;
  avatar: string;         // initials hoặc image URL
  totalValue: number;
}
```

---

## 3. Layout & Styling Notes

### Grid System (Home page)
```
┌─────────────────────────────┬──────────────┐
│  Main Content (flex-1)      │  SidePanel   │
│                             │  (w-80)      │
│  StatsBar (full width)      │  Reminders   │
│  ──────────────────         │              │
│  SalesTabBar                │  Top Clients │
│  KPISection                 │              │
└─────────────────────────────┴──────────────┘
```

### Color Usage Rules
| Element | Color |
|---|---|
| Page background | `#000000` |
| Card background | `#111111` |
| Card hover | `#1A1A1A` |
| Active StatCard bg | `#DFFF00` |
| Active StatCard text | `#000000` |
| Accent / highlights | `#DFFF00` |
| Body text | `#FFFFFF` |
| Muted text | `#888888` |
| Border | `#222222` |

### Typography
- Display numbers (StatCard, KPI): `font-bold`, large size (text-3xl+)
- Labels: `text-xs uppercase tracking-widest text-gray-500`
- Nav links: `text-sm font-medium`

---

## 4. TopNav Behavior
- Active route: tab có `background: #1A1A1A`, `border-radius: 9999px`
- Search bar: `bg-[#111]`, border `#333`, focus border `#DFFF00`
- `+` button: `bg-[#1A1A1A]` hover `bg-[#DFFF00]` với transition
