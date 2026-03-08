import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'za_dashboard_auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page and auth API
  if (pathname === '/login') return NextResponse.next();
  if (pathname.startsWith('/api/auth/')) return NextResponse.next();

  // Allow public client portal (shareable read-only links — no auth required)
  if (pathname.startsWith('/portal/')) return NextResponse.next();

  // Allow internal Next.js routes
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) return NextResponse.next();

  // If no password configured, allow all traffic (unauthenticated mode)
  const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD;
  if (!DASHBOARD_PASSWORD) return NextResponse.next();

  // Validate auth cookie — compare against base64 token derived from env var
  const authCookie = request.cookies.get(COOKIE_NAME);
  if (authCookie?.value === Buffer.from(`za:${DASHBOARD_PASSWORD}`).toString('base64')) {
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
