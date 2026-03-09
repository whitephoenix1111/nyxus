# LLD — Low-Level Design Overview

> Index tài liệu LLD. Mỗi module có file riêng.

| File | Mô tả |
|---|---|
| `lld-data.md` | JSON schema, mock data, API routes |
| `lld-store.md` | Zustand store: state, actions, selectors |
| `lld-components.md` | Component props, logic, render tree |

---

## Nguyên tắc thiết kế chi tiết

1. **Zero prop drilling**: Mọi data đi qua Zustand, không pass quá 2 level
2. **Colocation**: Logic của component nằm gần component đó
3. **Selector pattern**: Computed values dùng `useMemo` trong selector, không tính trong component
4. **Pessimistic UI cho write, Optimistic cho read**: Khi thêm/sửa data, đợi API confirm trước khi cập nhật store
