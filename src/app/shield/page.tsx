/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from 'next/link';
import { fetchShieldEvents } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AutoRefresh } from '@/components/auto-refresh';

export const revalidate = 30; // ISR: shield events refresh frequently
import { ShieldJobButton } from './ShieldJobButton';

function severityVariant(s: string): 'destructive' | 'secondary' | 'outline' {
  if (s === 'CRITICAL' || s === 'HIGH') return 'destructive';
  if (s === 'MEDIUM') return 'secondary';
  return 'outline';
}

function severityOrder(s: string) {
  return s === 'CRITICAL' ? 0 : s === 'HIGH' ? 1 : s === 'MEDIUM' ? 2 : 3;
}

export default async function ShieldPage() {
  const events = await fetchShieldEvents(48);
  const list: any[] = Array.isArray(events) ? events : [];

  const sorted = [...list].sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity));

  const critical = list.filter(e => e.severity === 'CRITICAL').length;
  const high     = list.filter(e => e.severity === 'HIGH').length;

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={30000} />

      <div>
        <h1 className="text-2xl font-bold text-white">Shield Events</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Last 48 hours — {list.length} event{list.length !== 1 ? 's' : ''}
          {critical > 0 && <span className="text-red-400 font-semibold"> · {critical} critical</span>}
          {high > 0 && <span className="text-orange-400"> · {high} high</span>}
        </p>
      </div>

      {critical > 0 && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
          <span className="font-semibold">{critical} CRITICAL event{critical !== 1 ? 's' : ''}</span> detected in the last 48 hours — review and consider creating workshop jobs.
        </div>
      )}

      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          {list.length === 0 ? (
            <p className="text-slate-400 text-sm p-4">No shield events recorded in the last 48 hours.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400">
                  <th className="text-left px-4 py-3 font-medium">Event</th>
                  <th className="text-left px-4 py-3 font-medium">Device</th>
                  <th className="text-left px-4 py-3 font-medium">Client</th>
                  <th className="text-left px-4 py-3 font-medium">Time</th>
                  <th className="text-center px-4 py-3 font-medium">Severity</th>
                  <th className="text-right px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((e: any, i: number) => (
                  <tr
                    key={i}
                    className={`border-b border-slate-700/40 last:border-0 hover:bg-slate-700/20 transition-colors ${
                      e.severity === 'CRITICAL' ? 'bg-red-500/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{e.event_type}</p>
                      {e.details && (
                        <p className="text-slate-400 mt-0.5 max-w-xs truncate">{e.details}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {e.serial ? (
                        <Link href={`/devices/${e.serial}`} className="text-teal-400 hover:text-teal-300 font-mono">
                          {e.hostname || e.serial}
                        </Link>
                      ) : (
                        <span className="text-slate-500">{e.hostname || '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {e.client_id ? (
                        <Link href={`/clients/${e.client_id}`} className="text-slate-300 hover:text-white">
                          {e.client_id}
                        </Link>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {e.timestamp ? new Date(e.timestamp).toLocaleString('en-ZA') : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={severityVariant(e.severity)}>{e.severity}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ShieldJobButton
                        serial={e.serial}
                        clientId={e.client_id}
                        eventType={e.event_type}
                        severity={e.severity}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
