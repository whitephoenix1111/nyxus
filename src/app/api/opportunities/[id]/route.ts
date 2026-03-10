import { NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/json-db';
import type { Opportunity } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const opps = await readJSON<Opportunity[]>('opportunities.json');
    const idx = opps.findIndex((o) => o.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    opps[idx] = { ...opps[idx], ...body };
    await writeJSON('opportunities.json', opps);
    return NextResponse.json(opps[idx]);
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const opps = await readJSON<Opportunity[]>('opportunities.json');
    const filtered = opps.filter((o) => o.id !== id);
    await writeJSON('opportunities.json', filtered);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
