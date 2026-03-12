'use client';

/**
 * LiveAlerts — SWR-based near-real-time alerts widget (10s refresh).
 * Replaces the static server-side alerts section on the dashboard.
 * Drop-in: <LiveAlerts limit={5} />
 */

import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';

type Alert = {
  id?: string;
  severity?: string;
  message?: string;
  device_serial?: string;
  client_name?: string;
  created_at?: string;
};

const fetcher = (url: string) => fetch(url).then(r => r.json());

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

const SEVERITY_VARIANT: Record<string, 'destructive' | 'secondary' | 'default'> = {
  critical: 'destructive',
  high: 'destructive',
  moderate: 'secondary',
  low: 'default',
};

interface LiveAlertsProps {
  limit?: number;
}

export function LiveAlerts({ limit = 5 }: LiveAlertsProps) {
  const { data, isLoading } = useSWR(
    `/api/alerts?limit=${limit}`,
    fetcher,
    {
      refreshInterval: 10000, // 10s near-real-time
      revalidateOnFocus: true,
    }
  );

  const alerts: Alert[] = Array.isArray(data) ? data : (data?.alerts ?? data?.data ?? []);

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Bell size={14} />
          Alerts
          {!isLoading && alerts.length > 0 && (
            <span className="ml-auto text-[10px] text-slate-600 font-normal">live — 10s</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-8 rounded bg-slate-700 animate-pulse" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <p className="text-slate-400 text-sm">No active alerts</p>
        ) : (
          <div className="space-y-2">
            {alerts.slice(0, limit).map((a, i) => (
              <div key={a.id ?? i} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-slate-200 truncate max-w-[190px]">
                    {a.message ?? a.device_serial ?? 'Alert'}
                  </p>
                  {a.client_name && (
                    <p className="text-xs text-slate-500">{a.client_name}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {a.severity && (
                    <Badge variant={SEVERITY_VARIANT[a.severity.toLowerCase()] ?? 'secondary'} className="text-xs">
                      {a.severity}
                    </Badge>
                  )}
                  <span className="text-xs text-slate-600">{timeAgo(a.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
