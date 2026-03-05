import { fetchDevices, fetchISPStatus, fetchAlerts, fetchShieldEvents } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Monitor, Wifi, Shield, Bell } from 'lucide-react';
import { AutoRefresh } from '@/components/auto-refresh';

export default async function DashboardPage() {
  const [devices, ispStatus, alerts, shieldEvents] = await Promise.allSettled([
    fetchDevices(),
    fetchISPStatus(),
    fetchAlerts(5),
    fetchShieldEvents(24),
  ]);

  const deviceList = devices.status === 'fulfilled' ? devices.value : [];
  const ispList = ispStatus.status === 'fulfilled' ? ispStatus.value : [];
  const alertList = alerts.status === 'fulfilled' ? alerts.value : [];
  const shieldList = shieldEvents.status === 'fulfilled' ? shieldEvents.value : [];

  const outages = Array.isArray(ispList) ? ispList.filter((i: any) => i.status === 'outage' || i.status === 'degraded') : [];
  const criticalShield = Array.isArray(shieldList) ? shieldList.filter((e: any) => e.severity === 'CRITICAL' || e.severity === 'HIGH') : [];

  return (
    <div>
      <AutoRefresh intervalMs={60000} />
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
              <Monitor size={14} /> Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{Array.isArray(deviceList) ? deviceList.length : '—'}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
              <Wifi size={14} /> ISP Outages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${outages.length > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {outages.length}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
              <Shield size={14} /> Shield Events (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${criticalShield.length > 0 ? 'text-orange-400' : 'text-white'}`}>
              {Array.isArray(shieldList) ? shieldList.length : '—'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
              <Bell size={14} /> Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{Array.isArray(alertList) ? alertList.length : '—'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-base">ISP Status</CardTitle>
          </CardHeader>
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

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-base">Recent Shield Events</CardTitle>
          </CardHeader>
          <CardContent>
            {!Array.isArray(shieldList) || shieldList.length === 0 ? (
              <p className="text-slate-400 text-sm">No events in last 24h</p>
            ) : (
              <div className="space-y-2">
                {shieldList.slice(0, 6).map((e: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-slate-300 truncate max-w-[200px]">{e.event_type}</span>
                    <Badge variant={e.severity === 'CRITICAL' ? 'destructive' : 'secondary'} className="text-xs">
                      {e.severity}
                    </Badge>
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
