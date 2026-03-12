// middleware.ts — đặt ở root (cùng cấp với src/)
import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenEdge, SESSION_COOKIE_NAME } from './src/lib/auth-edge';

// /api/auth/* luôn public — không chặn login, me, logout
const PUBLIC_PATHS = ['/login', '/api/auth'];
const MANAGER_ONLY = ['/forecast'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifyTokenEdge(token) : null;

  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (MANAGER_ONLY.some((p) => pathname.startsWith(p))) {
    if (session.role !== 'manager') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id',   session.id);
  requestHeaders.set('x-user-name', session.name);
  requestHeaders.set('x-user-role', session.role);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
