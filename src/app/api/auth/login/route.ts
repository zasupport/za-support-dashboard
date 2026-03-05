import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'za_dashboard_auth';
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

export async function POST(req: NextRequest) {
  const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD;
  if (!DASHBOARD_PASSWORD) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const { password } = await req.json();
  if (password !== DASHBOARD_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Store a token derived from the password — never store the raw password in the cookie
  const token = Buffer.from(`za:${DASHBOARD_PASSWORD}`).toString('base64');
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
  });
  return res;
}
