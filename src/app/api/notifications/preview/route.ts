import { NextResponse } from "next/server";

const API_BASE = process.env.ZA_API_URL || "https://api.zasupport.com";
const API_TOKEN = process.env.ZA_API_TOKEN || "";

export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/notifications/digest/preview`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      // No cache — always fetch fresh so Courtney sees live queue
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({
      data: {
        pending_count: 0,
        will_send_at: "17:00 SAST",
        subject_preview: "",
        body_preview: "",
        groups: {},
        last_digest_sent_at: null,
        generated_at: null,
      },
    });
  }
}
