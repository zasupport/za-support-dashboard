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
    const res = await fetch(`${API_URL}/api/v1/diagnostics/devices`, { headers: headers(), signal: withTimeout(TIMEOUT_MS), next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function fetchDiagnostics(serial: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/diagnostics/devices/${serial}`, { headers: headers(), signal: withTimeout(TIMEOUT_MS), next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function fetchDeviceSnapshots(serial: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/diagnostics/devices/${serial}/history`, { headers: headers(), signal: withTimeout(TIMEOUT_MS), next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
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

export async function fetchClients(status?: string, page = 1, per_page = 100) {
  try {
    const params = new URLSearchParams({ page: String(page), per_page: String(per_page) });
    if (status) params.set('status', status);
    const res = await fetch(`${API_URL}/api/v1/clients?${params}`, { headers: headers(), signal: withTimeout(TIMEOUT_MS), next: { revalidate: 30 } });
    if (!res.ok) return { data: [], meta: { total: 0 } };
    return res.json();
  } catch { return { data: [], meta: { total: 0 } }; }
}

export async function fetchClient(client_id: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/clients/${client_id}`, { headers: headers(), signal: withTimeout(TIMEOUT_MS), next: { revalidate: 30 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function fetchClientTasks(client_id: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/clients/${client_id}/tasks`, { headers: headers(), signal: withTimeout(TIMEOUT_MS), next: { revalidate: 30 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function fetchClientCheckins(client_id: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/clients/${client_id}/checkins`, { headers: headers(), signal: withTimeout(TIMEOUT_MS), next: { revalidate: 30 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}
