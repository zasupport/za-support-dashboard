import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ client_id: string }> }
) {
  const { client_id } = await params;
  const body = await req.json();
  const res = await fetch(`${API_URL}/api/v1/clients/${client_id}/status`, {
    method: 'PATCH',
    headers: { 'X-API-Key': API_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
