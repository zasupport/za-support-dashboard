import { WorkshopBoard } from './WorkshopBoard';
import { WorkshopNewJob } from './WorkshopNewJob';
import { AutoRefresh } from '@/components/auto-refresh';

export const revalidate = 60; // ISR: revalidate every 60 seconds

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';
const H = { Authorization: `Bearer ${API_TOKEN}` };

async function fetchRevenue() {
  try {
    const res = await fetch(`${API_URL}/api/v1/workshop/revenue`, { headers: H, cache: 'no-store' });
    return res.ok ? res.json() : null;
  } catch { return null; }
}

async function fetchJobs() {
  try {
    const res = await fetch(`${API_URL}/api/v1/workshop/jobs?per_page=100`, {
      headers: H,
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch { return []; }
}

async function fetchClients() {
  try {
    const res = await fetch(`${API_URL}/api/v1/clients?per_page=100`, {
      headers: H,
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch { return []; }
}

export default async function WorkshopPage() {
  const [jobs, clients, revenue] = await Promise.all([fetchJobs(), fetchClients(), fetchRevenue()]);

  // Build client_id → name lookup
  const clientNames: Record<string, string> = {};
  for (const c of clients) {
    clientNames[c.client_id] = `${c.first_name} ${c.last_name}`;
  }

  const open   = jobs.filter((j: any) => j.status === 'open').length;
  const inProg = jobs.filter((j: any) => j.status === 'in_progress').length;
  const urgent = jobs.filter((j: any) => j.priority === 'urgent' && !['completed','cancelled','done'].includes(j.status)).length;
  const auto   = jobs.filter((j: any) => j.source === 'auto_diagnostic').length;

  const fmtR = (v: number) => `R ${v.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}`;
  const labourHours = revenue ? Math.round((revenue.total_labour_minutes ?? 0) / 60) : 0;

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={60000} />

      {/* Revenue strip */}
      {revenue && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Revenue This Month', value: fmtR(revenue.revenue_this_month), colour: 'text-green-400' },
            { label: 'Total Billed (All Time)', value: fmtR(revenue.total_revenue), colour: 'text-teal-400' },
            { label: 'Pipeline Value', value: fmtR(revenue.pipeline_value), colour: 'text-yellow-400' },
            { label: 'Labour Logged', value: `${labourHours}h`, colour: 'text-slate-300' },
          ].map(({ label, value, colour }) => (
            <div key={label} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <p className="text-xs text-slate-400 mb-1">{label}</p>
              <p className={`text-xl font-bold ${colour}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Workshop</h1>
          <p className="text-slate-400 text-sm mt-0.5">Click status badge to advance · Click job ref for detail</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {urgent > 0 && (
            <span className="text-xs px-3 py-1 rounded-full border bg-red-500/20 text-red-300 border-red-500/30 font-medium">
              {urgent} URGENT
            </span>
          )}
          <span className="text-xs px-3 py-1 rounded-full border bg-slate-700/50 text-slate-300 border-slate-600">
            {open} open · {inProg} in progress
          </span>
          {auto > 0 && (
            <span className="text-xs px-3 py-1 rounded-full border bg-purple-500/20 text-purple-300 border-purple-500/30">
              {auto} auto
            </span>
          )}
          <WorkshopNewJob clients={clients} />
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-sm">
          No workshop jobs yet. Jobs are auto-created when Scout diagnostics find CRITICAL or HIGH severity issues.
        </div>
      ) : (
        <WorkshopBoard initialJobs={jobs} clientNames={clientNames} />
      )}
    </div>
  );
}
