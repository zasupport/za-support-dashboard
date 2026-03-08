'use client';

import { useState, useEffect, useCallback } from 'react';
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
  client_id: string | null;
  client_name: string;
};

type FleetData = {
  period_days: number;
  count: number;
  total_value_protected: number;
  interventions: Intervention[];
};

const ACTION_LABELS: Record<string, string> = {
  alert_sent:             'Client Alert',
  patch_alert:            'Patch Alert',
  backup_alert:           'Backup Monitor',
  report_generated:       'Report Delivered',
  risk_scored:            'Risk Scored',
  breach_scan:            'Breach Scan',
  security_posture_check: 'Security Posture',
  stale_device_detected:  'Stale Device',
  checkin_triggered:      'Check-In Triggered',
  investec_scan:          'Investec Scanner',
  unifi_poll:             'UniFi Poll',
  research_scrape:        'Research Scrape',
  weekly_digest:          'Weekly Digest',
  workshop_job_created:   'Workshop Job',
  cybershield_report:     'CyberShield Report',
  isp_outage_alert:       'ISP Outage Alert',
  risk_trend_alert:       'Risk Trend Alert',
  forensics_alert:        'Forensic Alert',
};

const ALERT_TYPE_LABELS: Record<string, { label: string; colour: string }> = {
  'backup.missing':       { label: 'No Backup',      colour: 'bg-red-900/50 text-red-300 border border-red-700/50' },
  'backup.stale':         { label: 'Stale Backup',   colour: 'bg-orange-900/50 text-orange-300 border border-orange-700/50' },
  'security.posture_gap': { label: 'Security Gap',   colour: 'bg-amber-900/50 text-amber-300 border border-amber-700/50' },
  'remote_access':        { label: 'Remote Access',  colour: 'bg-red-900/50 text-red-300 border border-red-700/50' },
  'high_risk_score':      { label: 'High Risk Score', colour: 'bg-purple-900/50 text-purple-300 border border-purple-700/50' },
};

const OUTCOME_DOT: Record<string, string> = {
  success: 'bg-emerald-500',
  failed:  'bg-red-500',
  skipped: 'bg-slate-500',
  pending: 'bg-amber-500',
};

type Tab = 'all' | 'alerts';

function formatRand(v: number) {
  if (v >= 1_000_000) return `R ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `R ${(v / 1_000).toFixed(0)}k`;
  return `R ${v.toFixed(0)}`;
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function InterventionsPage() {
  const [data, setData]       = useState<FleetData | null>(null);
  const [days, setDays]       = useState(7);
  const [tab, setTab]         = useState<Tab>('all');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ days: String(days), limit: '200' });
      if (tab === 'alerts') params.set('action_type', 'alert_sent');
      const res = await fetch(`/api/interventions?${params.toString()}`);
      const json = await res.json();
      setData(json);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [days, tab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Group by action type for summary bar
  const typeCounts: Record<string, number> = {};
  (data?.interventions || []).forEach(i => {
    typeCounts[i.action_type] = (typeCounts[i.action_type] || 0) + 1;
  });
  const topTypes = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const alertCount = tab === 'alerts'
    ? (data?.count || 0)
    : (data?.interventions || []).filter(i => i.action_type === 'alert_sent').length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Automated Interventions</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            What ZA Support did automatically — no action required from you
          </p>
        </div>
        <div className="flex items-center gap-2">
          {([1, 7, 30] as const).map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                days === d
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {d === 1 ? '24h' : d === 7 ? '7 days' : '30 days'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-800/50 rounded-lg p-1 w-fit border border-slate-700">
        <button
          onClick={() => setTab('all')}
          className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
            tab === 'all'
              ? 'bg-slate-700 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          All actions
        </button>
        <button
          onClick={() => setTab('alerts')}
          className={`px-4 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
            tab === 'alerts'
              ? 'bg-teal-700 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Client alerts
          {alertCount > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              tab === 'alerts' ? 'bg-teal-600 text-white' : 'bg-slate-700 text-teal-400'
            }`}>
              {alertCount}
            </span>
          )}
        </button>
      </div>

      {/* Summary cards */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
            <p className="text-slate-400 text-xs uppercase tracking-wide">Actions</p>
            <p className="text-white text-2xl font-bold mt-1">{data.count}</p>
          </div>
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
            <p className="text-slate-400 text-xs uppercase tracking-wide">Value protected</p>
            <p className="text-teal-400 text-2xl font-bold mt-1">
              {data.total_value_protected > 0 ? formatRand(data.total_value_protected) : '—'}
            </p>
          </div>
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
            <p className="text-slate-400 text-xs uppercase tracking-wide">Success rate</p>
            <p className="text-white text-2xl font-bold mt-1">
              {data.count > 0
                ? `${Math.round((data.interventions.filter(i => i.outcome === 'success').length / data.count) * 100)}%`
                : '—'}
            </p>
          </div>
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
            <p className="text-slate-400 text-xs uppercase tracking-wide">
              {tab === 'alerts' ? 'Clients alerted' : 'Action types'}
            </p>
            <p className="text-white text-2xl font-bold mt-1">
              {tab === 'alerts'
                ? new Set(data.interventions.filter(i => i.client_id).map(i => i.client_id)).size || '—'
                : Object.keys(typeCounts).length
              }
            </p>
          </div>
        </div>
      )}

      {/* Top action types (hidden in alerts tab) */}
      {tab === 'all' && topTypes.length > 0 && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 mb-6">
          <p className="text-slate-400 text-xs uppercase tracking-wide font-medium mb-3">Top action types</p>
          <div className="flex flex-wrap gap-2">
            {topTypes.map(([type, count]) => (
              <button
                key={type}
                onClick={() => { setTab(type === 'alert_sent' ? 'alerts' : 'all'); }}
                className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs px-2.5 py-1 rounded-full transition-colors"
              >
                {ACTION_LABELS[type] || type.replace(/_/g, ' ')}{' '}
                <span className="text-teal-400 font-semibold">{count}×</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Client alerts info panel */}
      {tab === 'alerts' && data && data.count > 0 && (
        <div className="bg-teal-900/20 rounded-lg border border-teal-700/40 p-4 mb-6">
          <p className="text-teal-300 text-xs font-medium uppercase tracking-wide mb-1">Client Alert System — Active</p>
          <p className="text-slate-300 text-sm">
            These emails were sent directly to clients by ZA Support&apos;s automated system.
            Each alert includes the issue in plain language, what action the client should take,
            and is CC&apos;d to Courtney. Clients are on a 24-hour cooldown per alert type.
          </p>
        </div>
      )}

      {/* Feed */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
          <p className="text-sm font-medium text-white">
            {tab === 'alerts' ? 'Client alerts sent' : 'Activity feed'}
          </p>
          <button
            onClick={fetchData}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading…</div>
        ) : !data || data.count === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            {tab === 'alerts'
              ? `No client alerts sent in the last ${days === 1 ? '24 hours' : `${days} days`}.`
              : `No automated interventions in the last ${days === 1 ? '24 hours' : `${days} days`}.`}
            <br />
            <span className="text-slate-600 text-xs">
              {tab === 'alerts'
                ? 'Alerts fire when Scout detects: missing backup, stale backup, security gaps, high risk score, or remote access tools.'
                : 'System is monitoring. Actions appear here as they occur.'}
            </span>
          </div>
        ) : (
          <ul className="divide-y divide-slate-700/50">
            {data.interventions.map((item, idx) => {
              const alertTypeMeta = item.metadata?.alert_type
                ? ALERT_TYPE_LABELS[item.metadata.alert_type]
                : null;
              return (
                <li key={idx} className="px-4 py-3 flex items-start gap-3 hover:bg-slate-700/30 transition-colors">
                  <div className="mt-1.5 flex-shrink-0">
                    <span className={`block w-2 h-2 rounded-full ${OUTCOME_DOT[item.outcome] || 'bg-slate-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-medium ${item.action_type === 'alert_sent' ? 'text-teal-400' : 'text-teal-400'}`}>
                        {ACTION_LABELS[item.action_type] || item.action_type.replace(/_/g, ' ')}
                      </span>
                      {alertTypeMeta && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${alertTypeMeta.colour}`}>
                          {alertTypeMeta.label}
                        </span>
                      )}
                      {item.client_id && (
                        <Link
                          href={`/clients/${item.client_id}`}
                          className="text-xs text-slate-400 hover:text-white truncate max-w-[140px]"
                        >
                          {item.client_name}
                        </Link>
                      )}
                      {item.value_protected && (
                        <span className="text-xs text-emerald-400 font-medium">
                          {formatRand(item.value_protected)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-300 mt-0.5 leading-snug">{item.description}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {item.device_serial && (
                        <Link
                          href={`/devices/${item.device_serial}`}
                          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          {item.device_serial}
                        </Link>
                      )}
                      {item.metadata?.client_email && (
                        <span className="text-xs text-slate-500">
                          → {item.metadata.client_email}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 flex-shrink-0 mt-0.5">
                    {timeAgo(item.created_at)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
