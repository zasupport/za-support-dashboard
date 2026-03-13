import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ job_ref: string }> }
) {
  const { job_ref } = await params;
  try {
    const res = await fetch(`${API_URL}/api/v1/workshop/jobs/${job_ref}`, {
      headers: { 'X-API-Key': API_TOKEN }, cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json(null, { status: res.status });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json(null, { status: 503 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ job_ref: string }> }
) {
  const { job_ref } = await params;
  try {
    const body = await req.json();
    const endpoint = body.status
      ? `${API_URL}/api/v1/workshop/jobs/${job_ref}/status`
      : `${API_URL}/api/v1/workshop/jobs/${job_ref}`;
    const res = await fetch(endpoint, {
      method: 'PATCH',
      headers: { 'X-API-Key': API_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 503 });
  }
}
