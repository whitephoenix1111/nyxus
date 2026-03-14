// middleware.ts — Route guard toàn app, đặt ở root (cùng cấp với /src)
// Next.js yêu cầu middleware.ts nằm ở root hoặc src/ — đặt ở root để matcher
// có thể bao phủ cả API routes lẫn page routes trong một file.
//
// Luồng xử lý:
//   1. Skip: _next/*, favicon, PUBLIC_PATHS (/login, /api/auth/*)
//   2. Verify JWT từ httpOnly cookie → session
//   3. Nếu không có session → redirect /login?from=<pathname>
//   4. Nếu route trong MANAGER_ONLY → kiểm tra role, redirect / nếu không phải manager
//   5. Forward session vào request headers (x-user-*) để API routes đọc mà không cần
//      verify lại cookie — tránh double-verify và giữ Edge runtime nhẹ.
//
// Tại sao forward headers thay vì đọc cookie lại trong route?
//   API routes chạy trong Node.js runtime, không có verifyTokenEdge (Edge-only).
//   Đọc cookie + verify trong mỗi route tốn thêm ~5ms/request.
//   Header injection ở middleware (đã verify 1 lần) nhanh hơn và DRY hơn.
//   Trade-off: API routes phải tin tưởng header x-user-* — chấp nhận được vì
//   header này chỉ có thể được set bởi middleware nội bộ, không phải từ client.
import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenEdge, SESSION_COOKIE_NAME } from './src/lib/auth-edge';

// Routes không cần auth
const PUBLIC_PATHS = ['/login', '/api/auth'];

// Routes chỉ manager mới truy cập được
// /forecast đã mở cho sales — page tự filter opps theo ownerId nếu role === 'salesperson'
const MANAGER_ONLY: string[] = [];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware cho static assets và public routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifyTokenEdge(token) : null;

  // Chưa đăng nhập → redirect /login, giữ lại `from` để redirect về sau khi login
  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Manager-only guard: sales vào /forecast → redirect về trang chủ
  if (MANAGER_ONLY.some((p) => pathname.startsWith(p))) {
    if (session.role !== 'manager') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Inject session vào request headers để API routes đọc qua requireSession()
  // mà không cần verify JWT lại (xem giải thích ở file header)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id',   session.id);
  requestHeaders.set('x-user-name', session.name);
  requestHeaders.set('x-user-role', session.role);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // Matcher loại trừ static files của Next.js để middleware không chạy thừa
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
