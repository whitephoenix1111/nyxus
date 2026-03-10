import { NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/json-db';
import type { Client } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const industry = searchParams.get('industry');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search')?.toLowerCase();

    let clients = await readJSON<Client[]>('clients.json');

    if (industry) {
      clients = clients.filter((c) => c.industry === industry);
    }
    if (tag) {
      clients = clients.filter((c) => c.tags.includes(tag as Client['tags'][number]));
    }
    if (search) {
      clients = clients.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.company.toLowerCase().includes(search) ||
          c.email.toLowerCase().includes(search)
      );
    }

    return NextResponse.json(clients);
  } catch {
    return NextResponse.json({ error: 'Failed to read clients' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const clients = await readJSON<Client[]>('clients.json');

    const newClient: Client = {
      ...body,
      id: `cli-${crypto.randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    clients.push(newClient);
    await writeJSON('clients.json', clients);

    return NextResponse.json(newClient, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
