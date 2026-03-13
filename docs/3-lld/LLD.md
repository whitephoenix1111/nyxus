# LLD — Low-Level Design Overview

> Index tài liệu LLD. Mỗi module có file riêng.

| File | Mô tả |
|---|---|
| `lld-data-types.md` | TypeScript interfaces, hằng số confidence, JSON schema examples |
| `lld-data-api.md` | API routes chi tiết, side effects, guard rules |
| `lld-store.md` | Zustand stores: state, actions, selectors có code |
| `lld-components.md` | Component tree, props interface, layout & styling rules |
| `lld-tokens.md` | Design tokens: colors, typography, utility classes |

---

## Nguyên tắc thiết kế chi tiết

1. **Zero prop drilling** — Mọi data đi qua Zustand, không pass quá 2 level
2. **Colocation** — Logic của component nằm gần component đó
3. **Selector pattern** — Computed values dùng `useMemo` trong selector, không tính trong component
4. **Pessimistic UI cho write, Optimistic cho read** — POST đợi API confirm trước khi cập nhật store; PATCH/DELETE update local trước, rollback nếu lỗi
5. **No circular store imports** — Selectors cần cross-store data nhận tham số thay vì import store khác
