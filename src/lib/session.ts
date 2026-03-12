// src/lib/session.ts
// Helper đọc session từ cookie — dùng trong:
//   - Server Components: import trực tiếp
//   - API Routes:        import trực tiếp
//   - middleware.ts:     dùng verifyToken trực tiếp (không dùng next/headers)

import { cookies } from 'next/headers';
import { verifyToken, SESSION_COOKIE } from './auth';
import type { SessionUser } from '@/types';

// Trả về SessionUser nếu có session hợp lệ, null nếu chưa login / hết hạn
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE.name)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// Variant cho API route handlers — trả về session hoặc throw 401 response
export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return session;
}

// Variant kiểm tra role — throw 403 nếu sai role
export async function requireRole(
  allowedRoles: SessionUser['role'][]
): Promise<SessionUser> {
  const session = await requireSession();
  if (!allowedRoles.includes(session.role)) {
    throw new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return session;
}
