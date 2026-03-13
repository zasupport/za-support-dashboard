import { NextRequest, NextResponse } from 'next/server';

const API_URL   = process.env.ZA_API_URL   || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  try {
    const res = await fetch(
      `${API_URL}/api/v1/sales/recommendations/${id}/status`,
      {
        method: 'PATCH',
        headers: {
          'X-API-Key': API_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        cache: 'no-store',
      },
    );
    if (!res.ok) return NextResponse.json({ error: 'upstream failed' }, { status: res.status });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: 'proxy error' }, { status: 500 });
  }
}
