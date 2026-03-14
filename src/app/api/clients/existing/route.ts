import { NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/json-db';
import { requireRole } from '@/lib/session';
import type { Client, Opportunity } from '@/types';
import { STAGE_DEFAULT_CONFIDENCE } from '@/types';

// POST /api/clients/existing
// Dành cho khách hàng đã hợp tác trước đây — không qua pipeline Lead
// Body: { name, company, email?, phone?, industry?, country?, website?, notes?, tags?, value, contractDate?, ownerId? }
// Returns: { client: Client, opportunity: Opportunity }
// Side effects: tạo Client + Opportunity (Won, confidence: 100%)
//
// Manager có thể truyền ownerId để giao cho salesperson.
// Salesperson không truyền ownerId — server dùng session.id.

export async function POST(request: Request) {
  try {
    // Manager được phép import client cũ và chọn salesperson phụ trách
    const session = await requireRole(['salesperson', 'manager']);
    const body = await request.json();
    const {
      name,
      company,
      email       = '',
      phone       = '',
      industry    = 'Unknown',
      country     = '',
      website     = '',
      notes       = '',
      tags        = [],
      value,
      contractDate,
    } = body;

    if (!name || !company || !value) {
      return NextResponse.json(
        { error: 'name, company, value là bắt buộc' },
        { status: 400 }
      );
    }

    // Manager có thể giao cho salesperson qua ownerId.
    // Salesperson không được tự assign cho người khác — luôn dùng session.id.
    const ownerId = session.role === 'manager' && body.ownerId
      ? body.ownerId
      : session.id;

    const today = new Date().toISOString().split('T')[0];
    const clientId = `cli-${crypto.randomUUID().slice(0, 8)}`;
    const oppId    = `opp-${crypto.randomUUID().slice(0, 8)}`;

    const avatar = name
      .split(' ')
      .slice(0, 2)
      .map((w: string) => w[0].toUpperCase())
      .join('');

    // Client import — không có isProspect
    const newClient: Client = {
      id:       clientId,
      ownerId,
      name,
      company,
      avatar,
      email,
      phone,
      industry,
      country,
      website,
      tags,
      notes,
      createdAt: today,
    };

    // Opportunity Won — confidence cố định 100%, không qua pipeline
    // statusHistory rỗng: import không có lịch sử promote
    const newOpportunity: Opportunity = {
      id: oppId,
      ownerId,
      clientId,
      title: body.title || `Import — ${company}`,
      value: Number(value),
      status: 'Won',
      date: contractDate || today,
      confidence: STAGE_DEFAULT_CONFIDENCE['Won'], // 100
      notes,
      statusHistory: [],
      company: undefined,
      clientName: undefined
    };

    const [clients, opportunities] = await Promise.all([
      readJSON<Client[]>('clients.json'),
      readJSON<Opportunity[]>('opportunities.json'),
    ]);

    clients.push(newClient);
    opportunities.push(newOpportunity);

    await Promise.all([
      writeJSON('clients.json', clients),
      writeJSON('opportunities.json', opportunities),
    ]);

    return NextResponse.json({ client: newClient, opportunity: newOpportunity }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/clients/existing]', err);
    return NextResponse.json({ error: 'Failed to create existing client' }, { status: 500 });
  }
}
