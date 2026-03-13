import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

// PATCH /api/activation/[code]/revoke
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  try {
    const res = await fetch(
      `${API_URL}/api/v1/agent/activation-codes/${encodeURIComponent(code)}/revoke`,
      { method: 'PATCH', headers: { 'X-API-Key': API_TOKEN } }
    );
    if (!res.ok) return NextResponse.json({ detail: 'Revoke failed' }, { status: res.status });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ detail: 'Network error' }, { status: 500 });
  }
}
