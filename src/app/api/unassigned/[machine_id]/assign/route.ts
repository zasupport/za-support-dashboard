import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ machine_id: string }> }
) {
  try {
    const { machine_id } = await params;
    const body = await req.json();
    const res = await fetch(
      `${API_URL}/api/v1/agent/unassigned/${machine_id}/assign`,
      {
        method: 'POST',
        headers: {
          'X-API-Key': API_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: 'Server error' }, { status: 500 });
  }
}
