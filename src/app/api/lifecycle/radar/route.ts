import { NextRequest, NextResponse } from 'next/server';

const API_URL   = process.env.ZA_API_URL   || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';
const API_KEY   = process.env.ZA_API_KEY   || '';

export async function GET(req: NextRequest) {
  const urgency = req.nextUrl.searchParams.get('urgency') || '';
  const url = `${API_URL}/api/v1/lifecycle/radar${urgency ? `?urgency=${urgency}` : ''}`;
  try {
    const res = await fetch(url, {
      headers: {
        'X-API-Key': API_KEY,
        'Authorization': `Bearer ${API_TOKEN}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ data: [], meta: { total: 0 } }, { status: res.status });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ data: [], meta: { total: 0 } });
  }
}
