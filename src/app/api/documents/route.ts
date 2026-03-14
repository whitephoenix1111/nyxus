import { NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/json-db';
import { requireSession } from '@/lib/session';
import type { Document } from '@/types';

// GET /api/documents
// Query params: clientId, opportunityId
// - salesperson: chỉ thấy documents có ownerId === me
// - manager: thấy tất cả
export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const clientId      = searchParams.get('clientId');
    const opportunityId = searchParams.get('opportunityId');

    let docs = await readJSON<Document[]>('documents.json');

    // Visibility filter — nhất quán với /activities:
    // salesperson thấy documents của bất kỳ client nào có ownerId === me
    if (session.role === 'salesperson') {
      const clients = await readJSON<{ id: string; ownerId: string; archivedAt?: string }[]>('clients.json');
      const myClientIds = new Set(
        clients.filter(c => c.ownerId === session.id).map(c => c.id)
      );
      docs = docs.filter(d => myClientIds.has(d.clientId));
    }

    // Optional query filters
    if (clientId)      docs = docs.filter(d => d.clientId === clientId);
    if (opportunityId) docs = docs.filter(d => d.opportunityId === opportunityId);

    // Sort: starred trước, rồi mới nhất trước
    docs.sort((a, b) => {
      if (a.starred !== b.starred) return a.starred ? -1 : 1;
      return b.uploadedAt.localeCompare(a.uploadedAt);
    });

    return NextResponse.json(docs);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[GET /api/documents]', err);
    return NextResponse.json({ error: 'Failed to read documents' }, { status: 500 });
  }
}

// POST /api/documents
export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();

    if (!body.clientId || !body.name || !body.type || !body.category) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, name, type, category' },
        { status: 400 }
      );
    }

    const newDoc: Document = {
      ...body,
      id:         `doc-${crypto.randomUUID().slice(0, 8)}`,
      uploadedBy: session.id,  // luôn dùng session.id — không cho override từ body
      url:        null,
      starred:    body.starred ?? false,
      uploadedAt: new Date().toISOString(),
    };

    const docs = await readJSON<Document[]>('documents.json');
    docs.push(newDoc);
    await writeJSON('documents.json', docs);

    return NextResponse.json(newDoc, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[POST /api/documents]', err);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}
