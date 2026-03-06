import Link from 'next/link';
import { fetchISPStatus, fetchClientISPMap, fetchISPOutages } from '@/lib/api';
import { ISPOutageChart } from './ISPOutageChart';
import { ISPTimelineChart } from './ISPTimelineChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AutoRefresh } from '@/components/auto-refresh';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';

function statusVariant(status: string): 'default' | 'destructive' | 'secondary' {
  if (status === 'operational') return 'default';
  if (status === 'outage') return 'destructive';
  return 'secondary';
}

function statusIcon(status: string) {
  if (status === 'operational') return <Wifi size={13} className="text-green-400" />;
  if (status === 'outage') return <WifiOff size={13} className="text-red-400" />;
  return <AlertTriangle size={13} className="text-yellow-400" />;
}

export default async function ISPPage() {
  const [ispList, clientISPs, outages] = await Promise.all([
    fetchISPStatus(),
    fetchClientISPMap(),
    fetchISPOutages(30),
  ]);

  const list: any[] = Array.isArray(ispList) ? ispList : [];
  const outageLog: any[] = Array.isArray(outages) ? outages : [];

  // Build ISP name → [client] lookup (case-insensitive partial match)
  const impactMap: Record<string, { client_id: string; name: string }[]> = {};
  for (const isp of list) {
    const ispName: string = (isp.isp_name || isp.name || '').toLowerCase();
    impactMap[ispName] = clientISPs
      .filter(c => {
        const clientISP = (c.isp || '').toLowerCase();
        return clientISP && (clientISP.includes(ispName) || ispName.includes(clientISP));
      })
      .map(c => ({ client_id: c.client_id, name: `${c.first_name} ${c.last_name}` }));
  }

  const operational = list.filter((i: any) => i.status === 'operational').length;
  const degraded    = list.filter((i: any) => i.status === 'degraded').length;
  const outage      = list.filter((i: any) => i.status === 'outage').length;

  // Clients on ISPs with issues
  const affectedClients = new Set<string>();
  for (const isp of list) {
    if (isp.status !== 'operational') {
      const key = (isp.isp_name || isp.name || '').toLowerCase();
      (impactMap[key] || []).forEach(c => affectedClients.add(c.name));
    }
  }

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={60000} />

      <div>
        <h1 className="text-2xl font-bold text-white">ISP Status</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          {list.length} SA ISPs monitored ·
          <span className="text-green-400"> {operational} operational</span>
          {degraded > 0 && <span className="text-yellow-400"> · {degraded} degraded</span>}
          {outage > 0 && <span className="text-red-400"> · {outage} outage</span>}
        </p>
      </div>

      {/* Affected clients banner */}
      {affectedClients.size > 0 && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
          <span className="font-semibold">Client impact detected — </span>
          {[...affectedClients].join(', ')} may be experiencing connectivity issues.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map((isp: any, i: number) => {
          const ispKey = (isp.isp_name || isp.name || '').toLowerCase();
          const affected = impactMap[ispKey] || [];
          const hasIssue = isp.status !== 'operational';

          return (
            <Card
              key={i}
              className={`bg-slate-800 border-slate-700 ${hasIssue ? 'border-red-500/40' : ''}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {statusIcon(isp.status)}
                    <CardTitle className="text-sm text-white">{isp.isp_name || isp.name}</CardTitle>
                  </div>
                  <Badge variant={statusVariant(isp.status)}>
                    {isp.status || 'unknown'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-4 text-xs text-slate-400">
                  {isp.latency_ms != null && (
                    <span>Latency: <span className={isp.latency_ms > 200 ? 'text-yellow-400' : 'text-slate-300'}>{isp.latency_ms}ms</span></span>
                  )}
                  {isp.packet_loss != null && (
                    <span>Loss: <span className={isp.packet_loss > 5 ? 'text-red-400' : 'text-slate-300'}>{isp.packet_loss}%</span></span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Checked: {isp.last_checked ? new Date(isp.last_checked).toLocaleString('en-ZA') : '—'}
                </p>

                {/* Client impact */}
                {affected.length > 0 && (
                  <div className={`mt-2 pt-2 border-t ${hasIssue ? 'border-red-500/30' : 'border-slate-700/40'}`}>
                    <p className={`text-xs font-medium mb-1 ${hasIssue ? 'text-red-300' : 'text-slate-400'}`}>
                      {hasIssue ? 'Affected clients' : 'Clients on this ISP'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {affected.map(c => (
                        <Link
                          key={c.client_id}
                          href={`/clients/${c.client_id}`}
                          className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                            hasIssue
                              ? 'bg-red-500/10 text-red-300 border-red-500/30 hover:bg-red-500/20'
                              : 'bg-slate-700/60 text-slate-300 border-slate-600 hover:text-white'
                          }`}
                        >
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Outage details */}
                {hasIssue && isp.outage_since && (
                  <p className="text-xs text-red-400">
                    Since: {new Date(isp.outage_since).toLocaleString('en-ZA')}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
        {list.length === 0 && (
          <p className="text-slate-400 text-sm col-span-3">No ISP data available.</p>
        )}
      </div>

      {/* Outage charts */}
      <ISPOutageChart outages={outageLog} />
      <ISPTimelineChart outages={outageLog} />

      {/* Outage history */}
      {outageLog.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-white mb-3">Outage Log (last 30 days)</h2>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-0">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left px-4 py-2 text-slate-400 font-medium">ISP</th>
                    <th className="text-left px-4 py-2 text-slate-400 font-medium">Started</th>
                    <th className="text-left px-4 py-2 text-slate-400 font-medium">Resolved</th>
                    <th className="text-left px-4 py-2 text-slate-400 font-medium">Duration</th>
                    <th className="text-left px-4 py-2 text-slate-400 font-medium">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {outageLog.map((o: any, i: number) => {
                    const start = o.started_at ? new Date(o.started_at) : null;
                    const end   = o.ended_at   ? new Date(o.ended_at)   : null;
                    let duration = '—';
                    if (start && end) {
                      const mins = Math.round((end.getTime() - start.getTime()) / 60000);
                      duration = mins < 60 ? `${mins}m` : `${Math.round(mins / 60)}h ${mins % 60}m`;
                    } else if (start) {
                      duration = 'Ongoing';
                    }
                    return (
                      <tr key={i} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-700/20">
                        <td className="px-4 py-2 text-white">{o.isp_name || `Provider #${o.provider_id}`}</td>
                        <td className="px-4 py-2 text-slate-300">{start ? start.toLocaleString('en-ZA') : '—'}</td>
                        <td className="px-4 py-2 text-slate-300">{end ? end.toLocaleString('en-ZA') : <span className="text-red-400">Active</span>}</td>
                        <td className="px-4 py-2 text-slate-300">{duration}</td>
                        <td className="px-4 py-2">
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            o.severity === 'critical' ? 'bg-red-500/20 text-red-300' :
                            o.severity === 'high'     ? 'bg-orange-500/20 text-orange-300' :
                            'bg-yellow-500/20 text-yellow-300'
                          }`}>{o.severity || 'unknown'}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
