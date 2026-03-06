'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type TrendAlert = {
  serial: string;
  client_id?: string;
  hostname?: string;
  model?: string;
  alert_types: string[];
  battery_drop_pct?: number | null;
  disk_rise_pct?: number | null;
  risk_rise_pts?: number | null;
};

const ALERT_LABEL: Record<string, string> = {
  battery_declining: 'Battery declining',
  disk_filling:      'Disk filling',
  risk_escalating:   'Risk escalating',
};
const ALERT_COLOR: Record<string, string> = {
  battery_declining: 'text-orange-400',
  disk_filling:      'text-yellow-400',
  risk_escalating:   'text-red-400',
};

export function TrendAlerts() {
  const [alerts, setAlerts] = useState<TrendAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/devices/trend-alerts')
      .then(r => r.json())
      .then(d => setAlerts(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || alerts.length === 0) return null;

  return (
    <Card className="bg-slate-800 border-orange-500/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-orange-300 text-sm">Trajectory Alerts — Devices Deteriorating</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.map(a => (
          <div key={a.serial} className="flex items-start justify-between py-1.5 border-b border-slate-700/40 last:border-0">
            <div>
              <div className="flex items-center gap-2">
                <Link href={`/devices/${a.serial}`} className="text-sm text-white hover:text-teal-400 font-medium">
                  {a.hostname || a.serial}
                </Link>
                {a.client_id && (
                  <Link href={`/clients/${a.client_id}`} className="text-xs text-slate-500 hover:text-slate-300">
                    {a.client_id}
                  </Link>
                )}
              </div>
              <div className="flex gap-3 mt-0.5">
                {a.alert_types.map(t => (
                  <span key={t} className={`text-xs ${ALERT_COLOR[t] ?? 'text-slate-400'}`}>
                    {ALERT_LABEL[t] ?? t}
                    {t === 'battery_declining' && a.battery_drop_pct != null && ` −${a.battery_drop_pct}%`}
                    {t === 'disk_filling'      && a.disk_rise_pct   != null && ` +${a.disk_rise_pct}%`}
                    {t === 'risk_escalating'   && a.risk_rise_pts   != null && ` +${a.risk_rise_pts}pts`}
                  </span>
                ))}
              </div>
            </div>
            <Link href={`/devices/${a.serial}`} className="text-xs text-slate-600 hover:text-slate-400 shrink-0">
              View →
            </Link>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
