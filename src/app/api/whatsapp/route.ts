import { NextRequest, NextResponse } from 'next/server';

const API_URL   = process.env.ZA_API_URL!;
const API_TOKEN = process.env.ZA_API_TOKEN!;

/** GET /api/whatsapp?limit=50&client_id= — recent inbound WhatsApp messages */
export async function GET(req: NextRequest) {
  const limit     = req.nextUrl.searchParams.get('limit') || '50';
  const client_id = req.nextUrl.searchParams.get('client_id') || '';

  let url = `${API_URL}/api/v1/whatsapp/inbound?limit=${limit}`;
  if (client_id) url += `&client_id=${encodeURIComponent(client_id)}`;

  try {
    const res = await fetch(url, {
      headers: { 'X-API-Key': API_TOKEN },
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ messages: [] }, { status: 500 });
  }
}
