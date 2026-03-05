import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || 'zasupport2026';
const COOKIE_NAME = 'za_dashboard_auth';
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page and its POST action
  if (pathname === '/login') return NextResponse.next();

  // Allow internal Next.js routes
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) return NextResponse.next();

  // Check auth cookie
  const authCookie = request.cookies.get(COOKIE_NAME);
  if (authCookie?.value === DASHBOARD_PASSWORD) return NextResponse.next();

  // Redirect to login
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
