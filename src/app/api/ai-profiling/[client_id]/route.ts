import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.zasupport.com';
const TOKEN = process.env.AGENT_AUTH_TOKEN || '';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ client_id: string }> }
) {
  const { client_id } = await params;

  try {
    const [profileRes, similarRes, patternsRes] = await Promise.all([
      fetch(`${API_BASE}/api/v1/ai-profiling/clients/${client_id}`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
        next: { revalidate: 3600 },
      }),
      fetch(`${API_BASE}/api/v1/ai-profiling/clients/${client_id}/similar?limit=5`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
        next: { revalidate: 3600 },
      }),
      fetch(`${API_BASE}/api/v1/ai-profiling/patterns`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
        next: { revalidate: 3600 },
      }),
    ]);

    const profile = profileRes.ok ? (await profileRes.json()).data : null;
    const similar = similarRes.ok ? (await similarRes.json()).data : [];
    const patterns = patternsRes.ok ? (await patternsRes.json()).data : [];

    // Filter patterns to those affecting this client
    const clientPatterns = patterns.filter((p: any) =>
      Array.isArray(p.affected_clients) && p.affected_clients.includes(client_id)
    );

    return NextResponse.json({ profile, similar, patterns: clientPatterns });
  } catch {
    return NextResponse.json({ profile: null, similar: [], patterns: [] });
  }
}
