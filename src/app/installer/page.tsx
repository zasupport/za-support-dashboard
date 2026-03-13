import Link from 'next/link';
import { InstallCommand } from './InstallCommand';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

async function fetchClients() {
  try {
    const res = await fetch(`${API_URL}/api/v1/clients?per_page=100&status=active`, {
      headers: { 'X-API-Key': API_TOKEN },
      cache: 'no-store',
    });
    const j = res.ok ? await res.json() : { data: [] };
    const sla = await fetch(`${API_URL}/api/v1/clients?per_page=100&status=sla`, {
      headers: { 'X-API-Key': API_TOKEN },
      cache: 'no-store',
    });
    const j2 = sla.ok ? await sla.json() : { data: [] };
    return [...(j.data ?? []), ...(j2.data ?? [])];
  } catch { return []; }
}

async function fetchToken() {
  try {
    const res = await fetch(`${API_URL}/api/v1/system/agent-token`, {
      headers: { 'X-API-Key': API_TOKEN },
      cache: 'no-store',
    });
    return res.ok ? (await res.json()).token : null;
  } catch { return null; }
}

export default async function InstallerPage() {
  const [clients, agentToken] = await Promise.all([fetchClients(), fetchToken()]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Scout Installer</h1>
        <p className="text-slate-400 text-sm mt-1">
          Generate a one-line install command for each client. Run with <code className="bg-slate-800 px-1 rounded text-teal-400">sudo bash</code> on the client&apos;s Mac.
        </p>
      </div>

      {!agentToken && (
        <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
          <p className="text-orange-300 text-sm">
            Agent token not available via API. Contact Courtney to get the <code className="font-mono">AGENT_AUTH_TOKEN</code> for the install command.
          </p>
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-white font-semibold">Active &amp; SLA Clients</h2>
          <span className="text-xs text-slate-500">{clients.length} client{clients.length !== 1 ? 's' : ''}</span>
        </div>
        {clients.length === 0 ? (
          <p className="text-slate-500 text-sm p-6">No active or SLA clients found.</p>
        ) : (
          <div className="divide-y divide-slate-700">
            {clients.map((c: any) => (
              <div key={c.client_id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <Link href={`/clients/${c.client_id}`} className="text-white font-medium hover:text-teal-400 transition-colors">
                      {c.first_name} {c.last_name}
                    </Link>
                    <span className="ml-2 text-xs text-slate-500 font-mono">{c.client_id}</span>
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${c.status === 'sla' ? 'bg-teal-900/40 text-teal-300' : 'bg-slate-700 text-slate-400'}`}>
                      {c.status}
                    </span>
                  </div>
                </div>
                {agentToken ? (
                  <InstallCommand clientId={c.client_id} token={agentToken} />
                ) : (
                  <p className="text-slate-600 text-xs font-mono">Token unavailable — see note above</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
        <p className="text-slate-400 text-xs font-semibold mb-2">What this installs:</p>
        <ul className="text-slate-500 text-xs space-y-1">
          <li>• <span className="text-slate-300">ZA Shield Agent</span> — real-time macOS security monitor (LaunchDaemon, auto-updates)</li>
          <li>• <span className="text-slate-300">Health Check Scout v3.5</span> — daily 120-section diagnostic push to Health Check AI</li>
        </ul>
      </div>
    </div>
  );
}
