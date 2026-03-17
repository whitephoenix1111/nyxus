// src/app/api/documents/[id]/route.ts
import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { getDocuments, updateDocument, deleteDocument, getClientOwner } from '@/lib/queries';

interface RouteParams { params: Promise<{ id: string }> }

// Guard: sales phụ trách client của doc, hoặc manager
async function canMutate(clientId: string, sessionId: string, sessionRole: string): Promise<boolean> {
  if (sessionRole === 'manager') return true;
  const ownerId = await getClientOwner(clientId);
  return ownerId === sessionId;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await requireSession();
    const { id }  = await params;
    const body    = await request.json();

    // Lấy doc để biết clientId — dùng getDocuments filter theo id không có sẵn,
    // query thẳng qua getDocuments không filter để tìm doc
    const all = await getDocuments();
    const doc = all.find(d => d.id === id);
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (!await canMutate(doc.clientId, session.id, session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Chỉ cho phép patch các field an toàn
    const patch: Record<string, unknown> = {};
    for (const key of ['starred', 'name', 'category'] as const) {
      if (key in body) patch[key] = body[key];
    }

    const updated = await updateDocument(id, patch);
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[PATCH /api/documents/:id]', err);
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await requireSession();
    const { id }  = await params;

    const all = await getDocuments();
    const doc = all.find(d => d.id === id);
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (!await canMutate(doc.clientId, session.id, session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await deleteDocument(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[DELETE /api/documents/:id]', err);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
