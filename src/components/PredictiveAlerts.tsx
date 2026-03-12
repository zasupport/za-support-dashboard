'use client';

import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

type Prediction = {
  component: string;
  days_until_failure: number;
  confidence_pct: number;
  recommended_action: string;
  client_name?: string;
  client_id?: string;
  device_serial?: string;
};

type PredictionsResponse = {
  predictions: Prediction[];
  client_id?: string;
};

const fetcher = (url: string) => fetch(url).then(r => r.json());

function urgencyColour(days: number): string {
  if (days < 14) return 'border-red-500/40 bg-red-950/20';
  if (days < 30) return 'border-orange-500/40 bg-orange-950/20';
  return 'border-yellow-500/40 bg-yellow-950/20';
}

function badgeColour(days: number): string {
  if (days < 14) return 'bg-red-500/20 text-red-300 border-red-500/30';
  if (days < 30) return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
  return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
}

function daysLabel(days: number): string {
  if (days < 1) return 'Imminent';
  if (days === 1) return '1 day';
  return `${days} days`;
}

interface PredictiveAlertsProps {
  /** If provided, fetches predictions for a single client. If omitted, fetches fleet-wide. */
  clientId?: string;
  /** Max predictions to display. Default 6. */
  limit?: number;
}

export function PredictiveAlerts({ clientId, limit = 6 }: PredictiveAlertsProps) {
  const url = clientId
    ? `/api/predictions/${clientId}`
    : '/api/predictions/fleet';

  const { data, error, isLoading } = useSWR<PredictionsResponse>(url, fetcher, {
    refreshInterval: 300000, // 5 minutes
    revalidateOnFocus: true,
  });

  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs text-slate-400 flex items-center gap-2">
            <AlertTriangle size={13} className="text-orange-400" />
            Predictive Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 rounded bg-slate-700 animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs text-slate-400 flex items-center gap-2">
            <AlertTriangle size={13} className="text-orange-400" />
            Predictive Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 text-xs">No prediction data available</p>
        </CardContent>
      </Card>
    );
  }

  const predictions = (data.predictions ?? []).slice(0, limit);

  if (predictions.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs text-slate-400 flex items-center gap-2">
            <AlertTriangle size={13} className="text-green-400" />
            Predictive Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-400 text-xs">No failure predictions — fleet healthy</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs text-slate-400 flex items-center gap-2">
          <AlertTriangle size={13} className="text-orange-400" />
          Predictive Alerts
          <span className="ml-auto text-slate-600 font-normal">auto-updates 5 min</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {predictions.map((p, i) => (
            <div
              key={i}
              className={`rounded border p-2 ${urgencyColour(p.days_until_failure)}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-200 truncate">
                    {p.component}
                    {p.client_name && (
                      <span className="text-slate-400 font-normal"> — {p.client_name}</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {p.recommended_action}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge className={`text-[10px] px-1.5 py-0 border ${badgeColour(p.days_until_failure)}`}>
                    {daysLabel(p.days_until_failure)}
                  </Badge>
                  <span className="text-[10px] text-slate-500">{p.confidence_pct}% conf.</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
