// src/app/api/auth/logout/route.ts

import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name:     SESSION_COOKIE.name,
    value:    '',
    httpOnly: SESSION_COOKIE.httpOnly,
    secure:   SESSION_COOKIE.secure,
    sameSite: SESSION_COOKIE.sameSite,
    path:     SESSION_COOKIE.path,
    maxAge:   0, // xóa cookie ngay lập tức
  });
  return response;
}
