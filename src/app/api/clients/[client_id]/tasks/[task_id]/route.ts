import { NextRequest, NextResponse } from 'next/server';

const API_URL   = process.env.ZA_API_URL   || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { client_id: string; task_id: string } }
) {
  try {
    const body = await req.json();
    const res = await fetch(
      `${API_URL}/api/v1/clients/${params.client_id}/tasks/${params.task_id}`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
      }
    );
    if (!res.ok) return NextResponse.json({ error: 'Update failed' }, { status: res.status });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
