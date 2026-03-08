import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { AutoRefresh } from '@/components/auto-refresh';
import { fetchCyberShieldSummary, fetchUpgradeRadar } from '@/lib/api';
import { TrendAlerts } from './TrendAlerts';
import { FleetInterventionsFeed } from '@/components/FleetInterventionsFeed';

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
  const [clients, shield, radar] = await Promise.all([fetchMorning(), fetchCyberShieldSummary(), fetchUpgradeRadar()]);
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

      {/* CyberShield status strip */}
      {shield && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 rounded-md bg-slate-800 border border-slate-700 text-xs text-slate-300">
          <span className="text-teal-400 font-semibold">CyberShield</span>
          <span><span className="text-white font-bold">{shield.active_subscriptions ?? 0}</span> active practices</span>
          <span><span className="text-green-400 font-bold">R {Number(shield.monthly_arr ?? 0).toLocaleString()}</span>/month ARR</span>
          <span><span className="text-slate-400">{shield.reports_generated ?? 0}</span> reports generated</span>
          <Link href="/cybershield" className="ml-auto text-teal-400 hover:text-teal-300">Manage →</Link>
        </div>
      )}

      {/* Trajectory alerts */}
      <TrendAlerts />

      {/* Upgrade Radar — devices needing replacement today */}
      {radar && ((radar.meta?.critical ?? 0) + (radar.meta?.overdue ?? 0)) > 0 && (
        <Card className="bg-slate-800 border-orange-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-orange-300 font-semibold text-sm">
                  Device Replacement Alerts — {(radar.meta?.critical ?? 0) + (radar.meta?.overdue ?? 0)} device{((radar.meta?.critical ?? 0) + (radar.meta?.overdue ?? 0)) !== 1 ? 's' : ''} need attention
                </p>
                <p className="text-orange-200/60 text-xs mt-0.5">
                  {radar.meta?.critical ?? 0} critical · {radar.meta?.overdue ?? 0} overdue · {radar.meta?.soon ?? 0} soon
                </p>
              </div>
              <Link href="/upgrade-radar" className="text-xs text-orange-400 hover:text-orange-300 shrink-0">
                Full radar →
              </Link>
            </div>
            <div className="space-y-1.5">
              {(radar.data ?? []).filter((d: any) => d.replacement_urgency === 'critical' || d.replacement_urgency === 'overdue').slice(0, 5).map((d: any) => (
                <div key={d.id} className="flex items-center justify-between gap-3 text-xs py-1.5 border-b border-slate-700/50 last:border-0">
                  <div className="min-w-0 flex-1">
                    <span className={`font-medium ${d.replacement_urgency === 'critical' ? 'text-red-300' : 'text-orange-300'}`}>
                      [{d.replacement_urgency.toUpperCase()}]
                    </span>
                    {' '}
                    <span className="text-slate-300">{d.display_name}</span>
                    {' — '}
                    <Link href={`/clients/${d.client_id}`} className="text-teal-400 hover:text-teal-300">{d.client_name}</Link>
                    {d.age_years != null && <span className="text-slate-500"> · {d.age_years.toFixed(1)}y old</span>}
                  </div>
                  <Link href="/upgrade-radar" className="shrink-0 text-orange-400 hover:text-orange-300 underline">
                    Pitch →
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="text-left px-4 py-3 font-medium">Client</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Risk</th>
                <th className="text-center px-4 py-3 font-medium">Grade</th>
                <th className="text-center px-4 py-3 font-medium">App</th>
                <th className="text-left px-4 py-3 font-medium">Last Scan</th>
                <th className="text-center px-4 py-3 font-medium">Devices</th>
                <th className="text-center px-4 py-3 font-medium">Open Tasks</th>
                <th className="text-center px-4 py-3 font-medium">Jobs</th>
                <th className="text-center px-4 py-3 font-medium">Upgrade</th>
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
                      {c.roi_ratio != null && c.roi_ratio > 0 && (
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500/15 text-green-400 border border-green-500/25">
                          {Number(c.roi_ratio).toFixed(1)}:1
                        </span>
                      )}
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
                    <td className="px-4 py-3 text-center">
                      {c.worst_app_grade ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={`text-xs font-bold ${
                            c.worst_app_grade === 'A' ? 'text-green-400' :
                            c.worst_app_grade === 'B' ? 'text-teal-400' :
                            c.worst_app_grade === 'C' ? 'text-yellow-400' :
                            c.worst_app_grade === 'D' ? 'text-orange-400' : 'text-red-400'
                          }`}>{c.worst_app_grade}</span>
                          {(c.fleet_crashes_7d ?? 0) > 0 && (
                            <span className="text-[10px] text-orange-400">{c.fleet_crashes_7d}cr</span>
                          )}
                        </div>
                      ) : <span className="text-slate-600 text-xs">—</span>}
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
                    <td className="px-4 py-3 text-center">
                      {(c.critical_lifecycle_count ?? 0) > 0 ? (
                        <Link href="/upgrade-radar" className="text-orange-400 hover:text-orange-300 font-semibold">
                          {c.critical_lifecycle_count}
                        </Link>
                      ) : (
                        <span className="text-slate-700">—</span>
                      )}
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
          </div>
        </CardContent>
      </Card>

      {/* Fleet automated interventions — what the system did across all clients */}
      <FleetInterventionsFeed />
    </div>
  );
}
