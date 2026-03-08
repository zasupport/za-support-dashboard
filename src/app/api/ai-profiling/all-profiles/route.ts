import { NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

interface ClientRecord {
  client_id: string;
  [key: string]: unknown;
}

interface ClientsResponse {
  data?: ClientRecord[];
  [key: string]: unknown;
}

export async function GET() {
  try {
    // Step 1: get all clients
    const clientsRes = await fetch(`${API_URL}/api/v1/clients?per_page=100`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      cache: 'no-store',
    });
    if (!clientsRes.ok) return NextResponse.json([]);

    const clientsData: ClientsResponse = await clientsRes.json();
    const clients: ClientRecord[] = Array.isArray(clientsData)
      ? clientsData
      : (clientsData.data ?? []);

    // Limit to 20 to avoid timeout
    const limited = clients.slice(0, 20);

    // Step 2: fetch AI profile for each client in parallel
    const profiles = await Promise.all(
      limited.map(async (client: ClientRecord) => {
        try {
          const profileRes = await fetch(
            `${API_URL}/api/v1/ai-profiling/clients/${encodeURIComponent(client.client_id)}`,
            {
              headers: { Authorization: `Bearer ${API_TOKEN}` },
              cache: 'no-store',
            }
          );
          if (!profileRes.ok) return null;
          const profile = await profileRes.json();
          return { ...client, ...profile };
        } catch {
          return null;
        }
      })
    );

    return NextResponse.json(profiles.filter(Boolean));
  } catch {
    return NextResponse.json([]);
  }
}
