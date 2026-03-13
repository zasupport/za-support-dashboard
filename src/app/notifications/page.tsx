'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ─── Types ────────────────────────────────────────────────────────────────────

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

type PreviewItem = {
  id: string;
  category: string;
  subject: string;
  body: string;
  client_id: number | null;
  client_name: string | null;
  device_serial: string | null;
  priority: number;
  created_at: string;
};

type PreviewData = {
  pending_count: number;
  will_send_at: string;
  subject_preview: string;
  body_preview: string;
  groups: Record<string, PreviewItem[]>;
  last_digest_sent_at: string | null;
  generated_at: string | null;
};

type PreviewResponse = {
  data: PreviewData;
};

type PageTab    = 'queue' | 'preview';
type FilterTab  = 'all' | 'pending' | 'sent';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CATEGORY_BADGE: Record<string, string> = {
  scan_report:  'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  backup_alert: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  risk_trend:   'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  stale_device: 'bg-slate-500/30 text-slate-300 border border-slate-500/40',
  security_gap: 'bg-red-500/20 text-red-300 border border-red-500/30',
  high_risk:    'bg-red-500/20 text-red-300 border border-red-500/30',
  general:      'bg-slate-500/30 text-slate-300 border border-slate-500/40',
};

const CATEGORY_LABELS: Record<string, string> = {
  scan_report:  'Scan Reports',
  backup_alert: 'Backup Alerts',
  risk_trend:   'Risk Trends',
  stale_device: 'Stale Devices',
  security_gap: 'Security Gaps',
  high_risk:    'High Risk Alerts',
  general:      'General',
};

function categoryLabel(cat: string) {
  return CATEGORY_LABELS[cat] ?? cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatSAST(iso: string) {
  try {
    const d    = new Date(iso);
    const sast = new Date(d.getTime() + 2 * 60 * 60 * 1000);
    const day   = String(sast.getUTCDate()).padStart(2, '0');
    const month = String(sast.getUTCMonth() + 1).padStart(2, '0');
    const year  = sast.getUTCFullYear();
    const hh    = String(sast.getUTCHours()).padStart(2, '0');
    const mm    = String(sast.getUTCMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hh}:${mm}`;
  } catch {
    return '—';
  }
}

function formatRelative(iso: string | null) {
  if (!iso) return 'Never';
  try {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60)    return `${diff}s ago`;
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    const d     = new Date(new Date(iso).getTime() + 2 * 60 * 60 * 1000);
    const day   = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year  = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '—';
  }
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────

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

// ─── Preview group card ───────────────────────────────────────────────────────

function PreviewGroup({ cat, items }: { cat: string; items: PreviewItem[] }) {
  const [expanded, setExpanded] = useState(false);
  const badge = CATEGORY_BADGE[cat] ?? CATEGORY_BADGE.general;

  return (
    <div className="rounded-md border border-slate-700 overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/80 hover:bg-slate-700/60 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className={`px-2 py-0.5 rounded border text-[11px] font-medium ${badge}`}>
            {categoryLabel(cat)}
          </span>
          <span className="text-slate-300 text-sm font-medium">{items.length} item{items.length !== 1 ? 's' : ''}</span>
        </div>
        <span className="text-slate-500 text-xs">{expanded ? '▲ collapse' : '▼ expand'}</span>
      </button>

      {expanded && (
        <div className="divide-y divide-slate-700/40 bg-slate-900/50">
          {items.map((item, i) => (
            <div key={item.id ?? i} className="px-4 py-3 space-y-1">
              <div className="flex items-start justify-between gap-4">
                <p className="text-slate-200 text-sm font-medium">{item.subject || '(no subject)'}</p>
                <span className="text-slate-500 text-[11px] whitespace-nowrap shrink-0">
                  {formatSAST(item.created_at)} SAST
                </span>
              </div>
              <div className="flex gap-3 text-[11px] text-slate-500">
                {item.client_name && <span>Client: <span className="text-slate-400">{item.client_name}</span></span>}
                {item.device_serial && <span>Serial: <span className="text-slate-400 font-mono">{item.device_serial}</span></span>}
                {item.priority > 1 && <span className="text-yellow-500">Priority {item.priority}</span>}
              </div>
              {item.body && (
                <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-3 mt-1">
                  {item.body}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [pageTab, setPageTab]         = useState<PageTab>('queue');
  const [filterTab, setFilterTab]     = useState<FilterTab>('all');

  // Queue tab state
  const [queueData, setQueueData]     = useState<DigestResponse | null>(null);
  const [queueLoading, setQueueLoading] = useState(true);

  // Preview tab state
  const [preview, setPreview]         = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sendState, setSendState]     = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [sendMessage, setSendMessage] = useState('');

  // ── Fetch: queue ──
  const fetchQueue = useCallback(async () => {
    setQueueLoading(true);
    try {
      const res  = await fetch('/api/notifications/digest?status=all&limit=100');
      const json = await res.json() as DigestResponse;
      setQueueData(json);
    } catch {
      // silent
    } finally {
      setQueueLoading(false);
    }
  }, []);

  // ── Fetch: preview ──
  const fetchPreview = useCallback(async () => {
    setPreviewLoading(true);
    try {
      const res  = await fetch('/api/notifications/preview');
      const json = await res.json() as PreviewResponse;
      setPreview(json.data);
    } catch {
      // silent
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  // Load queue on mount + auto-refresh
  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 60000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  // Load preview when that tab is opened
  useEffect(() => {
    if (pageTab === 'preview') {
      fetchPreview();
    }
  }, [pageTab, fetchPreview]);

  // ── Send now ──
  const handleSendNow = async () => {
    if (sendState === 'sending') return;
    setSendState('sending');
    setSendMessage('');
    try {
      const res  = await fetch('/api/notifications/send-now', { method: 'POST' });
      const json = await res.json() as { data: { sent: boolean; message: string } };
      setSendMessage(json.data?.message ?? 'Done.');
      setSendState(json.data?.sent ? 'sent' : 'error');
      // Refresh both tabs after sending
      await Promise.all([fetchQueue(), fetchPreview()]);
    } catch (err) {
      setSendMessage(`Request failed: ${err}`);
      setSendState('error');
    }
  };

  // ── Derived ──
  const allItems     = queueData?.data ?? [];
  const pendingCount = queueData?.meta?.pending_count ?? 0;
  const lastDigest   = queueData?.meta?.last_digest_sent_at ?? null;
  const filtered     = filterTab === 'all'
    ? allItems
    : allItems.filter(n => n.status === filterTab);

  const previewGroups   = Object.entries(preview?.groups ?? {}).sort(([a], [b]) => a.localeCompare(b));
  const previewPending  = preview?.pending_count ?? 0;

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
          onClick={() => pageTab === 'queue' ? fetchQueue() : fetchPreview()}
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
          Last digest: <span className="text-slate-300">{formatRelative(lastDigest)}</span>
        </span>
        <span className="text-slate-600">·</span>
        <span className="text-slate-400">
          Sends at: <span className="text-slate-300">17:00 SAST</span>
        </span>
        <span className="text-slate-600">·</span>
        <span className="text-slate-400">
          Total in log: <span className="text-slate-300">{allItems.length}</span>
        </span>
      </div>

      {/* Page tab selector */}
      <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1 w-fit border border-slate-700">
        {(['queue', 'preview'] as PageTab[]).map(t => (
          <button
            key={t}
            onClick={() => setPageTab(t)}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
              pageTab === t
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t === 'queue' ? 'Queue' : 'Digest Preview'}
            {t === 'preview' && pendingCount > 0 && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                pageTab === 'preview' ? 'bg-yellow-500 text-slate-900' : 'bg-slate-700 text-yellow-400'
              }`}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── QUEUE TAB ── */}
      {pageTab === 'queue' && (
        <>
          {/* Filter tabs */}
          <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1 w-fit border border-slate-700">
            {(['all', 'pending', 'sent'] as FilterTab[]).map(t => (
              <button
                key={t}
                onClick={() => setFilterTab(t)}
                className={`px-4 py-1.5 rounded text-sm font-medium transition-colors capitalize ${
                  filterTab === t
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t}
                {t === 'pending' && pendingCount > 0 && (
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    filterTab === 'pending' ? 'bg-yellow-500 text-slate-900' : 'bg-slate-700 text-yellow-400'
                  }`}>
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">
                {queueLoading ? 'Loading…' : `${filtered.length} notification${filtered.length !== 1 ? 's' : ''}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!queueLoading && filtered.length === 0 ? (
                <p className="text-slate-400 text-sm px-6 py-8 text-center">
                  No notifications in queue
                  {filterTab !== 'all' && (
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
                      {queueLoading
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
        </>
      )}

      {/* ── PREVIEW TAB ── */}
      {pageTab === 'preview' && (
        <div className="space-y-5">

          {/* Preview header bar */}
          <div className="rounded-md border border-slate-700 bg-slate-800/60 px-4 py-3 flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <p className="text-slate-300 text-sm">
                <span className="font-semibold text-white">
                  {previewLoading ? '…' : previewPending}
                </span>
                {' '}item{previewPending !== 1 ? 's' : ''} queued — will send at{' '}
                <span className="text-white font-semibold">17:00 SAST</span>
              </p>
              {preview?.subject_preview && (
                <p className="text-slate-500 text-xs">
                  Subject: <span className="text-slate-400">{preview.subject_preview}</span>
                </p>
              )}
              {preview?.generated_at && (
                <p className="text-slate-600 text-[11px]">
                  Preview generated: {formatSAST(preview.generated_at)} SAST
                </p>
              )}
            </div>

            {/* Send Now button */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              <button
                onClick={handleSendNow}
                disabled={sendState === 'sending' || previewPending === 0}
                className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${
                  sendState === 'sending'
                    ? 'bg-slate-700 text-slate-400 cursor-wait'
                    : sendState === 'sent'
                    ? 'bg-emerald-700/50 text-emerald-300 border border-emerald-600'
                    : sendState === 'error'
                    ? 'bg-red-700/40 text-red-300 border border-red-600 hover:bg-red-700/60'
                    : previewPending === 0
                    ? 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'
                    : 'bg-yellow-500 text-slate-900 hover:bg-yellow-400 border border-yellow-400'
                }`}
              >
                {sendState === 'sending' ? 'Sending…' :
                 sendState === 'sent'    ? 'Sent' :
                 sendState === 'error'   ? 'Retry' :
                 previewPending === 0    ? 'Nothing to send' :
                 'Send Now'}
              </button>
              {sendMessage && (
                <p className={`text-[11px] max-w-xs text-right ${
                  sendState === 'sent' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {sendMessage}
                </p>
              )}
            </div>
          </div>

          {/* Groups */}
          {previewLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-800 rounded-md animate-pulse border border-slate-700" />
              ))}
            </div>
          ) : previewGroups.length === 0 ? (
            <div className="rounded-md border border-slate-700 bg-slate-800/40 px-6 py-12 text-center">
              <p className="text-slate-400 text-sm">No pending items in tonight&apos;s digest.</p>
              <p className="text-slate-600 text-xs mt-1">Everything is up to date — nothing will send at 17:00.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {previewGroups.map(([cat, items]) => (
                <PreviewGroup key={cat} cat={cat} items={items} />
              ))}
            </div>
          )}

          {/* Raw email preview */}
          {preview?.body_preview && !previewLoading && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Raw email body preview</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-slate-400 text-[11px] leading-relaxed whitespace-pre-wrap font-mono overflow-x-auto">
                  {preview.body_preview}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
