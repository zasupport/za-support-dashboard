import { NextResponse } from "next/server";

const API_BASE = process.env.ZA_API_URL || "https://api.zasupport.com";
const API_TOKEN = process.env.ZA_API_TOKEN || "";

export async function POST() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/notifications/digest/send-now`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { data: { sent: false, message: `Request failed: ${err}` } },
      { status: 500 }
    );
  }
}
