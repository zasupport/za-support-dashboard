import { NextRequest, NextResponse } from 'next/server';

const API_URL   = process.env.ZA_API_URL!;
const API_TOKEN = process.env.ZA_API_TOKEN!;

export async function GET(req: NextRequest) {
  const client_id = req.nextUrl.searchParams.get('client_id') || '';
  const status    = req.nextUrl.searchParams.get('status') || '';
  const per_page  = req.nextUrl.searchParams.get('per_page') || '100';

  let url = `${API_URL}/api/v1/sales/contracts/?per_page=${per_page}`;
  if (client_id) url += `&client_id=${encodeURIComponent(client_id)}`;
  if (status)    url += `&status=${encodeURIComponent(status)}`;

  try {
    const res = await fetch(url, {
      headers: { 'X-API-Key': API_TOKEN },
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ contracts: [] }, { status: 500 });
  }
}
