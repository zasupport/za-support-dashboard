import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ job_ref: string }> }
) {
  const { job_ref } = await params;
  try {
    const body = await req.json();
    const res = await fetch(`${API_URL}/api/v1/workshop/jobs/${job_ref}/line-items`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 503 });
  }
}
