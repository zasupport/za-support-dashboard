const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';
const TIMEOUT_MS = 10000;

const headers = () => ({
  'X-API-Key': API_TOKEN,
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
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function fetchClient(client_id: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/clients/${client_id}`, { headers: headers(), signal: withTimeout(TIMEOUT_MS), cache: 'no-store' });
    if (res.status === 404) return null;          // client genuinely doesn't exist
    if (!res.ok) return { _error: true, status: res.status }; // backend error — not a 404
    return res.json();
  } catch { return { _error: true, status: 503 }; } // network error
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

export async function fetchActivityFeed(limit = 18) {
  try {
    const res = await fetch(`${API_URL}/api/v1/system/activity?limit=${limit}`, { headers: headers(), signal: withTimeout(TIMEOUT_MS), cache: 'no-store' });
    if (!res.ok) return { events: [] };
    return res.json();
  } catch { return { events: [] }; }
}

export async function fetchWorkshopStats() {
  try {
    const res = await fetch(`${API_URL}/api/v1/workshop/jobs?per_page=1`, { headers: headers(), signal: withTimeout(TIMEOUT_MS), next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function fetchClientDevices(client_id: string) {
  try {
    const res = await fetch(
      `${API_URL}/api/v1/diagnostics/devices?client_id=${encodeURIComponent(client_id)}&per_page=50`,
      { headers: headers(), signal: withTimeout(TIMEOUT_MS), cache: 'no-store' }
    );
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function fetchClientJobs(client_id: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/workshop/jobs?client_id=${encodeURIComponent(client_id)}&per_page=20`, {
      headers: headers(), signal: withTimeout(TIMEOUT_MS), cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch { return []; }
}

export async function fetchSnapshot(snapshotId: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/diagnostics/snapshots/${snapshotId}`, {
      headers: headers(), signal: withTimeout(TIMEOUT_MS), cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function fetchClientISPMap(): Promise<{ client_id: string; first_name: string; last_name: string; isp: string | null }[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/clients/isp-map`, {
      headers: headers(), signal: withTimeout(TIMEOUT_MS), next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function fetchISPOutages(days = 30) {
  try {
    const hours = days * 24;
    const res = await fetch(`${API_URL}/api/v1/isp/outages?hours=${hours}`, { headers: headers(), signal: withTimeout(TIMEOUT_MS), next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function fetchCyberShieldSummary() {
  try {
    const res = await fetch(`${API_URL}/api/v1/cybershield/summary`, {
      headers: headers(), signal: withTimeout(TIMEOUT_MS), next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function fetchClientNetwork(client_id: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/unifi/${encodeURIComponent(client_id)}/latest`, {
      headers: headers(), signal: withTimeout(TIMEOUT_MS), cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function fetchClientNetworkHistory(client_id: string, hours = 24) {
  try {
    const res = await fetch(`${API_URL}/api/v1/unifi/${encodeURIComponent(client_id)}/history?hours=${hours}`, {
      headers: headers(), signal: withTimeout(TIMEOUT_MS), next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function fetchOpenWorkshopJobs() {
  try {
    const params = new URLSearchParams({ per_page: '100' });
    // Fetch open + in_progress separately via multiple calls, or just fetch all and filter client-side
    const res = await fetch(`${API_URL}/api/v1/workshop/jobs?per_page=100`, {
      headers: headers(), signal: withTimeout(TIMEOUT_MS), next: { revalidate: 60 },
    });
    if (!res.ok) return { data: [], meta: {} };
    return res.json();
  } catch { return { data: [], meta: {} }; }
}

export async function fetchUpgradeRadar() {
  try {
    const res = await fetch(`${API_URL}/api/v1/lifecycle/radar`, {
      headers: headers(), signal: withTimeout(TIMEOUT_MS), next: { revalidate: 300 },
    });
    if (!res.ok) return { data: [], meta: { total: 0, critical: 0, overdue: 0, soon: 0 } };
    return res.json();
  } catch { return { data: [], meta: { total: 0, critical: 0, overdue: 0, soon: 0 } }; }
}

export async function fetchCheckinStatus() {
  try {
    const res = await fetch(`${API_URL}/api/v1/checkin/status`, {
      headers: headers(), signal: withTimeout(TIMEOUT_MS), next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data ?? json ?? [];
  } catch { return []; }
}

export async function fetchFleetInterventionSummary(days = 30) {
  try {
    const res = await fetch(`${API_URL}/api/v1/reports/interventions/fleet/recent?days=${days}&limit=5`, {
      headers: headers(), signal: withTimeout(TIMEOUT_MS), next: { revalidate: 300 },
    });
    if (!res.ok) return { count: 0, total_value_protected: 0, interventions: [] };
    return res.json();
  } catch { return { count: 0, total_value_protected: 0, interventions: [] }; }
}

export async function fetchDedupFleetSummary() {
  try {
    const res = await fetch(`${API_URL}/api/v1/dedup/fleet/summary`, {
      headers: headers(), signal: withTimeout(TIMEOUT_MS), next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}
