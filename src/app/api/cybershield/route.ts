import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

const headers = () => ({ 'X-API-Key': API_TOKEN, 'Content-Type': 'application/json' });

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get('_path') || 'summary';
  const qs = new URLSearchParams(searchParams);
  qs.delete('_path');
  const qstr = qs.toString();
  try {
    const res = await fetch(`${API_URL}/api/v1/cybershield/${path}${qstr ? `?${qstr}` : ''}`, { headers: headers() });
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/pdf')) {
      const buf = await res.arrayBuffer();
      return new NextResponse(buf, {
        status: res.status,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': res.headers.get('Content-Disposition') || 'attachment',
        },
      });
    }
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get('_path') || '';
  const qs = new URLSearchParams(searchParams);
  qs.delete('_path');
  const qstr = qs.toString();
  try {
    const body = await req.text();
    const res = await fetch(`${API_URL}/api/v1/cybershield/${path}${qstr ? `?${qstr}` : ''}`, {
      method: 'POST',
      headers: headers(),
      body,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 503 });
  }
}

export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get('_path') || '';
  const qs = new URLSearchParams(searchParams);
  qs.delete('_path');
  const qstr = qs.toString();
  try {
    const body = await req.text();
    const res = await fetch(`${API_URL}/api/v1/cybershield/${path}${qstr ? `?${qstr}` : ''}`, {
      method: 'PATCH',
      headers: headers(),
      body,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 503 });
  }
}
