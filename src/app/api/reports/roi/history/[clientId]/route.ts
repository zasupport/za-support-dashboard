import { NextRequest, NextResponse } from 'next/server';

const API_URL   = process.env.ZA_API_URL   || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const { clientId } = await params;
  const limit = req.nextUrl.searchParams.get('limit') || '12';
  try {
    const res = await fetch(
      `${API_URL}/api/v1/reports/roi/${encodeURIComponent(clientId)}/history?limit=${limit}`,
      { headers: { Authorization: `Bearer ${API_TOKEN}` }, cache: 'no-store' },
    );
    if (!res.ok) return NextResponse.json({ periods: [] }, { status: res.status });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ periods: [] });
  }
}
