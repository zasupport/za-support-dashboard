import { NextResponse } from "next/server";

const API_BASE = process.env.ZA_API_URL || "https://api.zasupport.com";
const API_TOKEN = process.env.ZA_API_TOKEN || "";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "all";
  const limit = searchParams.get("limit") || "100";

  try {
    const res = await fetch(
      `${API_BASE}/api/v1/notifications/digest?status=${status}&limit=${limit}`,
      {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
        next: { revalidate: 30 },
      }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ data: [], meta: { pending_count: 0 } });
  }
}
