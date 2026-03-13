// GET /api/users
// Trả về danh sách user (không có passwordHash)
// Query param: role=salesperson|manager (optional filter)

import { NextResponse } from 'next/server';
import { readJSON } from '@/lib/json-db';
import { getSession } from '@/lib/session';
import type { User, SessionUser } from '@/types';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role');

    // Đọc raw records từ DB (có passwordHash), strip trước khi trả về
    const records = await readJSON<User[]>('users.json');

    let users: SessionUser[] = records.map(({ passwordHash: _, ...u }) => u);

    if (roleFilter) {
      users = users.filter(u => u.role === roleFilter);
    }

    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: 'Failed to read users' }, { status: 500 });
  }
}
