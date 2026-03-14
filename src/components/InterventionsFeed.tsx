'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Intervention = {
  action_type: string;
  description: string;
  outcome: string;
  value_protected: number | null;
  device_serial: string | null;
  created_at: string;
  job_id: string | null;
  metadata: Record<string, string> | null;
};

const ACTION_LABELS: Record<string, string> = {
  alert_sent:                    'Client Alert',
  patch_alert:                   'Patch Alert',
  backup_alert:                  'Backup Monitor',
  report_generated:              'Report Delivered',
  risk_scored:                   'Risk Scored',
  breach_scan:                   'Breach Scan',
  security_posture_check:        'Security Posture',
  stale_device_detected:         'Stale Device',
  checkin_triggered:             'Check-In Triggered',
  investec_scan:                 'Investec Scanner',
  unifi_poll:                    'UniFi Poll',
  research_scrape:               'Research Scrape',
  weekly_digest:                 'Weekly Digest',
  workshop_job_created:          'Workshop Job',
  cybershield_report:            'CyberShield Report',
  isp_outage_alert:              'ISP Outage Alert',
  risk_trend_alert:              'Risk Trend Alert',
  forensics_alert:               'Forensic Alert',
  workshop_status_notification:  'Job Status Update',
};

const ALERT_TYPE_LABELS: Record<string, { label: string; colour: string }> = {
  'backup.missing':       { label: 'No Backup',       colour: 'bg-red-900/50 text-red-300 border border-red-700/50' },
  'backup.stale':         { label: 'Stale Backup',    colour: 'bg-orange-900/50 text-orange-300 border border-orange-700/50' },
  'security.posture_gap': { label: 'Security Gap',    colour: 'bg-amber-900/50 text-amber-300 border border-amber-700/50' },
  'remote_access':        { label: 'Remote Access',   colour: 'bg-red-900/50 text-red-300 border border-red-700/50' },
  'high_risk_score':      { label: 'High Risk Score', colour: 'bg-purple-900/50 text-purple-300 border border-purple-700/50' },
};

const OUTCOME_DOT: Record<string, string> = {
  success: 'bg-emerald-500',
  failed:  'bg-red-500',
  skipped: 'bg-slate-500',
  pending: 'bg-amber-500',
};

function formatRand(v: number | null) {
  if (!v) return null;
  if (v >= 1_000_000) return `R ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `R ${(v / 1_000).toFixed(0)}k`;
  return `R ${v.toFixed(0)}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' });
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function InterventionsFeed({ clientId }: { clientId: string }) {
  const [data, setData]       = useState<{ interventions: Intervention[]; count: number; total_value_protected: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays]       = useState(30);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/reports/interventions/${clientId}?days=${days}`)
      .then(r => r.json())
      .then(json => { if (!cancelled) { setData(json); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [clientId, days]);

  const successCount = data?.interventions.filter(i => i.outcome === 'success').length ?? 0;
  const totalCount   = data?.count ?? 0;
  const successRate  = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : null;
  const alertCount   = data?.interventions.filter(i => i.action_type === 'alert_sent').length ?? 0;

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">What ZA Support Did</p>
          {data && totalCount > 0 && (
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <p className="text-white text-sm font-semibold">
                {totalCount} automated action{totalCount !== 1 ? 's' : ''}
              </p>
              {data.total_value_protected > 0 && (
                <span className="text-teal-400 text-sm font-semibold">
                  {formatRand(data.total_value_protected)} value
                </span>
              )}
              {successRate !== null && (
                <span className="text-slate-400 text-xs">{successRate}% success</span>
              )}
              {alertCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-900/40 border border-teal-700/40 text-teal-300">
                  {alertCount} client alert{alertCount !== 1 ? 's' : ''} sent
                </span>
              )}
            </div>
          )}
        </div>
        <select
          value={days}
          onChange={e => setDays(Number(e.target.value))}
          className="bg-slate-700 border border-slate-600 text-slate-300 text-xs rounded px-2 py-1"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {loading && (
        <p className="text-slate-500 text-xs py-4 text-center">Loading activity…</p>
      )}

      {!loading && (!data || totalCount === 0) && (
        <div className="text-center py-6">
          <p className="text-slate-400 text-xs">System healthy — monitoring active.</p>
          <p className="text-slate-600 text-xs mt-1">No interventions required in this period.</p>
        </div>
      )}

      {!loading && data && totalCount > 0 && (
        <div className="space-y-0 max-h-80 overflow-y-auto">
          {data.interventions.map((item, i) => {
            const alertTypeMeta = item.metadata?.alert_type
              ? ALERT_TYPE_LABELS[item.metadata.alert_type]
              : null;
            return (
              <div key={i} className="flex items-start gap-2.5 py-2.5 border-b border-slate-700/40 last:border-0 hover:bg-slate-700/20 rounded px-1 -mx-1 transition-colors">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${OUTCOME_DOT[item.outcome] ?? 'bg-slate-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-medium ${item.action_type === 'alert_sent' ? 'text-teal-400' : 'text-slate-200'}`}>
                      {ACTION_LABELS[item.action_type] ?? item.action_type.replace(/_/g, ' ')}
                    </span>
                    {alertTypeMeta && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${alertTypeMeta.colour}`}>
                        {alertTypeMeta.label}
                      </span>
                    )}
                    {item.value_protected && (
                      <span className="text-xs text-emerald-400 font-medium">
                        {formatRand(item.value_protected)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 leading-snug">{item.description}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {item.device_serial && (
                      <Link
                        href={`/devices/${item.device_serial}`}
                        className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
                      >
                        {item.device_serial}
                      </Link>
                    )}
                    {item.metadata?.client_email && (
                      <span className="text-xs text-slate-600">→ {item.metadata.client_email}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                  <span className="text-xs text-slate-500">{timeAgo(item.created_at)}</span>
                  <span className="text-xs text-slate-700">{formatDate(item.created_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
