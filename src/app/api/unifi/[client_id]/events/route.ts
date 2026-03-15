import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ client_id: string }> }
) {
  const { client_id } = await params;
  const { searchParams } = new URL(req.url);
  const severity = searchParams.get("severity") || "";
  const limit = searchParams.get("limit") || "100";
  const hours = searchParams.get("hours") || "";

  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "https://api.zasupport.com";
  const token = process.env.ZA_API_TOKEN || "";

  const qs = new URLSearchParams({ limit });
  if (severity) qs.set("severity", severity);
  if (hours) qs.set("hours", hours);

  try {
    const resp = await fetch(`${apiBase}/api/v1/unifi/${client_id}/events?${qs}`, {
      headers: { "X-API-Key": token },
      next: { revalidate: 30 },
    });
    const data = await resp.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ events: [], summary: {}, error: String(err) }, { status: 200 });
  }
}
