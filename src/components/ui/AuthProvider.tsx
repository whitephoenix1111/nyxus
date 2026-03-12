'use client';

// src/components/ui/AuthProvider.tsx
// Mount một lần ở layout.tsx — fetch session từ server vào Zustand store
// Sau khi fetch xong: redirect về /login nếu không có session

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

const PUBLIC_PAGES = ['/login'];

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const fetchSession = useAuthStore((s) => s.fetchSession);
  const user         = useAuthStore((s) => s.user);
  const isLoading    = useAuthStore((s) => s.isLoading);
  const pathname     = usePathname();
  const router       = useRouter();

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Sau khi load xong: nếu không có session và không ở public page → redirect login
  useEffect(() => {
    if (!isLoading && !user && !PUBLIC_PAGES.includes(pathname)) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, user, pathname, router]);

  return <>{children}</>;
}
