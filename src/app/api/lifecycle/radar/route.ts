import { NextRequest, NextResponse } from 'next/server';

const API_URL   = process.env.ZA_API_URL  || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const urgency = searchParams.get('urgency') || '';

  const url = urgency
    ? `${API_URL}/api/v1/lifecycle/radar?urgency=${urgency}`
    : `${API_URL}/api/v1/lifecycle/radar`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ data: [], meta: { total: 0, critical: 0, overdue: 0, soon: 0 } });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ data: [], meta: { total: 0, critical: 0, overdue: 0, soon: 0 } });
  }
}
