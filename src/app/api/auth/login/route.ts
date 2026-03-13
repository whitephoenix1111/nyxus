// src/app/api/auth/login/route.ts

import { NextResponse } from 'next/server';
import { readJSON } from '@/lib/json-db';
import { signToken, comparePassword, SESSION_COOKIE } from '@/lib/auth';
import type { User, SessionUser } from '@/types';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Thiếu email hoặc mật khẩu' }, { status: 400 });
    }

    const users = await readJSON<User[]>('users.json');
    const user = users.find((u) => u.email === email.toLowerCase().trim());

    if (!user || !comparePassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Email hoặc mật khẩu không đúng' }, { status: 401 });
    }

    const sessionUser: SessionUser = {
      id:     user.id,
      name:   user.name,
      email:  user.email,
      role:   user.role,
      avatar: user.avatar,
    };

    const token = await signToken(sessionUser);

    const response = NextResponse.json(sessionUser, { status: 200 });
    response.cookies.set({
      ...SESSION_COOKIE,
      value: token,
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
