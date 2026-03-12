// src/lib/auth.ts
// JWT sign/verify dùng jose (bundled với Next.js — không cần cài thêm)
// Password: plain-text compare cho internal tool (không public-facing)
// Nâng lên bcrypt khi cần production hardening.

import { SignJWT, jwtVerify } from 'jose';
import type { SessionUser } from '@/types';

// ── Secret key ────────────────────────────────────────────────────
// Trong production: dùng biến môi trường JWT_SECRET
const RAW_SECRET = process.env.JWT_SECRET ?? 'nyxus-dev-secret-change-in-production';
const SECRET = new TextEncoder().encode(RAW_SECRET);

export const COOKIE_NAME = 'nyxus_session';
const TOKEN_TTL   = '8h'; // session hết hạn sau 8 tiếng

// ── Sign JWT ──────────────────────────────────────────────────────
export async function signToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(SECRET);
}

// ── Verify JWT ────────────────────────────────────────────────────
// Trả về SessionUser nếu hợp lệ, null nếu hết hạn/sai chữ ký
export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

// ── Password compare ──────────────────────────────────────────────
// So sánh plain-text — đủ cho internal CRM, không public internet
export function comparePassword(plain: string, stored: string): boolean {
  return plain === stored;
}

// ── Cookie config ─────────────────────────────────────────────────
export const SESSION_COOKIE = {
  name:     COOKIE_NAME,
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path:     '/',
  maxAge:   60 * 60 * 8, // 8 tiếng (giây)
};
