import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { AutoRefresh } from '@/components/auto-refresh';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

async function fetchMorning() {
  const res = await fetch(`${API_URL}/api/v1/clients/morning/overview`, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json();
}

function RiskBadge({ level, score }: { level?: string; score?: number }) {
  if (!level) return <span className="text-slate-600 text-xs">No scan</span>;
  const l = level.toLowerCase();
  const cls = l === 'critical' ? 'text-red-400'
    : l === 'high' ? 'text-orange-400'
    : l === 'moderate' ? 'text-yellow-400'
    : 'text-green-400';
  return <span className={`text-xs font-semibold ${cls}`}>{level}{score != null ? ` (${score})` : ''}</span>;
}

function DaysBadge({ days }: { days?: number | null }) {
  if (days == null) return <span className="text-slate-600 text-xs">Never</span>;
  const cls = days > 60 ? 'text-red-400' : days > 30 ? 'text-orange-400' : 'text-slate-400';
  return <span className={`text-xs ${cls}`}>{days}d ago</span>;
}

function GradeBadge({ riskScore, riskLevel, daysSinceScan }: {
  riskScore?: number | null;
  riskLevel?: string | null;
  daysSinceScan?: number | null;
}) {
  if (riskScore == null && !riskLevel) return <span className="text-slate-600 text-xs">—</span>;
  const score = riskScore ?? 0;
  const days = daysSinceScan ?? 0;
  const riskPts = Math.max(0, 40 - score * 4);
  const scanPts = days <= 30 ? 20 : days <= 60 ? 10 : 0;
  const total = riskPts + scanPts; // simplified (no backup/task pts)
  const grade = total >= 48 ? 'A' : total >= 40 ? 'B' : total >= 28 ? 'C' : total >= 16 ? 'D' : 'F';
  const cls = grade === 'A' ? 'text-green-400' : grade === 'B' ? 'text-teal-400'
    : grade === 'C' ? 'text-yellow-400' : grade === 'D' ? 'text-orange-400' : 'text-red-400';
  return <span className={`text-xs font-bold ${cls}`}>{grade}</span>;
}

export default async function MorningPage() {
  const clients = await fetchMorning();
  const urgent = clients.filter((c: any) => c.urgency_level?.toLowerCase().startsWith('urgent'));
  const overdue = clients.filter((c: any) => (c.days_since_scan ?? 999) > 30);

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={300000} />
      <div>
        <h1 className="text-2xl font-bold text-white">Morning Brief</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          {clients.length} active client{clients.length !== 1 ? 's' : ''} ·
          {urgent.length > 0 && <span className="text-red-400"> {urgent.length} urgent ·</span>}
          {overdue.length > 0 && <span className="text-orange-400"> {overdue.length} overdue for scan</span>}
        </p>
      </div>

      {/* Urgent banner */}
      {urgent.length > 0 && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
          URGENT clients: {urgent.map((c: any) => `${c.first_name} ${c.last_name}`).join(', ')} — action today.
        </div>
      )}

      {/* Client table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="text-left px-4 py-3 font-medium">Client</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Risk</th>
                <th className="text-center px-4 py-3 font-medium">Grade</th>
                <th className="text-left px-4 py-3 font-medium">Last Scan</th>
                <th className="text-center px-4 py-3 font-medium">Devices</th>
                <th className="text-center px-4 py-3 font-medium">Open Tasks</th>
                <th className="text-center px-4 py-3 font-medium">Jobs</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c: any) => {
                const isUrgent = c.urgency_level?.toLowerCase().startsWith('urgent');
                const isOverdue = (c.days_since_scan ?? 999) > 30;
                return (
                  <tr
                    key={c.client_id}
                    className={`border-b border-slate-700/40 last:border-0 hover:bg-slate-700/30 transition-colors ${isUrgent ? 'bg-red-500/5' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <Link href={`/clients/${c.client_id}`} className="text-white hover:text-teal-400 font-medium">
                        {c.first_name} {c.last_name}
                      </Link>
                      {isUrgent && <span className="ml-2 text-red-400 font-bold">URGENT</span>}
                      {c.has_business && <span className="ml-1 text-purple-400">Biz</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`capitalize ${c.status === 'new' ? 'text-blue-400' : c.status === 'sla' ? 'text-purple-400' : 'text-green-400'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <RiskBadge level={c.risk_level} score={c.risk_score} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <GradeBadge riskScore={c.risk_score} riskLevel={c.risk_level} daysSinceScan={c.days_since_scan} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={isOverdue ? 'text-orange-400' : 'text-slate-400'}>
                        {c.last_scan_date ? new Date(c.last_scan_date).toLocaleDateString('en-ZA') : '—'}
                      </span>
                      {' '}
                      <DaysBadge days={c.days_since_scan} />
                    </td>
                    <td className="px-4 py-3 text-center text-slate-300">{c.device_count ?? 0}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={c.open_tasks > 0 ? 'text-yellow-400' : 'text-slate-600'}>{c.open_tasks ?? 0}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={c.open_jobs > 0 ? 'text-blue-400' : 'text-slate-600'}>{c.open_jobs ?? 0}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <Link
                          href={`/clients/${c.client_id}/brief`}
                          className="text-teal-400 hover:text-teal-300"
                        >
                          Brief
                        </Link>
                        <a
                          href={`/api/reports/${c.client_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-white"
                        >
                          PDF
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {clients.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-8">No active clients.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
