// src/app/api/users/route.ts
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getUsers } from '@/lib/queries';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const users = await getUsers(searchParams.get('role') ?? undefined);

    // Strip passwordHash trước khi trả về
    return NextResponse.json(users.map(({ passwordHash: _, ...u }) => u));
  } catch {
    return NextResponse.json({ error: 'Failed to read users' }, { status: 500 });
  }
}
