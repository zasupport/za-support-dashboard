import { NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET() {
  try {
    const res = await fetch(`${API_URL}/api/v1/agent/commands/risks`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      // Graceful fallback — return sensible defaults if backend endpoint not yet live
      return NextResponse.json({
        run_diagnostic: { level: 'low', description: 'Reads system state only — no changes made.' },
        run_scout:      { level: 'low', description: 'Triggers a full Health Check Scout diagnostic pass.' },
        force_update:   { level: 'medium', description: 'Updates Scout agent on the client machine.' },
        log_flush:      { level: 'low', description: 'Clears cached log buffers — safe to run anytime.' },
        custom_script:  { level: 'high', description: 'Executes a custom script — review carefully before queuing.' },
      });
    }
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({
      run_diagnostic: { level: 'low', description: 'Reads system state only — no changes made.' },
      run_scout:      { level: 'low', description: 'Triggers a full Health Check Scout diagnostic pass.' },
      force_update:   { level: 'medium', description: 'Updates Scout agent on the client machine.' },
      log_flush:      { level: 'low', description: 'Clears cached log buffers — safe to run anytime.' },
      custom_script:  { level: 'high', description: 'Executes a custom script — review carefully before queuing.' },
    });
  }
}
