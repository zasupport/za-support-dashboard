import { NextRequest, NextResponse } from 'next/server';

const API_URL   = process.env.ZA_API_URL   ?? 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN ?? '';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const qs = searchParams.toString();
  const url = `${API_URL}/api/v1/sales/repair-sequences/${qs ? `?${qs}` : ''}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch repair sequences' }, { status: 502 });
  }
}
