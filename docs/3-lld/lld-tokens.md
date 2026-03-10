# Design Tokens — Nyxus CRM

> Source of truth cho màu sắc và font. **Không dùng raw hex trong component** — luôn dùng token.
> Định nghĩa đầy đủ trong: `src/app/globals.css` block `@theme inline`

---

## Typography

| Variable | Font | Dùng cho |
|---|---|---|
| `--font-display` / `var(--font-syne)` | **Syne** | Headings, nav labels, số liệu lớn |
| `--font-body` / `var(--font-geist)` | **Geist** | Body text, descriptions |
| `--font-mono` / `var(--font-dm-mono)` | **DM Mono** | Giá tiền, IDs, data values, % |

**Tailwind class shortcuts:**
- `.text-display` → Syne Bold, tabular-nums, tight tracking
- `.text-data` → DM Mono, tabular-nums
- `.text-label` → Syne 600, 11px, uppercase, wide tracking

---

## Brand Colors

| Token | Hex | Dùng cho |
|---|---|---|
| `--color-brand` | `#DFFF00` | CTA buttons, active state, accent |
| `--color-brand-dim` | `#B8D400` | Hover state của brand elements |
| `--color-brand-muted` | `#DFFF0022` | Background tint (chart dots bg, highlights) |
| `--color-brand-border` | `#DFFF0044` | Border khi element đang active/selected |

**Quy tắc**: Brand lime chỉ xuất hiện ở **1 element quan trọng nhất** mỗi vùng. Không dùng cho text thông thường.

---

## Neutral Scale

| Token | Hex | Dùng cho |
|---|---|---|
| `--color-neutral-0` | `#000000` | Page background |
| `--color-neutral-50` | `#0A0A0A` | Subtle background variation |
| `--color-neutral-100` | `#111111` | Card background |
| `--color-neutral-150` | `#161616` | Card alt background |
| `--color-neutral-200` | `#1A1A1A` | Card hover / active nav tab |
| `--color-neutral-300` | `#222222` | Border default |
| `--color-neutral-400` | `#333333` | Border hover / dividers |
| `--color-neutral-500` | `#555555` | Muted icons |
| `--color-neutral-600` | `#888888` | Placeholder text / muted labels |
| `--color-neutral-700` | `#AAAAAA` | Secondary text |
| `--color-neutral-800` | `#CCCCCC` | Body text |
| `--color-neutral-900` | `#FFFFFF` | Primary text / headings |

---

## Semantic Aliases (dùng trong component)

| Token | Alias của | Dùng cho |
|---|---|---|
| `--color-bg` | neutral-0 | `background-color` của body |
| `--color-surface` | neutral-100 | Card, panel background |
| `--color-surface-alt` | neutral-150 | Nested card background |
| `--color-surface-hover` | neutral-200 | Hover state |
| `--color-border` | neutral-300 | Default borders |
| `--color-border-hover` | neutral-400 | Hover borders |
| `--color-text-primary` | neutral-900 | Headings, important text |
| `--color-text-secondary` | neutral-700 | Supporting text |
| `--color-text-muted` | neutral-600 | Placeholders, hints |
| `--color-text-disabled` | neutral-500 | Disabled states |

---

## Status Colors (Opportunity Status)

| Status | BG | Text | Border |
|---|---|---|---|
| Lead | `#1A1A1A` | `#AAAAAA` | `#333333` |
| Qualified | `#0D1B2A` | `#5BA3F5` | `#1A3A5C` |
| Proposal | `#1A1000` | `#F5A742` | `#3A2500` |
| Negotiation | `#1A1400` | `#F5C842` | `#3A3000` |
| Won | `#DFFF0015` | `#DFFF00` | `#DFFF0044` |
| Lost | `#1C0505` | `#EF4444` | `#7f1d1d` |

**Tailwind classes có sẵn**: `.badge-lead`, `.badge-qualified`, `.badge-proposal`, `.badge-negotiation`, `.badge-won`, `.badge-lost`

---

## Semantic Feedback Colors

| Token | Hex | Dùng cho |
|---|---|---|
| `--color-success` | `#22C55E` | Positive delta (+1.2%), confirmed order |
| `--color-warning` | `#F59E0B` | Caution, expiring proposal |
| `--color-danger` | `#EF4444` | Negative delta, overdue reminder |
| `--color-info` | `#3B82F6` | Neutral informational |

---

## Chart Colors

| Token | Hex | Dùng cho |
|---|---|---|
| `--color-chart-order` | `#DFFF00` | Scatter dots — Order |
| `--color-chart-forecast` | `#F5C842` | Scatter dots — Forecast |
| `--color-chart-proposal` | `#5BA3F5` | Scatter dots — Proposal |
| `--color-chart-lead` | `#555555` | Scatter dots — Lead |
| `--color-chart-avg-line` | `#DFFF0088` | ReferenceLine average |
| `--color-chart-grid` | `#1A1A1A` | Grid lines |
| `--color-chart-axis` | `#444444` | Axis tick labels |

---

## Utility Classes

| Class | Effect |
|---|---|
| `.card` | Surface bg + border + border-radius + hover transition |
| `.card-brand` | Lime bg + black text (active StatCard) |
| `.badge` | Base badge reset |
| `.btn-primary` | Lime button — CTA |
| `.btn-ghost` | Transparent button với border |
| `.focus-ring` | Lime outline on focus-visible |
| `.glow-brand` | `drop-shadow` lime mờ (chart dots hover) |
| `.glow-brand-strong` | `drop-shadow` lime mạnh (selected element) |
