import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET() {
  try {
    const res = await fetch(`${API_URL}/api/v1/sales/opportunities/`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` }, cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json([]);
    return NextResponse.json(await res.json());
  } catch { return NextResponse.json([]); }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${API_URL}/api/v1/sales/opportunities/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to create opportunity' }, { status: 503 });
  }
}
