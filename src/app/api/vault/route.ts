import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET(req: NextRequest) {
  const client_id = req.nextUrl.searchParams.get('client_id') || '';
  try {
    const res = await fetch(
      `${API_URL}/api/v1/vault/entries?client_id=${encodeURIComponent(client_id)}&limit=50`,
      { headers: { 'X-API-Key': API_TOKEN }, cache: 'no-store' }
    );
    if (!res.ok) return NextResponse.json([]);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json([]);
  }
}
