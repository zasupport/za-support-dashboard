'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type NotificationItem = {
  id: string;
  created_at: string;
  category: string;
  subject: string;
  device_serial: string | null;
  status: string;
  sent_at: string | null;
};

type DigestMeta = {
  pending_count: number;
  last_digest_sent_at: string | null;
};

type DigestResponse = {
  data: NotificationItem[];
  meta: DigestMeta;
};

type FilterTab = 'all' | 'pending' | 'sent';

const CATEGORY_BADGE: Record<string, string> = {
  scan_report:  'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  backup_alert: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  risk_trend:   'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  stale_device: 'bg-slate-500/30 text-slate-300 border border-slate-500/40',
  security_gap: 'bg-red-500/20 text-red-300 border border-red-500/30',
  high_risk:    'bg-red-500/20 text-red-300 border border-red-500/30',
  general:      'bg-slate-500/30 text-slate-300 border border-slate-500/40',
};

function categoryLabel(cat: string) {
  return cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatSAST(iso: string) {
  try {
    const d = new Date(iso);
    // Format: DD/MM/YYYY HH:MM SAST
    const day   = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year  = d.getUTCFullYear();
    // SAST = UTC+2
    const sast  = new Date(d.getTime() + 2 * 60 * 60 * 1000);
    const hh    = String(sast.getUTCHours()).padStart(2, '0');
    const mm    = String(sast.getUTCMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hh}:${mm}`;
  } catch {
    return '—';
  }
}

function formatLastDigest(iso: string | null) {
  if (!iso) return 'Never';
  try {
    const d    = new Date(iso);
    const sast = new Date(d.getTime() + 2 * 60 * 60 * 1000);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60)    return `${diff}s ago`;
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    const day   = String(sast.getUTCDate()).padStart(2, '0');
    const month = String(sast.getUTCMonth() + 1).padStart(2, '0');
    const year  = sast.getUTCFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '—';
  }
}

// Skeleton row for loading state
function SkeletonRow() {
  return (
    <tr className="border-b border-slate-700/40">
      {[...Array(5)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 bg-slate-700 rounded animate-pulse" style={{ width: `${60 + (i * 11) % 40}%` }} />
        </td>
      ))}
    </tr>
  );
}

export default function NotificationsPage() {
  const [data, setData]       = useState<DigestResponse | null>(null);
  const [tab, setTab]         = useState<FilterTab>('all');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/notifications/digest?status=all&limit=100');
      const json = await res.json() as DigestResponse;
      setData(json);
    } catch {
      // silent — empty state shown
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const allItems     = data?.data ?? [];
  const pendingCount = data?.meta?.pending_count ?? 0;
  const lastDigest   = data?.meta?.last_digest_sent_at ?? null;

  const filtered = tab === 'all'
    ? allItems
    : allItems.filter(n => n.status === tab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notification Digest</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Outbound notifications queue — what ZA Support has sent or will send
          </p>
        </div>
        <button
          onClick={fetchData}
          className="text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 bg-slate-800 rounded border border-slate-700"
        >
          Refresh
        </button>
      </div>

      {/* Summary bar */}
      <div className="rounded-md border border-slate-700 bg-slate-800/60 px-4 py-3 flex items-center gap-4 text-sm flex-wrap">
        <span className="text-slate-300">
          <span className={`font-bold ${pendingCount > 0 ? 'text-yellow-400' : 'text-slate-400'}`}>
            {pendingCount}
          </span>
          {' '}pending since last digest
        </span>
        <span className="text-slate-600">·</span>
        <span className="text-slate-400">
          Last digest: <span className="text-slate-300">{formatLastDigest(lastDigest)}</span>
        </span>
        <span className="text-slate-600">·</span>
        <span className="text-slate-400">
          Total: <span className="text-slate-300">{allItems.length}</span>
        </span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1 w-fit border border-slate-700">
        {(['all', 'pending', 'sent'] as FilterTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors capitalize ${
              tab === t
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t}
            {t === 'pending' && pendingCount > 0 && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                tab === 'pending' ? 'bg-yellow-500 text-slate-900' : 'bg-slate-700 text-yellow-400'
              }`}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-sm">
            {loading ? 'Loading…' : `${filtered.length} notification${filtered.length !== 1 ? 's' : ''}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!loading && filtered.length === 0 ? (
            <p className="text-slate-400 text-sm px-6 py-8 text-center">
              No notifications in queue
              {tab !== 'all' && (
                <span className="block text-slate-600 text-xs mt-1">
                  Try switching to &quot;All&quot; to see all notifications.
                </span>
              )}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="text-left px-4 py-3 font-medium">Time (SAST)</th>
                    <th className="text-left px-4 py-3 font-medium">Category</th>
                    <th className="text-left px-4 py-3 font-medium">Subject</th>
                    <th className="text-left px-4 py-3 font-medium">Device</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? [...Array(6)].map((_, i) => <SkeletonRow key={i} />)
                    : filtered.map((n, i) => {
                        const catStyle = CATEGORY_BADGE[n.category] ?? CATEGORY_BADGE.general;
                        const serial   = n.device_serial
                          ? n.device_serial.length > 14
                            ? n.device_serial.slice(0, 12) + '…'
                            : n.device_serial
                          : null;
                        return (
                          <tr
                            key={n.id ?? i}
                            className="border-b border-slate-700/40 last:border-0 hover:bg-slate-700/20 transition-colors"
                          >
                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                              {formatSAST(n.created_at)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded border text-[11px] font-medium ${catStyle}`}>
                                {categoryLabel(n.category)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-200 max-w-xs">
                              <p className="truncate">{n.subject || '—'}</p>
                            </td>
                            <td className="px-4 py-3 text-slate-500 font-mono">
                              {serial ?? <span className="text-slate-700">—</span>}
                            </td>
                            <td className="px-4 py-3">
                              {n.status === 'pending' ? (
                                <span className="px-2 py-0.5 rounded border text-[11px] font-medium bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                                  Pending
                                </span>
                              ) : n.status === 'sent' ? (
                                <span
                                  className="px-2 py-0.5 rounded border text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                  title={n.sent_at ? formatSAST(n.sent_at) : ''}
                                >
                                  Sent {n.sent_at ? formatSAST(n.sent_at) : ''}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded border text-[11px] font-medium bg-slate-600/40 text-slate-400 border-slate-600">
                                  {n.status}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                  }
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
