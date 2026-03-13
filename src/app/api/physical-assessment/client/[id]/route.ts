import { NextRequest, NextResponse } from 'next/server';

const API_URL   = process.env.ZA_API_URL   || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    // List assessments filtered by client_id, most recent first
    const res = await fetch(
      `${API_URL}/api/v1/physical-assessment/?client_id=${encodeURIComponent(id)}&per_page=5`,
      { headers: { 'X-API-Key': API_TOKEN }, cache: 'no-store' },
    );
    if (!res.ok) return NextResponse.json({ data: [], meta: { total: 0 } }, { status: res.status });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ data: [], meta: { total: 0 } }, { status: 500 });
  }
}
