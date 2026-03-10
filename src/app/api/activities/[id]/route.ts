import { NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/json-db';
import type { Activity } from '@/types';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const activities = await readJSON<Activity[]>('activities.json');
    const activity = activities.find(a => a.id === id);
    if (!activity) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(activity);
  } catch {
    return NextResponse.json({ error: 'Failed to read activity' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const activities = await readJSON<Activity[]>('activities.json');

    const idx = activities.findIndex(a => a.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    activities[idx] = { ...activities[idx], ...body };
    await writeJSON('activities.json', activities);
    return NextResponse.json(activities[idx]);
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const activities = await readJSON<Activity[]>('activities.json');
    const filtered = activities.filter(a => a.id !== id);
    if (filtered.length === activities.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await writeJSON('activities.json', filtered);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
