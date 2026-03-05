import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'za_dashboard_auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page and auth API
  if (pathname === '/login') return NextResponse.next();
  if (pathname.startsWith('/api/auth/')) return NextResponse.next();

  // Allow internal Next.js routes
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) return NextResponse.next();

  // Validate auth cookie — compare against base64 token derived from env var
  const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD;
  const authCookie = request.cookies.get(COOKIE_NAME);
  if (DASHBOARD_PASSWORD && authCookie?.value === Buffer.from(`za:${DASHBOARD_PASSWORD}`).toString('base64')) {
    return NextResponse.next();
  }

  // Redirect to login
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
