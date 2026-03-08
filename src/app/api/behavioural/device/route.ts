import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('client_id');
  const deviceId = req.nextUrl.searchParams.get('device_id');

  if (!clientId || !deviceId) {
    return NextResponse.json({ error: 'client_id and device_id required' }, { status: 400 });
  }

  const apiUrl = process.env.ZA_API_URL ?? 'https://api.zasupport.com';
  const token  = process.env.ZA_API_TOKEN ?? '';

  try {
    const res = await fetch(
      `${apiUrl}/api/v1/behavioural/device/${encodeURIComponent(clientId)}/${encodeURIComponent(deviceId)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }
    );
    if (!res.ok) return NextResponse.json({});
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({});
  }
}
