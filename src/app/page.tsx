import { fetchDevices, fetchISPStatus, fetchAlerts, fetchShieldEvents, fetchClients, fetchActivityFeed } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Monitor, Wifi, Shield, Bell, Users, Wrench, Activity } from 'lucide-react';
import { AutoRefresh } from '@/components/auto-refresh';
import Link from 'next/link';

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

const SEVERITY_COLOR: Record<string, string> = {
  critical: 'text-red-400',
  high:     'text-orange-400',
  moderate: 'text-yellow-400',
  low:      'text-green-400',
};

export default async function DashboardPage() {
  const [devices, ispStatus, alerts, shieldEvents, clients, activity] = await Promise.allSettled([
    fetchDevices(),
    fetchISPStatus(),
    fetchAlerts(5),
    fetchShieldEvents(24),
    fetchClients(undefined, 1, 1),
    fetchActivityFeed(18),
  ]);

  const deviceList  = devices.status  === 'fulfilled' ? devices.value  : [];
  const ispList     = ispStatus.status === 'fulfilled' ? ispStatus.value : [];
  const alertList   = alerts.status   === 'fulfilled' ? alerts.value   : [];
  const shieldList  = shieldEvents.status === 'fulfilled' ? shieldEvents.value : [];
  const clientMeta  = clients.status  === 'fulfilled' ? clients.value?.meta  : null;
  const activityData = activity.status === 'fulfilled' ? activity.value?.events ?? [] : [];

  const outages      = Array.isArray(ispList)    ? ispList.filter((i: any) => i.status === 'outage' || i.status === 'degraded') : [];
  const criticalShield = Array.isArray(shieldList) ? shieldList.filter((e: any) => e.severity === 'CRITICAL' || e.severity === 'HIGH') : [];

  return (
    <div>
      <AutoRefresh intervalMs={60000} />
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-400 flex items-center gap-2"><Users size={13} /> Clients</CardTitle></CardHeader>
          <CardContent>
            <Link href="/clients" className="text-3xl font-bold text-white hover:text-teal-400 transition-colors">
              {clientMeta?.total ?? '—'}
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-400 flex items-center gap-2"><Monitor size={13} /> Devices</CardTitle></CardHeader>
          <CardContent>
            <Link href="/devices" className="text-3xl font-bold text-white hover:text-teal-400 transition-colors">
              {Array.isArray(deviceList) ? deviceList.length : '—'}
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-400 flex items-center gap-2"><Wifi size={13} /> ISP Outages</CardTitle></CardHeader>
          <CardContent>
            <Link href="/isp" className={`text-3xl font-bold ${outages.length > 0 ? 'text-red-400' : 'text-green-400'} hover:opacity-80 transition-opacity`}>
              {outages.length}
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-400 flex items-center gap-2"><Shield size={13} /> Shield (24h)</CardTitle></CardHeader>
          <CardContent>
            <Link href="/shield" className={`text-3xl font-bold ${criticalShield.length > 0 ? 'text-orange-400' : 'text-white'} hover:opacity-80 transition-opacity`}>
              {Array.isArray(shieldList) ? shieldList.length : '—'}
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-400 flex items-center gap-2"><Bell size={13} /> Alerts</CardTitle></CardHeader>
          <CardContent>
            <Link href="/alerts" className="text-3xl font-bold text-white hover:text-teal-400 transition-colors">
              {Array.isArray(alertList) ? alertList.length : '—'}
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-400 flex items-center gap-2"><Activity size={13} /> Morning</CardTitle></CardHeader>
          <CardContent>
            <Link href="/morning" className="text-sm font-semibold text-teal-400 hover:text-teal-300 transition-colors">
              View Brief →
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ISP Status */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-sm flex items-center gap-2"><Wifi size={14} /> ISP Status</CardTitle></CardHeader>
          <CardContent>
            {!Array.isArray(ispList) || ispList.length === 0 ? (
              <p className="text-slate-400 text-sm">No ISP data</p>
            ) : (
              <div className="space-y-2">
                {ispList.slice(0, 8).map((isp: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">{isp.isp_name || isp.name}</span>
                    <Badge variant={isp.status === 'operational' ? 'default' : 'destructive'} className="text-xs">
                      {isp.status || 'unknown'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Shield Events */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-sm flex items-center gap-2"><Shield size={14} /> Shield Events (24h)</CardTitle></CardHeader>
          <CardContent>
            {!Array.isArray(shieldList) || shieldList.length === 0 ? (
              <p className="text-slate-400 text-sm">No events in last 24h</p>
            ) : (
              <div className="space-y-2">
                {shieldList.slice(0, 6).map((e: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-slate-300 truncate max-w-[160px]">{e.event_type}</span>
                    <Badge variant={e.severity === 'CRITICAL' ? 'destructive' : 'secondary'} className="text-xs">
                      {e.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-sm flex items-center gap-2"><Activity size={14} /> Recent Activity</CardTitle></CardHeader>
          <CardContent>
            {activityData.length === 0 ? (
              <p className="text-slate-400 text-sm">No recent activity</p>
            ) : (
              <div className="space-y-2">
                {activityData.slice(0, 10).map((e: any, i: number) => (
                  <div key={i} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {e.href ? (
                        <Link href={e.href} className="text-xs text-slate-200 hover:text-white truncate block max-w-[190px]">
                          {e.label}
                        </Link>
                      ) : (
                        <p className="text-xs text-slate-200 truncate max-w-[190px]">{e.label}</p>
                      )}
                      {e.sub && (
                        <p className={`text-xs ${SEVERITY_COLOR[e.severity || ''] || 'text-slate-500'}`}>{e.sub}</p>
                      )}
                    </div>
                    <span className="text-xs text-slate-600 shrink-0">{timeAgo(e.ts)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
