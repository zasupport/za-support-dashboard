import { WorkshopBoard } from './WorkshopBoard';
import { AutoRefresh } from '@/components/auto-refresh';

async function fetchJobs() {
  const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
  const API_TOKEN = process.env.ZA_API_TOKEN || '';
  try {
    const res = await fetch(`${API_URL}/api/v1/workshop/jobs?per_page=100`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch { return []; }
}

export default async function WorkshopPage() {
  const jobs = await fetchJobs();
  const open    = jobs.filter((j: any) => j.status === 'open').length;
  const inProg  = jobs.filter((j: any) => j.status === 'in_progress').length;
  const urgent  = jobs.filter((j: any) => j.priority === 'urgent' && j.status !== 'completed' && j.status !== 'cancelled').length;
  const auto    = jobs.filter((j: any) => j.source === 'auto_diagnostic').length;

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={60000} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Workshop</h1>
          <p className="text-slate-400 text-sm mt-0.5">Job cards — click status badge to advance</p>
        </div>
        <div className="flex gap-3 text-xs">
          {urgent > 0 && (
            <span className="px-3 py-1 rounded-full border bg-red-500/20 text-red-300 border-red-500/30 font-medium">
              {urgent} URGENT
            </span>
          )}
          <span className="px-3 py-1 rounded-full border bg-slate-700/50 text-slate-300 border-slate-600">
            {open} open · {inProg} in progress
          </span>
          {auto > 0 && (
            <span className="px-3 py-1 rounded-full border bg-purple-500/20 text-purple-300 border-purple-500/30">
              {auto} auto-generated
            </span>
          )}
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-sm">
          No workshop jobs yet. Jobs are auto-created when Scout diagnostics find CRITICAL or HIGH severity issues.
        </div>
      ) : (
        <WorkshopBoard initialJobs={jobs} />
      )}
    </div>
  );
}
