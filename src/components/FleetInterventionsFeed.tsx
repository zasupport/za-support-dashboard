'use client';

import { useState, useEffect } from 'react';

type FleetItem = {
  action_type:     string;
  description:     string;
  outcome:         string;
  value_protected: number | null;
  device_serial:   string | null;
  created_at:      string;
  client_id:       string;
  client_name:     string;
};

const ACTION_LABELS: Record<string, string> = {
  patch_alert:                  'Patch alert',
  backup_alert:                 'Backup failure',
  report_generated:             'Report generated',
  risk_scored:                  'Risk scored',
  breach_scan:                  'Breach scan',
  security_posture_check:       'Security posture',
  stale_device_detected:        'Stale scan',
  checkin_triggered:            'Check-in triggered',
  investec_scan:                'Investec scan',
  unifi_poll:                   'UniFi poll',
  research_scrape:              'Research digest',
  weekly_digest:                'Weekly digest',
  workshop_job_created:         'Job created',
  cybershield_report:           'CyberShield event',
  isp_outage_alert:             'ISP outage alert',
  workshop_status_notification: 'Job status update',
};

const OUTCOME_DOT: Record<string, string> = {
  success: 'bg-teal-400',
  failed:  'bg-red-400',
  skipped: 'bg-slate-500',
  pending: 'bg-amber-400',
};

function formatValue(v: number | null) {
  if (!v) return null;
  if (v >= 1_000_000) return `R ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `R ${(v / 1_000).toFixed(0)}k`;
  return `R ${v.toFixed(0)}`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
}

export function FleetInterventionsFeed() {
  const [data, setData]       = useState<{ interventions: FleetItem[]; total_value_protected: number; count: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays]       = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/interventions/fleet?days=${days}&limit=60`)
      .then(r => r.json())
      .then(json => setData(json))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  const totalValue = data?.total_value_protected ?? 0;

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">What We Did — Fleet</p>
          {data && (
            <p className="text-white text-sm font-semibold leading-tight mt-0.5">
              {data.count} automated action{data.count !== 1 ? 's' : ''}
              {totalValue > 0 && (
                <span className="text-teal-300 ml-1.5">· {formatValue(totalValue)} value</span>
              )}
            </p>
          )}
        </div>
        <select
          value={days}
          onChange={e => setDays(Number(e.target.value))}
          className="bg-slate-700 border border-slate-600 text-slate-300 text-xs rounded px-2 py-1"
        >
          <option value={1}>Today</option>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      {loading && (
        <p className="text-slate-500 text-xs py-4 text-center">Loading fleet activity…</p>
      )}

      {!loading && data?.count === 0 && (
        <p className="text-slate-500 text-xs py-4 text-center">
          No automated actions in this period — all systems idle.
        </p>
      )}

      {!loading && data && data.count > 0 && (
        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {data.interventions.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5 py-1.5 border-b border-slate-700/40 last:border-0">
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${OUTCOME_DOT[item.outcome] ?? 'bg-slate-500'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-teal-300">{item.client_name}</span>
                  <span className="text-xs text-slate-300">
                    {ACTION_LABELS[item.action_type] ?? item.action_type}
                  </span>
                  {item.value_protected && (
                    <span className="text-xs text-green-400 font-medium">{formatValue(item.value_protected)}</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5 leading-snug">{item.description}</p>
                <p className="text-xs text-slate-600 mt-0.5">{formatTime(item.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
