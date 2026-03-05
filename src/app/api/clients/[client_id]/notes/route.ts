import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

const headers = () => ({ Authorization: `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' });

export async function GET(_req: NextRequest, { params }: { params: { client_id: string } }) {
  const res = await fetch(`${API_URL}/api/v1/clients/${params.client_id}/notes`, {
    headers: headers(),
    cache: 'no-store',
  });
  if (!res.ok) return NextResponse.json([]);
  return NextResponse.json(await res.json());
}

export async function POST(req: NextRequest, { params }: { params: { client_id: string } }) {
  const body = await req.json();
  const res = await fetch(`${API_URL}/api/v1/clients/${params.client_id}/notes`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) return NextResponse.json({ error: 'Failed to save note' }, { status: res.status });
  return NextResponse.json(await res.json());
}
