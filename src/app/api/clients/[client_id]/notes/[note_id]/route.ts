import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ client_id: string; note_id: string }> }
) {
  const { client_id, note_id } = await params;
  const res = await fetch(`${API_URL}/api/v1/clients/${client_id}/notes/${note_id}`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
  if (!res.ok) return NextResponse.json({ error: 'Failed to delete note' }, { status: res.status });
  return NextResponse.json(await res.json());
}
