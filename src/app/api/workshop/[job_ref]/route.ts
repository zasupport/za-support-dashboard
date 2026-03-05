import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { job_ref: string } }
) {
  try {
    const body = await req.json();
    // Route to status endpoint or general update based on body keys
    const endpoint = body.status
      ? `${API_URL}/api/v1/workshop/jobs/${params.job_ref}/status`
      : `${API_URL}/api/v1/workshop/jobs/${params.job_ref}`;
    const res = await fetch(endpoint, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 503 });
  }
}
