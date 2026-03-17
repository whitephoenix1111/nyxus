// src/app/api/documents/route.ts
import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { getDocuments, createDocument, getClients } from '@/lib/queries';

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const clientId      = searchParams.get('clientId') ?? undefined;
    const opportunityId = searchParams.get('opportunityId') ?? undefined;

    let myClientIds: string[] | undefined;
    if (session.role === 'salesperson') {
      const clients  = await getClients();
      myClientIds    = clients.filter(c => c.ownerId === session.id).map(c => c.id);
    }

    const docs = await getDocuments({ clientId, opportunityId, myClientIds });
    return NextResponse.json(docs);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Failed to read documents' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body    = await request.json();

    if (!body.clientId || !body.name || !body.type || !body.category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const doc = await createDocument({
      ...body,
      uploadedBy: session.id, // luôn dùng session.id — không cho override
      url:        null,
      starred:    body.starred ?? false,
      uploadedAt: new Date().toISOString(),
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}
