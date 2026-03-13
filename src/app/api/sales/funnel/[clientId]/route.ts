import { NextRequest, NextResponse } from 'next/server';

const API_URL   = process.env.ZA_API_URL   || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const { clientId } = await params;
  try {
    const res = await fetch(
      `${API_URL}/api/v1/sales/recommendations/${clientId}/funnel`,
      { headers: { 'X-API-Key': API_TOKEN }, cache: 'no-store' },
    );
    if (!res.ok) return NextResponse.json({ stages: [], active_value_rand: 0, converted_value_rand: 0 });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ stages: [], active_value_rand: 0, converted_value_rand: 0 });
  }
}
