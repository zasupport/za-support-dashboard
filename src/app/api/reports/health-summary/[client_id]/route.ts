import { NextRequest, NextResponse } from 'next/server';

const API_URL   = process.env.ZA_API_URL   || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET(
  _req: NextRequest,
  { params }: { params: { client_id: string } },
) {
  try {
    const res = await fetch(
      `${API_URL}/api/v1/reports/health-summary/${encodeURIComponent(params.client_id)}`,
      { headers: { Authorization: `Bearer ${API_TOKEN}` }, cache: 'no-store' },
    );
    if (!res.ok) return NextResponse.json({ error: 'Backend error' }, { status: res.status });
    return NextResponse.json(await res.json());
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
