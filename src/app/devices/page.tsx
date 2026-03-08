import { fetchDevices } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { AutoRefresh } from '@/components/auto-refresh';

function RiskBadge({ level }: { level?: string }) {
  if (!level) return <span className="text-slate-600 text-xs">—</span>;
  const l = level.toLowerCase();
  const cls = l === 'critical' ? 'text-red-400 bg-red-500/10 border-red-500/30'
    : l === 'high'     ? 'text-orange-400 bg-orange-500/10 border-orange-500/30'
    : l === 'moderate' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
    : 'text-green-400 bg-green-500/10 border-green-500/30';
  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-medium uppercase ${cls}`}>{level}</span>
  );
}

function DaysAgo({ lastSeen }: { lastSeen?: string }) {
  if (!lastSeen) return <span className="text-slate-600 text-xs">Never</span>;
  const days = Math.floor((Date.now() - new Date(lastSeen).getTime()) / 86400000);
  const cls = days > 30 ? 'text-orange-400' : days > 7 ? 'text-yellow-400' : 'text-slate-400';
  return <span className={`text-xs ${cls}`}>{days === 0 ? 'Today' : `${days}d ago`}</span>;
}

function AppHealthBadge({ grade, crashes, unsigned }: { grade?: string; crashes?: number; unsigned?: number }) {
  if (!grade) return <span className="text-slate-600 text-xs">—</span>;
  const g = grade.toUpperCase();
  const gradeColor = g === 'A' ? 'text-green-400 bg-green-500/10 border-green-500/30'
    : g === 'B' ? 'text-teal-400 bg-teal-500/10 border-teal-500/30'
    : g === 'C' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
    : g === 'D' ? 'text-orange-400 bg-orange-500/10 border-orange-500/30'
    : 'text-red-400 bg-red-500/10 border-red-500/30';
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`text-xs px-1.5 py-0.5 rounded border font-bold w-fit ${gradeColor}`}>{g}</span>
      {(crashes ?? 0) > 0 && <span className="text-xs text-orange-400">{crashes} crash{crashes === 1 ? '' : 'es'}/7d</span>}
      {(unsigned ?? 0) > 0 && <span className="text-xs text-yellow-500">{unsigned} unsigned</span>}
    </div>
  );
}

export default async function DevicesPage() {
  const devices = await fetchDevices();
  const list = Array.isArray(devices) ? devices : [];

  const critical = list.filter((d: any) => d.latest_snapshot?.risk_level?.toLowerCase() === 'critical');
  const high     = list.filter((d: any) => d.latest_snapshot?.risk_level?.toLowerCase() === 'high');

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={300000} />
      <div>
        <h1 className="text-2xl font-bold text-white">Devices</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          {list.length} registered ·
          {critical.length > 0 && <span className="text-red-400"> {critical.length} critical ·</span>}
          {high.length > 0 && <span className="text-orange-400"> {high.length} high risk</span>}
        </p>
      </div>

      {(critical.length > 0 || high.length > 0) && (
        <div className="rounded-md border border-orange-500/40 bg-orange-500/10 px-4 py-3 text-orange-300 text-sm">
          {critical.length + high.length} device(s) require attention. Review findings below.
        </div>
      )}

      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400">
                  <th className="text-left px-4 py-3 font-medium">Device</th>
                  <th className="text-left px-4 py-3 font-medium">Client</th>
                  <th className="text-left px-4 py-3 font-medium">Model</th>
                  <th className="text-left px-4 py-3 font-medium">macOS</th>
                  <th className="text-left px-4 py-3 font-medium">Risk</th>
                  <th className="text-left px-4 py-3 font-medium">Score</th>
                  <th className="text-left px-4 py-3 font-medium">App Health</th>
                  <th className="text-left px-4 py-3 font-medium">Last Scan</th>
                  <th className="text-left px-4 py-3 font-medium">Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-8 text-slate-500 text-center">No devices found</td></tr>
                )}
                {list.map((d: any) => {
                  const snap = d.latest_snapshot;
                  return (
                    <tr key={d.serial || d.id} className="border-b border-slate-700/40 last:border-0 hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/devices/${d.serial || d.id}`} className="text-teal-400 hover:text-teal-300 font-mono">
                          {d.hostname || d.serial || d.id || '—'}
                        </Link>
                        <p className="text-slate-600 text-xs font-mono">{d.serial}</p>
                      </td>
                      <td className="px-4 py-3">
                        {d.client_id ? (
                          <Link href={`/clients/${d.client_id}`} className="text-slate-300 hover:text-white">
                            {d.client_id}
                          </Link>
                        ) : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{d.model || '—'}</td>
                      <td className="px-4 py-3 text-slate-400">{d.macos_version || '—'}</td>
                      <td className="px-4 py-3"><RiskBadge level={snap?.risk_level} /></td>
                      <td className="px-4 py-3 text-slate-300">{snap?.risk_score ?? '—'}</td>
                      <td className="px-4 py-3">
                        <AppHealthBadge
                          grade={snap?.app_intelligence_grade}
                          crashes={snap?.app_crash_count_7d}
                          unsigned={snap?.app_unsigned_count}
                        />
                      </td>
                      <td className="px-4 py-3">
                        {snap?.scan_date
                          ? <span className="text-slate-400">{new Date(snap.scan_date).toLocaleDateString('en-ZA')}</span>
                          : <span className="text-slate-600">No scan</span>}
                      </td>
                      <td className="px-4 py-3"><DaysAgo lastSeen={d.last_seen} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
