import { NextRequest, NextResponse } from 'next/server';

const API_URL   = process.env.ZA_API_URL   || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

// POST /api/proposals — create a new proposal
export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    const res = await fetch(`${API_URL}/api/v1/proposals/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return NextResponse.json({ error: 'Failed to create proposal' }, { status: res.status });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// GET /api/proposals — list proposals
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status') || '';
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  try {
    const res = await fetch(`${API_URL}/api/v1/proposals/${qs}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ proposals: [] });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ proposals: [] });
  }
}
