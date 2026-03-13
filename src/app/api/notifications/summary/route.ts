import { NextResponse } from "next/server";

const API_BASE = process.env.ZA_API_URL || "https://api.zasupport.com";
const API_TOKEN = process.env.ZA_API_TOKEN || "";

export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/notifications/digest/summary`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      next: { revalidate: 30 },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ pending_count: 0, last_digest_sent_at: null });
  }
}
