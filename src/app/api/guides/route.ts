import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

const headers = () => ({ Authorization: `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' });

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const category = searchParams.get('category') || '';
  const page = searchParams.get('page') || '1';
  const per_page = searchParams.get('per_page') || '50';
  const params = new URLSearchParams({ page, per_page });
  if (category) params.set('category', category);
  try {
    const res = await fetch(`${API_URL}/api/v1/guides?${params}`, {
      headers: headers(),
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ data: [], meta: {} });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ data: [], meta: {} });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    const res = await fetch(`${API_URL}/api/v1/guides`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) return NextResponse.json(json, { status: res.status });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
