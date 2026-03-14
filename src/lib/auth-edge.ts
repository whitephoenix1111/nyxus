// src/lib/auth-edge.ts
// Phiên bản Edge-safe của auth — dùng TRONG middleware.ts
// Không import từ @/types vì alias không resolve được trong Edge runtime

import { jwtVerify } from 'jose';

export interface SessionPayload {
  id: string;
  name: string;
  email: string;
  role: 'salesperson' | 'manager';
  avatar: string;
}

const RAW_SECRET = process.env.JWT_SECRET ?? 'nyxus-dev-secret-change-in-production';
const SECRET = new TextEncoder().encode(RAW_SECRET);

export const SESSION_COOKIE_NAME = 'nyxus_session';

export async function verifyTokenEdge(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
