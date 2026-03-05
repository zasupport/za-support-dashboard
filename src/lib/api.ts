const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';
const TIMEOUT_MS = 10000;

const headers = () => ({
  'Authorization': `Bearer ${API_TOKEN}`,
  'Content-Type': 'application/json',
});

function withTimeout(ms: number) {
  return AbortSignal.timeout(ms);
}

export async function fetchDevices() {
  try {
    const res = await fetch(`${API_URL}/api/v1/devices`, { headers: headers(), signal: withTimeout(TIMEOUT_MS), next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function fetchDiagnostics(serial: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/agent/diagnostics/${serial}`, { headers: headers(), signal: withTimeout(TIMEOUT_MS), next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function fetchISPStatus() {
  try {
    const res = await fetch(`${API_URL}/api/v1/isp/status`, { headers: headers(), signal: withTimeout(TIMEOUT_MS), next: { revalidate: 30 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function fetchAlerts(limit = 20) {
  try {
    const res = await fetch(`${API_URL}/api/v1/alerts?limit=${limit}`, { headers: headers(), signal: withTimeout(TIMEOUT_MS), next: { revalidate: 30 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function fetchShieldEvents(last_hours = 24) {
  try {
    const res = await fetch(`${API_URL}/api/v1/shield/events?last_hours=${last_hours}`, { headers: headers(), signal: withTimeout(TIMEOUT_MS), next: { revalidate: 30 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}
