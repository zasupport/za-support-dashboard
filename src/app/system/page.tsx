import { AutoRefresh } from '@/components/auto-refresh';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';
const h = { Authorization: `Bearer ${API_TOKEN}` };

async function fetchStatus() {
  try {
    const res = await fetch(`${API_URL}/api/v1/system/status`, { headers: h, cache: 'no-store' });
    return res.ok ? res.json() : null;
  } catch { return null; }
}

async function fetchJobs() {
  try {
    const res = await fetch(`${API_URL}/api/v1/system/jobs`, { headers: h, cache: 'no-store' });
    return res.ok ? (await res.json()).jobs ?? [] : [];
  } catch { return []; }
}

async function fetchEvents() {
  try {
    const res = await fetch(`${API_URL}/api/v1/system/events?limit=30&since_hours=24`, { headers: h, cache: 'no-store' });
    return res.ok ? (await res.json()).events ?? [] : [];
  } catch { return []; }
}

function timeAgo(ts?: string) {
  if (!ts) return '—';
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatNext(ts?: string) {
  if (!ts) return '—';
  try { return new Date(ts).toLocaleString('en-ZA', { dateStyle: 'short', timeStyle: 'short' }); }
  catch { return ts; }
}

const SEVERITY_COLOUR: Record<string, string> = {
  critical: 'text-red-400',
  high:     'text-orange-400',
  warning:  'text-yellow-400',
  info:     'text-slate-400',
  low:      'text-slate-500',
};

export default async function SystemPage() {
  const [status, jobs, events] = await Promise.all([fetchStatus(), fetchJobs(), fetchEvents()]);

  const failedJobs = (jobs as any[]).filter(j => j.last_status === 'failed');

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={60000} />
      <div>
        <h1 className="text-2xl font-bold text-white">System Health</h1>
        <p className="text-slate-400 text-sm mt-0.5">Automation scheduler · Scheduled jobs · Event log</p>
      </div>

      {/* Status strip */}
      {status && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Version',       value: status.version,            colour: 'text-teal-400' },
            { label: 'Total Events',  value: String(status.total_events), colour: 'text-slate-300' },
            { label: 'Scheduled Jobs',value: String(status.total_jobs),  colour: 'text-slate-300' },
            { label: 'Failed Jobs',   value: String(status.failed_jobs), colour: status.failed_jobs > 0 ? 'text-red-400' : 'text-green-400' },
            { label: 'Notifications', value: String(status.notifications_sent), colour: 'text-slate-300' },
          ].map(({ label, value, colour }) => (
            <Card key={label} className="bg-slate-800 border-slate-700">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-slate-400 mb-1">{label}</p>
                <p className={`text-xl font-bold ${colour}`}>{value ?? '—'}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 24h event breakdown */}
      {status?.events_24h && Object.keys(status.events_24h).length > 0 && (
        <div className="flex flex-wrap gap-3">
          {Object.entries(status.events_24h as Record<string, number>).map(([sev, count]) => (
            <div key={sev} className="bg-slate-800 border border-slate-700 rounded px-3 py-2 flex items-center gap-2">
              <span className={`text-xs font-medium uppercase ${SEVERITY_COLOUR[sev] || 'text-slate-400'}`}>{sev}</span>
              <span className="text-sm font-bold text-white">{count}</span>
              <span className="text-xs text-slate-500">events (24h)</span>
            </div>
          ))}
        </div>
      )}

      {failedJobs.length > 0 && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
          {failedJobs.length} job(s) failed last run: {failedJobs.map((j: any) => j.name).join(', ')}
        </div>
      )}

      {/* Scheduled jobs */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm">Scheduled Jobs ({(jobs as any[]).length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400">
                  <th className="text-left px-4 py-2 font-medium">Job</th>
                  <th className="text-left px-4 py-2 font-medium">Schedule</th>
                  <th className="text-left px-4 py-2 font-medium">Last Run</th>
                  <th className="text-left px-4 py-2 font-medium">Next Run</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                  <th className="text-right px-4 py-2 font-medium">Count</th>
                </tr>
              </thead>
              <tbody>
                {(jobs as any[]).map((j: any, i: number) => {
                  const failed = j.last_status === 'failed';
                  return (
                    <tr key={j.job_id} className={`border-b border-slate-700/40 last:border-0 ${i % 2 === 0 ? '' : 'bg-slate-800/60'} ${failed ? 'bg-red-500/5' : ''}`}>
                      <td className="px-4 py-2.5">
                        <p className="text-slate-200 font-medium">{j.name}</p>
                        <p className="text-slate-500 font-mono">{j.job_id}</p>
                      </td>
                      <td className="px-4 py-2.5 text-slate-400 font-mono">{j.schedule}</td>
                      <td className="px-4 py-2.5 text-slate-400">{timeAgo(j.last_run)}</td>
                      <td className="px-4 py-2.5 text-slate-400">{formatNext(j.next_run)}</td>
                      <td className="px-4 py-2.5">
                        {j.last_status === 'success' && <span className="text-green-400">ok</span>}
                        {j.last_status === 'failed'  && (
                          <span className="text-red-400" title={j.last_error || ''}>failed</span>
                        )}
                        {!j.last_status && <span className="text-slate-600">pending</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-500">{j.run_count ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent system events */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm">System Events — Last 24h</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(events as any[]).length === 0 ? (
            <p className="text-slate-500 text-sm p-4">No events in the last 24 hours.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="text-left px-4 py-2 font-medium">Time</th>
                    <th className="text-left px-4 py-2 font-medium">Type</th>
                    <th className="text-left px-4 py-2 font-medium">Source</th>
                    <th className="text-left px-4 py-2 font-medium">Severity</th>
                    <th className="text-left px-4 py-2 font-medium">Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {(events as any[]).map((e: any, i: number) => (
                    <tr key={e.id} className={`border-b border-slate-700/40 last:border-0 ${i % 2 === 0 ? '' : 'bg-slate-800/60'}`}>
                      <td className="px-4 py-2 text-slate-500 whitespace-nowrap">{timeAgo(e.created_at)}</td>
                      <td className="px-4 py-2 text-slate-400 font-mono">{e.event_type}</td>
                      <td className="px-4 py-2 text-slate-500">{e.source}</td>
                      <td className="px-4 py-2">
                        <span className={`font-medium uppercase ${SEVERITY_COLOUR[e.severity] || 'text-slate-400'}`}>
                          {e.severity}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-slate-300 max-w-xs truncate">{e.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
