// src/app/api/auth/me/route.ts
// Trả về session user hiện tại — dùng bởi useAuthStore.fetchSession()

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json(session);
}
