'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

type Device = {
  id: string;
  client_id: string;
  client_name: string;
  client_status: string;
  device_serial: string | null;
  device_type: string;
  make: string;
  model: string;
  display_name: string;
  age_years: number | null;
  expected_lifespan: number;
  lifecycle_pct: number | null;
  replacement_urgency: 'critical' | 'overdue' | 'soon' | 'watch' | 'none';
  replacement_due: string | null;
  replacement_rec: string | null;
  warranty_expires: string | null;
  applecare_expires: string | null;
  last_seen_at: string | null;
};

function InlineProposalButton({
  clientId, clientName, deviceName, urgency,
}: {
  clientId: string; clientName: string; deviceName: string; urgency: string;
}) {
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState('');

  async function generate() {
    setLoading(true); setErr('');
    try {
      const summary = `${deviceName} is flagged as ${urgency} on the Upgrade Radar. This proposal covers replacement options through ZA Support including data migration, setup, and 3-month complimentary monitoring.`;
      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, client_name: clientName, assessment_summary: summary }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setUrl(data.url || '');
    } catch {
      setErr('Proposal generation failed');
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (url) return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-teal-300 font-mono truncate max-w-[180px]">{url}</span>
      <button onClick={copy} className="text-xs bg-teal-600 hover:bg-teal-500 text-white px-2 py-1 rounded transition-colors">
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={generate}
        disabled={loading}
        className="text-xs bg-teal-700 hover:bg-teal-600 text-white px-3 py-1.5 rounded transition-colors disabled:opacity-50"
      >
        {loading ? 'Generating…' : 'Generate Proposal →'}
      </button>
      {err && <span className="text-red-400 text-xs">{err}</span>}
    </div>
  );
}

type RadarMeta = {
  total: number;
  critical: number;
  overdue: number;
  soon: number;
};

type RadarData = {
  data: Device[];
  meta: RadarMeta;
};

const URGENCY_CONFIG = {
  critical: {
    label: 'Critical',
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    border: 'border-red-500/30',
    dot: 'bg-red-500',
    row: 'border-l-2 border-l-red-500',
  },
  overdue: {
    label: 'Overdue',
    bg: 'bg-orange-500/20',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    dot: 'bg-orange-500',
    row: 'border-l-2 border-l-orange-500',
  },
  soon: {
    label: 'Soon',
    bg: 'bg-yellow-500/20',
    text: 'text-yellow-400',
    border: 'border-yellow-500/30',
    dot: 'bg-yellow-500',
    row: 'border-l-2 border-l-yellow-500',
  },
  watch: {
    label: 'Watch',
    bg: 'bg-slate-500/20',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
    dot: 'bg-slate-500',
    row: 'border-l-2 border-l-slate-500',
  },
  none: {
    label: 'OK',
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-500',
    row: '',
  },
};

function UrgencyBadge({ urgency }: { urgency: Device['replacement_urgency'] }) {
  const cfg = URGENCY_CONFIG[urgency] || URGENCY_CONFIG.none;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function LifecycleBar({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-slate-600 text-xs">—</span>;
  const clamped = Math.min(pct, 150);
  const color = pct >= 120 ? 'bg-red-500' : pct >= 100 ? 'bg-orange-500' : pct >= 80 ? 'bg-yellow-500' : pct >= 60 ? 'bg-amber-400' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 bg-slate-700 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${Math.min(clamped, 100)}%` }} />
      </div>
      <span className="text-xs text-slate-300 tabular-nums">{pct.toFixed(0)}%</span>
    </div>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
}

function whatsappUpgradeUrl(device: Device): string {
  const age = device.age_years != null ? `${device.age_years.toFixed(1)} years` : 'several years';
  const lifespan = device.expected_lifespan;
  const name = device.client_name.split(' ')[0];
  const msg = [
    `Hi ${name},`,
    ``,
    `I wanted to flag that your ${device.display_name} is now ${age} old — we typically recommend replacement at the ${lifespan}-year mark.`,
    ``,
    `When you upgrade through ZA Support, we handle everything: data migration, full setup, and Health Check monitoring active from day one. We include 3 months of complimentary monitoring with every new machine.`,
    ``,
    `Worth a quick chat? I can put a comparison together for you.`,
    ``,
    `Courtney`,
    `ZA Support`,
    `064 529 5863`,
  ].join('\n');
  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

type FilterType = 'all' | 'critical' | 'overdue' | 'soon' | 'watch';

export default function UpgradeRadarPage() {
  const [data, setData] = useState<RadarData | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchData = useCallback(async (urgency: FilterType) => {
    setLoading(true);
    try {
      const qs = urgency === 'all' ? '' : `?urgency=${urgency}`;
      const res = await fetch(`/api/lifecycle/radar${qs}`);
      const json = await res.json();
      setData(json);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(filter); }, [filter, fetchData]);

  const meta = data?.meta;
  const devices = data?.data || [];

  const FILTER_TABS: { key: FilterType; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: (meta?.critical ?? 0) + (meta?.overdue ?? 0) + (meta?.soon ?? 0) },
    { key: 'critical', label: 'Critical', count: meta?.critical },
    { key: 'overdue', label: 'Overdue', count: meta?.overdue },
    { key: 'soon', label: 'Soon', count: meta?.soon },
    { key: 'watch', label: 'Watch' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Upgrade Radar</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Fleet-wide device lifecycle — clients ready for a hardware conversation
        </p>
      </div>

      {/* Summary cards */}
      {meta && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-400 text-xs uppercase tracking-wide font-medium">Critical</p>
            <p className="text-red-300 text-3xl font-bold mt-1">{meta.critical}</p>
            <p className="text-red-400/70 text-xs mt-1">Replace immediately</p>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
            <p className="text-orange-400 text-xs uppercase tracking-wide font-medium">Overdue</p>
            <p className="text-orange-300 text-3xl font-bold mt-1">{meta.overdue}</p>
            <p className="text-orange-400/70 text-xs mt-1">Past expected lifespan</p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <p className="text-yellow-400 text-xs uppercase tracking-wide font-medium">Soon</p>
            <p className="text-yellow-300 text-3xl font-bold mt-1">{meta.soon}</p>
            <p className="text-yellow-400/70 text-xs mt-1">Within 12 months</p>
          </div>
          <div className="bg-slate-700/50 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-400 text-xs uppercase tracking-wide font-medium">Total flagged</p>
            <p className="text-white text-3xl font-bold mt-1">{meta.total}</p>
            <p className="text-slate-500 text-xs mt-1">Across all clients</p>
          </div>
        </div>
      )}

      {/* Upsell reminder */}
      {(meta?.critical ?? 0) + (meta?.overdue ?? 0) > 0 && (
        <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg p-4 mb-6">
          <p className="text-teal-300 text-sm font-medium">
            💡 {(meta?.critical ?? 0) + (meta?.overdue ?? 0)} device{(meta?.critical ?? 0) + (meta?.overdue ?? 0) !== 1 ? 's' : ''} need replacement conversations now.
            When you buy through ZA Support, clients get data migration, Health Check setup, and 3 months complimentary monitoring.
          </p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              filter === tab.key
                ? 'bg-teal-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`text-xs rounded-full px-1.5 py-0 ${filter === tab.key ? 'bg-teal-500 text-white' : 'bg-slate-600 text-slate-300'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
          <p className="text-sm font-medium text-white">
            {loading ? 'Loading…' : `${devices.length} device${devices.length !== 1 ? 's' : ''}`}
          </p>
          <button
            onClick={() => fetchData(filter)}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading fleet data…</div>
        ) : devices.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 text-sm">No devices flagged{filter !== 'all' ? ` as ${filter}` : ''}.</p>
            <p className="text-slate-600 text-xs mt-1">
              Devices appear here when they reach 60% of their expected lifespan.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-xs text-slate-500 uppercase tracking-wide">
                    <th className="text-left px-4 py-2.5 font-medium">Device</th>
                    <th className="text-left px-4 py-2.5 font-medium">Client</th>
                    <th className="text-left px-4 py-2.5 font-medium">Age</th>
                    <th className="text-left px-4 py-2.5 font-medium">Lifecycle</th>
                    <th className="text-left px-4 py-2.5 font-medium">Urgency</th>
                    <th className="text-left px-4 py-2.5 font-medium">Replace by</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {devices.map(device => {
                    const rowCfg = URGENCY_CONFIG[device.replacement_urgency] || URGENCY_CONFIG.none;
                    const isOpen = expanded === device.id;
                    return (
                      <>
                        <tr
                          key={device.id}
                          className={`hover:bg-slate-700/30 transition-colors cursor-pointer ${rowCfg.row}`}
                          onClick={() => setExpanded(isOpen ? null : device.id)}
                        >
                          <td className="px-4 py-3">
                            <p className="text-white font-medium">{device.display_name}</p>
                            <p className="text-slate-500 text-xs">{device.model}</p>
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/clients/${device.client_id}`}
                              className="text-teal-400 hover:text-teal-300 transition-colors"
                              onClick={e => e.stopPropagation()}
                            >
                              {device.client_name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            {device.age_years != null
                              ? `${device.age_years.toFixed(1)}y / ${device.expected_lifespan}y`
                              : `— / ${device.expected_lifespan}y`}
                          </td>
                          <td className="px-4 py-3">
                            <LifecycleBar pct={device.lifecycle_pct} />
                          </td>
                          <td className="px-4 py-3">
                            <UrgencyBadge urgency={device.replacement_urgency} />
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-xs">
                            {formatDate(device.replacement_due)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <a
                                href={whatsappUpgradeUrl(device)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs bg-green-700 hover:bg-green-600 text-white px-2.5 py-1 rounded transition-colors"
                                onClick={e => e.stopPropagation()}
                                title="Send WhatsApp upgrade pitch"
                              >
                                WhatsApp →
                              </a>
                              <Link
                                href={`/clients/${device.client_id}`}
                                className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2.5 py-1 rounded transition-colors"
                                onClick={e => e.stopPropagation()}
                              >
                                View
                              </Link>
                            </div>
                          </td>
                        </tr>
                        {isOpen && (
                          <tr key={`${device.id}-detail`} className="bg-slate-900/50">
                            <td colSpan={7} className="px-6 py-4">
                              <div className="space-y-2">
                                {device.replacement_rec && (
                                  <div className="bg-teal-500/10 border border-teal-500/20 rounded p-3">
                                    <p className="text-teal-300 text-xs font-medium mb-1">Recommendation</p>
                                    <p className="text-slate-300 text-sm">{device.replacement_rec}</p>
                                  </div>
                                )}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                  <div>
                                    <p className="text-slate-500">Make / Type</p>
                                    <p className="text-slate-300">{device.make} · {device.device_type}</p>
                                  </div>
                                  {device.device_serial && (
                                    <div>
                                      <p className="text-slate-500">Serial</p>
                                      <p className="text-slate-300 font-mono">{device.device_serial}</p>
                                    </div>
                                  )}
                                  {device.warranty_expires && (
                                    <div>
                                      <p className="text-slate-500">Warranty expires</p>
                                      <p className="text-slate-300">{formatDate(device.warranty_expires)}</p>
                                    </div>
                                  )}
                                  {device.applecare_expires && (
                                    <div>
                                      <p className="text-slate-500">AppleCare expires</p>
                                      <p className="text-slate-300">{formatDate(device.applecare_expires)}</p>
                                    </div>
                                  )}
                                  {device.last_seen_at && (
                                    <div>
                                      <p className="text-slate-500">Last seen</p>
                                      <p className="text-slate-300">{formatDate(device.last_seen_at)}</p>
                                    </div>
                                  )}
                                </div>
                                {/* Sales action bar */}
                                <div className="flex items-center gap-3 pt-2 border-t border-slate-700/50 mt-1">
                                  <a
                                    href={whatsappUpgradeUrl(device)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded transition-colors"
                                  >
                                    WhatsApp pitch →
                                  </a>
                                  <InlineProposalButton
                                    clientId={device.client_id}
                                    clientName={device.client_name}
                                    deviceName={device.display_name}
                                    urgency={device.replacement_urgency}
                                  />
                                  <Link
                                    href={`/clients/${device.client_id}`}
                                    className="text-xs text-slate-400 hover:text-white transition-colors"
                                  >
                                    View client profile →
                                  </Link>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="md:hidden divide-y divide-slate-700/50">
              {devices.map(device => {
                const rowCfg = URGENCY_CONFIG[device.replacement_urgency] || URGENCY_CONFIG.none;
                return (
                  <li key={device.id} className={`p-4 ${rowCfg.row}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm">{device.display_name}</p>
                        <p className="text-slate-400 text-xs">{device.model}</p>
                        <Link
                          href={`/clients/${device.client_id}`}
                          className="text-teal-400 text-xs hover:text-teal-300"
                        >
                          {device.client_name}
                        </Link>
                      </div>
                      <UrgencyBadge urgency={device.replacement_urgency} />
                    </div>
                    <div className="mt-2">
                      <LifecycleBar pct={device.lifecycle_pct} />
                    </div>
                    {device.age_years != null && (
                      <p className="text-slate-500 text-xs mt-1">
                        {device.age_years.toFixed(1)} years old · {device.expected_lifespan}y expected lifespan
                      </p>
                    )}
                    {device.replacement_rec && (
                      <p className="text-slate-400 text-xs mt-2 leading-relaxed">{device.replacement_rec}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <a
                        href={whatsappUpgradeUrl(device)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-green-700 hover:bg-green-600 text-white px-2.5 py-1 rounded transition-colors"
                      >
                        WhatsApp pitch →
                      </a>
                      <Link
                        href={`/clients/${device.client_id}`}
                        className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2.5 py-1 rounded transition-colors"
                      >
                        View client
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
