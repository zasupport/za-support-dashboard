/* eslint-disable @typescript-eslint/no-explicit-any */
import { fetchDevices, fetchISPStatus, fetchAlerts, fetchShieldEvents, fetchClients, fetchActivityFeed, fetchOpenWorkshopJobs, fetchCyberShieldSummary, fetchUpgradeRadar, fetchFleetInterventionSummary, fetchDedupFleetSummary } from '@/lib/api';

export const revalidate = 60; // ISR: revalidate every 60 seconds
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Monitor, Wifi, Shield, Bell, Users, Wrench, Activity, Coffee, ShieldCheck, Radar, Zap } from 'lucide-react';
import { AutoRefresh } from '@/components/auto-refresh';
import { FleetAppHealthCard } from '@/components/FleetAppHealthCard';
import { PredictiveAlerts } from '@/components/PredictiveAlerts';
import { ISPStatusPanel } from '@/components/ISPStatusPanel';
import { DedupSummaryPanel } from '@/components/DedupSummaryPanel';
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
  const [devices, ispStatus, alerts, shieldEvents, clients, activity, workshopData, cyberShield, radar, fleetActions, dedupSummary] = await Promise.allSettled([
    fetchDevices(),
    fetchISPStatus(),
    fetchAlerts(5),
    fetchShieldEvents(24),
    fetchClients(undefined, 1, 1),
    fetchActivityFeed(18),
    fetchOpenWorkshopJobs(),
    fetchCyberShieldSummary(),
    fetchUpgradeRadar(),
    fetchFleetInterventionSummary(30),
    fetchDedupFleetSummary(),
  ]);

  const deviceList  = devices.status  === 'fulfilled' ? devices.value  : [];
  const ispList     = ispStatus.status === 'fulfilled' ? ispStatus.value : [];
  const alertList   = alerts.status   === 'fulfilled' ? alerts.value   : [];
  const shieldList  = shieldEvents.status === 'fulfilled' ? shieldEvents.value : [];
  const clientMeta  = clients.status  === 'fulfilled' && clients.value ? clients.value.meta : null;
  const activityData = activity.status === 'fulfilled' ? activity.value?.events ?? [] : [];

  const workshopAll    = workshopData.status === 'fulfilled' ? (workshopData.value?.data ?? []) : [];
  const cyberShieldData = cyberShield.status === 'fulfilled' ? cyberShield.value : null;
  const radarData      = radar.status === 'fulfilled' ? radar.value : null;
  const fleetActData   = fleetActions.status === 'fulfilled' ? fleetActions.value : null;
  const dedupData      = dedupSummary.status === 'fulfilled' ? dedupSummary.value : null;
  const outages        = Array.isArray(ispList)    ? ispList.filter((i: any) => i.status === 'outage' || i.status === 'degraded') : [];
  const criticalShield = Array.isArray(shieldList) ? shieldList.filter((e: any) => e.severity === 'CRITICAL' || e.severity === 'HIGH') : [];
  const openJobs       = workshopAll.filter((j: any) => !['done', 'completed', 'cancelled'].includes(j.status));
  const urgentJobs     = openJobs.filter((j: any) => j.priority === 'urgent');
  const urgentDevices  = (radarData?.meta?.critical ?? 0) + (radarData?.meta?.overdue ?? 0);
  const fleetValueRand = fleetActData?.total_value_protected ?? 0;

  return (
    <div>
      <AutoRefresh intervalMs={60000} />
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-4 mb-8">
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
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-400 flex items-center gap-2"><Wrench size={13} /> Workshop</CardTitle></CardHeader>
          <CardContent>
            <Link href="/workshop" className={`text-3xl font-bold hover:opacity-80 transition-opacity ${urgentJobs.length > 0 ? 'text-red-400' : openJobs.length > 0 ? 'text-yellow-400' : 'text-white'}`}>
              {openJobs.length}
            </Link>
            {urgentJobs.length > 0 && (
              <p className="text-xs text-red-400 mt-0.5">{urgentJobs.length} urgent</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-400 flex items-center gap-2"><Coffee size={13} /> Morning</CardTitle></CardHeader>
          <CardContent>
            <Link href="/morning" className="text-sm font-semibold text-teal-400 hover:text-teal-300 transition-colors">
              View Brief →
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-400 flex items-center gap-2"><ShieldCheck size={13} /> CyberShield</CardTitle></CardHeader>
          <CardContent>
            <Link href="/cybershield" className="text-3xl font-bold text-teal-400 hover:text-teal-300 transition-colors">
              {cyberShieldData?.active_subscriptions ?? '—'}
            </Link>
            <p className="text-xs text-slate-500 mt-0.5">
              {cyberShieldData?.monthly_arr ? `R ${Number(cyberShieldData.monthly_arr).toLocaleString()}/mo` : 'practices'}
            </p>
          </CardContent>
        </Card>

        <Card className={`border-slate-700 ${urgentDevices > 0 ? 'bg-orange-950/40' : 'bg-slate-800'}`}>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-400 flex items-center gap-2"><Radar size={13} /> Upgrade</CardTitle></CardHeader>
          <CardContent>
            <Link href="/upgrade-radar" className={`text-3xl font-bold hover:opacity-80 transition-opacity ${urgentDevices > 0 ? 'text-orange-400' : 'text-white'}`}>
              {radarData ? urgentDevices : '—'}
            </Link>
            {radarData && radarData.meta.critical > 0 && (
              <p className="text-xs text-red-400 mt-0.5">{radarData.meta.critical} critical</p>
            )}
            {radarData && radarData.meta.soon > 0 && urgentDevices === 0 && (
              <p className="text-xs text-yellow-400 mt-0.5">{radarData.meta.soon} soon</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-400 flex items-center gap-2"><Zap size={13} /> ROI (30d)</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-400 leading-tight">
              {fleetValueRand >= 1000
                ? `R ${(fleetValueRand / 1000).toFixed(0)}k`
                : fleetActData
                  ? `R ${Math.round(fleetValueRand).toLocaleString()}`
                  : '—'}
            </p>
            {fleetActData && (
              <p className="text-xs text-slate-500 mt-0.5">{fleetActData.count ?? 0} actions</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fleet App Health — Phase 23 */}
        <FleetAppHealthCard />

        {/* Predictive Alerts — failure predictions fleet-wide */}
        <PredictiveAlerts limit={6} />

        {/* ISP Status */}
        <ISPStatusPanel ispList={ispList} maxRows={10} />

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

        {/* Deduplication — Recoverable Storage */}
        <DedupSummaryPanel summary={dedupData} />
      </div>
    </div>
  );
}
