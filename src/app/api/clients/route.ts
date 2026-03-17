// src/app/api/clients/route.ts
import { NextResponse } from 'next/server';
import { getClients, createClient } from '@/lib/queries';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clients = await getClients({
      industry: searchParams.get('industry') ?? undefined,
      tag:      searchParams.get('tag') ?? undefined,
      search:   searchParams.get('search') ?? undefined,
    });
    return NextResponse.json(clients);
  } catch {
    return NextResponse.json({ error: 'Failed to read clients' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const today = new Date().toISOString().slice(0, 10);
    const client = await createClient({ ...body, createdAt: today });
    return NextResponse.json(client, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
