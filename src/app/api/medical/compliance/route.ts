import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET(req: NextRequest) {
  const page     = req.nextUrl.searchParams.get('page')     || '1';
  const per_page = req.nextUrl.searchParams.get('per_page') || '100';
  const params   = new URLSearchParams({ page, per_page });
  try {
    const res = await fetch(
      `${API_URL}/api/v1/medical/compliance?${params}`,
      { headers: { 'X-API-Key': API_TOKEN }, cache: 'no-store' }
    );
    if (!res.ok) return NextResponse.json({ data: [], meta: {} });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ data: [], meta: {} });
  }
}
