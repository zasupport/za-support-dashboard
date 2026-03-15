import { NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET() {
  try {
    const res = await fetch(`${API_URL}/api/v1/agent/commands/summary`, {
      headers: { 'X-API-Key': API_TOKEN },
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ pending: 0, by_client: {}, _error: true });
    const data = await res.json();
    const summary: any[] = data.summary ?? [];
    const totalPending = summary.reduce((sum: number, c: any) => sum + (c.pending ?? 0), 0);
    const byClient = Object.fromEntries(summary.map((c: any) => [c.client_id, c.pending ?? 0]));
    return NextResponse.json({ pending: totalPending, by_client: byClient, unassigned_machines_count: data.unassigned_machines_count ?? 0 });
  } catch {
    return NextResponse.json({ by_client: {}, _error: true });
  }
}
