import { fetchAlerts } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AutoRefresh } from '@/components/auto-refresh';
import Link from 'next/link';
import { AlertActions } from './AlertActions';

const SEVERITY_STYLE: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-300 border-red-500/30',
  high:     'bg-orange-500/20 text-orange-300 border-orange-500/30',
  warning:  'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  info:     'bg-slate-600/40 text-slate-400 border-slate-600',
};

export default async function AlertsPage() {
  const alerts = await fetchAlerts(100);
  const list = Array.isArray(alerts) ? alerts : [];

  const critical = list.filter((a: any) => a.severity === 'critical' || a.risk_level === 'CRITICAL');
  const high     = list.filter((a: any) => a.severity === 'high'     || a.risk_level === 'HIGH');

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={30000} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Alerts</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {list.length} alert{list.length !== 1 ? 's' : ''}
            {critical.length > 0 && <span className="text-red-400"> · {critical.length} critical</span>}
            {high.length > 0     && <span className="text-orange-400"> · {high.length} high</span>}
          </p>
        </div>
      </div>

      {critical.length > 0 && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
          {critical.length} CRITICAL alert{critical.length !== 1 ? 's' : ''} require immediate attention.
        </div>
      )}

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader><CardTitle className="text-white text-sm">{list.length} alerts</CardTitle></CardHeader>
        <CardContent className="p-0">
          {list.length === 0 ? (
            <p className="text-slate-400 text-sm px-6 py-6">No alerts — all clear.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400">
                  <th className="text-left px-4 py-3 font-medium">Alert</th>
                  <th className="text-left px-4 py-3 font-medium">Client</th>
                  <th className="text-left px-4 py-3 font-medium">Device</th>
                  <th className="text-left px-4 py-3 font-medium">Severity</th>
                  <th className="text-left px-4 py-3 font-medium">Time</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((a: any, i: number) => {
                  const serial    = a.serial    || a.device_id || null;
                  const clientId  = a.client_id || null;
                  const severity  = (a.severity || a.risk_level || 'info').toLowerCase();
                  const badgeCls  = SEVERITY_STYLE[severity] ?? SEVERITY_STYLE.info;

                  return (
                    <tr key={i} className="border-b border-slate-700/40 last:border-0 hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-slate-200 font-medium">
                          {a.title || a.message || a.type || 'Alert'}
                        </p>
                        {a.risk_score != null && (
                          <p className="text-slate-500">Risk score: {a.risk_score}</p>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {clientId ? (
                          <Link href={`/clients/${clientId}`} className="text-teal-400 hover:text-teal-300 font-mono">
                            {clientId}
                          </Link>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {serial ? (
                          <Link href={`/devices/${serial}`} className="text-teal-400 hover:text-teal-300 font-mono">
                            {serial}
                          </Link>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded border text-xs font-medium ${badgeCls}`}>
                          {(a.severity || a.risk_level || 'info').toUpperCase()}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-500">
                        {a.scan_date || a.created_at
                          ? new Date(a.scan_date || a.created_at).toLocaleDateString('en-ZA')
                          : '—'}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <AlertActions
                          clientId={clientId}
                          serial={serial}
                          title={a.hostname ? `${a.hostname} — ${a.risk_level || 'Alert'}` : (a.title || 'Alert from diagnostic')}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
