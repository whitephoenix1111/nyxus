import { NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/json-db';
import { requireSession } from '@/lib/session';
import type { Document, Client } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Helper dùng chung: sales phụ trách client của doc, hoặc manager
async function canMutate(doc: Document, sessionId: string, sessionRole: string) {
  if (sessionRole === 'manager') return true;
  const clients = await readJSON<Client[]>('clients.json');
  const client  = clients.find(c => c.id === doc.clientId);
  return client?.ownerId === sessionId;
}

// PATCH /api/documents/[id]
// Guard: sales phụ trách client liên quan, hoặc manager
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await requireSession();
    const { id }  = await params;

    const docs = await readJSON<Document[]>('documents.json');
    const idx  = docs.findIndex(d => d.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (!await canMutate(docs[idx], session.id, session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body    = await request.json();
    const allowed = ['starred', 'name', 'category'] as const;
    const patch: Partial<Document> = {};
    for (const key of allowed) {
      if (key in body) (patch as Record<string, unknown>)[key] = body[key];
    }

    docs[idx] = { ...docs[idx], ...patch };
    await writeJSON('documents.json', docs);

    return NextResponse.json(docs[idx]);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[PATCH /api/documents/:id]', err);
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
  }
}

// DELETE /api/documents/[id]
// Guard: sales phụ trách client liên quan, hoặc manager
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await requireSession();
    const { id }  = await params;

    const docs = await readJSON<Document[]>('documents.json');
    const doc  = docs.find(d => d.id === id);
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (!await canMutate(doc, session.id, session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await writeJSON('documents.json', docs.filter(d => d.id !== id));
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[DELETE /api/documents/:id]', err);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
