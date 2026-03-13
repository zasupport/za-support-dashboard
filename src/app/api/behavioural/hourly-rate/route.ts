import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest) {
  const apiUrl = process.env.ZA_API_URL ?? 'https://api.zasupport.com';
  const token  = process.env.ZA_API_TOKEN ?? '';

  try {
    const body = await req.json();
    const { client_id, hourly_rate_zar } = body;
    if (!client_id || !hourly_rate_zar) {
      return NextResponse.json({ error: 'client_id and hourly_rate_zar required' }, { status: 400 });
    }

    const res = await fetch(`${apiUrl}/api/v1/behavioural/hourly-rate/${encodeURIComponent(client_id)}`, {
      method: 'PUT',
      headers: {
        'X-API-Key': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ hourly_rate_zar }),
    });

    if (!res.ok) return NextResponse.json({ error: 'upstream error' }, { status: res.status });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
