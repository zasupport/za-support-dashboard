import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_KEY = process.env.ZA_API_KEY || '';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const res = await fetch(`${API_URL}/api/v1/lifecycle/${id}`, {
      headers: { 'X-API-Key': API_KEY },
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ data: [] }, { status: res.status });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ data: [] });
  }
}
