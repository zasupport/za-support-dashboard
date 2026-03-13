import { NextResponse } from 'next/server';

const API_URL   = process.env.ZA_API_URL   || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET() {
  try {
    const res = await fetch(
      `${API_URL}/api/v1/clients/daily-actions`,
      {
        headers: {
          'X-API-Key': API_TOKEN,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );
    if (!res.ok) return NextResponse.json([], { status: res.status });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([]);
  }
}
