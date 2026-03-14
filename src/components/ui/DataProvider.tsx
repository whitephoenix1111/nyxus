// src/components/ui/DataProvider.tsx — Bootstrap tất cả stores một lần sau khi login
//
// Vấn đề cũ: mỗi trang tự fetch khi mount → store không đồng bộ khi navigate.
// Ví dụ: xóa client ở /clients → /opportunities vẫn hiển thị opps cũ vì
// trang đó đã mount và không biết có thay đổi xảy ra.
//
// Giải pháp: DataProvider mount ở layout (ngang cấp AuthProvider), fetch
// tất cả stores ngay sau khi user login. Các trang chỉ đọc từ store,
// không tự fetch nữa. Sau mutate, gọi invalidate() để refetch đúng resource.
//
// Flow:
//   App mount → AuthProvider fetch session
//   → user login → DataProvider detect user → bootstrap() fetch tất cả
//   → navigate giữa các trang: data đã có sẵn, không cần fetch lại
//   → mutate (xóa client) → invalidate(['clients', 'opportunities'])
//   → tất cả trang đang mở đều re-render với data mới

'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useDataStore } from '@/store/useDataStore';

export default function DataProvider({ children }: { children: React.ReactNode }) {
  const user         = useAuthStore(s => s.user);
  const isAuthLoading = useAuthStore(s => s.isLoading);
  const bootstrap    = useDataStore(s => s.bootstrap);
  const bootstrapped = useDataStore(s => s.bootstrapped);

  // Dùng ref để track userId đã bootstrap — tránh gọi lại khi re-render
  const bootstrappedForUser = useRef<string | null>(null);

  useEffect(() => {
    // Chờ auth load xong và có user mới bootstrap
    if (isAuthLoading) return;
    if (!user) {
      // User logout → reset flag để bootstrap lại khi login lần sau
      bootstrappedForUser.current = null;
      return;
    }
    // Tránh bootstrap lại với cùng userId (strict mode double-invoke)
    if (bootstrappedForUser.current === user.id) return;

    bootstrappedForUser.current = user.id;
    bootstrap();
  }, [user, isAuthLoading, bootstrap]);

  // Không block render — hiển thị children ngay, loading state do từng store xử lý
  return <>{children}</>;
}
