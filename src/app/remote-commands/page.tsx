'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Terminal, X, RefreshCw, Plus } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type CommandStatus = 'pending' | 'executing' | 'completed' | 'failed' | 'expired';
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
type CommandType = 'run_diagnostic' | 'run_scout' | 'force_update' | 'log_flush' | 'custom_script';

interface Command {
  id: string;
  created_at: string;
  client_id?: string;
  client_name?: string;
  device_id: string;
  command_type: CommandType;
  status: CommandStatus;
  risk_level?: RiskLevel;
  queued_by?: string;
  scheduled_for?: string | null;
  parameters?: Record<string, unknown>;
}

interface Summary {
  pending: number;
  executing: number;
  completed_24h: number;
  failed_24h: number;
  pending_count?: number;
}

interface RiskInfo {
  level: RiskLevel;
  description: string;
}

interface RisksMap {
  [key: string]: RiskInfo;
}

// ─── Badge helpers ─────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<CommandStatus, string> = {
  pending:   'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  executing: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  completed: 'bg-green-500/20 text-green-300 border-green-500/30',
  failed:    'bg-red-500/20 text-red-300 border-red-500/30',
  expired:   'bg-slate-600/40 text-slate-400 border-slate-600',
};

const RISK_BADGE: Record<RiskLevel, string> = {
  low:      'bg-green-500/20 text-green-300 border-green-500/30',
  medium:   'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  high:     'bg-orange-500/20 text-orange-300 border-orange-500/30',
  critical: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const COMMAND_LABELS: Record<CommandType, string> = {
  run_diagnostic: 'Run Diagnostic',
  run_scout:      'Run Scout',
  force_update:   'Force Update',
  log_flush:      'Log Flush',
  custom_script:  'Custom Script',
};

function StatusBadge({ status }: { status: CommandStatus }) {
  const cls = STATUS_BADGE[status] ?? STATUS_BADGE.expired;
  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-medium capitalize ${cls}`}>
      {status}
    </span>
  );
}

function RiskBadge({ level }: { level?: RiskLevel }) {
  if (!level) return <span className="text-slate-500 text-xs">—</span>;
  const cls = RISK_BADGE[level] ?? RISK_BADGE.low;
  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-medium capitalize ${cls}`}>
      {level}
    </span>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Queue Command Modal ───────────────────────────────────────────────────────

function QueueModal({
  risks,
  onClose,
  onQueued,
}: {
  risks: RisksMap;
  onClose: () => void;
  onQueued: () => void;
}) {
  const [clientId, setClientId] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [commandType, setCommandType] = useState<CommandType>('run_diagnostic');
  const [scheduledFor, setScheduledFor] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedRisk = risks[commandType];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!deviceId.trim()) { setError('Device ID is required.'); return; }
    setLoading(true);
    setError('');
    try {
      const body: Record<string, unknown> = { device_id: deviceId.trim(), command_type: commandType };
      if (clientId.trim()) body.client_id = clientId.trim();
      if (scheduledFor) body.scheduled_for = new Date(scheduledFor).toISOString();

      const res = await fetch('/api/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.detail || d.error || 'Failed to queue command.');
        return;
      }
      onQueued();
      onClose();
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }

  const riskBg: Record<RiskLevel, string> = {
    low:      'bg-green-500/10 border-green-500/30 text-green-300',
    medium:   'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
    high:     'bg-orange-500/10 border-orange-500/30 text-orange-300',
    critical: 'bg-red-500/10 border-red-500/30 text-red-300',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h2 className="text-white font-semibold text-sm">Queue Command</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Client ID */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Client ID (optional)</label>
            <input
              type="text"
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              placeholder="e.g. evan-shoul"
              className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Device ID */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Device ID / Serial <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={deviceId}
              onChange={e => setDeviceId(e.target.value)}
              placeholder="e.g. C02ZPLLHMD6P"
              className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              required
            />
          </div>

          {/* Command type */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Command Type</label>
            <select
              value={commandType}
              onChange={e => setCommandType(e.target.value as CommandType)}
              className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
            >
              {(Object.keys(COMMAND_LABELS) as CommandType[]).map(ct => (
                <option key={ct} value={ct}>{COMMAND_LABELS[ct]}</option>
              ))}
            </select>
          </div>

          {/* Risk info */}
          {selectedRisk && (
            <div className={`rounded-md border px-3 py-2 text-xs ${riskBg[selectedRisk.level] ?? riskBg.low}`}>
              <span className="font-semibold uppercase mr-2">{selectedRisk.level} risk</span>
              {selectedRisk.description}
            </div>
          )}

          {/* Scheduled for */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Schedule for (leave blank for immediate)</label>
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={e => setScheduledFor(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-md bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {loading ? 'Queuing…' : 'Queue Command'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

function RemoteCommandsContent() {
  const searchParams = useSearchParams();
  const initialClientId = searchParams.get('client_id') ?? '';

  const [commands, setCommands] = useState<Command[]>([]);
  const [meta, setMeta] = useState<{ total: number; page: number; per_page: number }>({ total: 0, page: 1, per_page: 20 });
  const [summary, setSummary] = useState<Summary>({ pending: 0, executing: 0, completed_24h: 0, failed_24h: 0 });
  const [risks, setRisks] = useState<RisksMap>({});
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState(initialClientId);
  const [deviceSearch, setDeviceSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadCommands = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), per_page: '20' });
    if (statusFilter) params.set('status', statusFilter);
    if (clientFilter) params.set('client_id', clientFilter);
    if (deviceSearch) params.set('device_id', deviceSearch);

    try {
      const res = await fetch(`/api/commands?${params}`);
      const json = await res.json();
      setCommands(Array.isArray(json.data) ? json.data : []);
      setMeta(json.meta ?? { total: 0, page: 1, per_page: 20 });
    } catch {
      setCommands([]);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, [statusFilter, clientFilter, deviceSearch]);

  const loadSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/commands/summary');
      const data = await res.json();
      setSummary(data);
    } catch { /* graceful — keep previous values */ }
  }, []);

  const loadRisks = useCallback(async () => {
    try {
      const res = await fetch('/api/commands/risks');
      const data = await res.json();
      setRisks(data);
    } catch { /* graceful */ }
  }, []);

  // Initial load
  useEffect(() => {
    loadCommands();
    loadSummary();
    loadRisks();
  }, [loadCommands, loadSummary, loadRisks]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      loadCommands();
      loadSummary();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadCommands, loadSummary]);

  async function handleCancel(id: string) {
    setCancelling(id);
    try {
      await fetch(`/api/commands/${id}/cancel`, { method: 'POST' });
      await loadCommands();
      await loadSummary();
    } catch { /* ignore */ } finally {
      setCancelling(null);
    }
  }

  const statsCards = [
    { label: 'Pending', value: summary.pending, cls: 'text-yellow-400' },
    { label: 'Executing', value: summary.executing, cls: 'text-blue-400' },
    { label: 'Completed (24h)', value: summary.completed_24h, cls: 'text-green-400' },
    { label: 'Failed (24h)', value: summary.failed_24h, cls: 'text-red-400' },
  ];

  return (
    <div className="space-y-6">
      {showModal && (
        <QueueModal
          risks={risks}
          onClose={() => setShowModal(false)}
          onQueued={() => { loadCommands(); loadSummary(); }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Terminal size={22} className="text-teal-400" />
            Remote Commands
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Queue and monitor commands sent to client machines</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { loadCommands(); loadSummary(); }}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-md bg-teal-700 hover:bg-teal-600 text-white font-medium transition-colors"
          >
            <Plus size={14} />
            Queue Command
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statsCards.map(({ label, value, cls }) => (
          <Card key={label} className="bg-slate-800 border-slate-700">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${cls}`}>{value}</p>
              <p className="text-slate-400 text-xs mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); }}
          className="bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
        >
          <option value="">All Statuses</option>
          {(['pending', 'executing', 'completed', 'failed', 'expired'] as CommandStatus[]).map(s => (
            <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>

        {/* Client filter */}
        <input
          type="text"
          value={clientFilter}
          onChange={e => setClientFilter(e.target.value)}
          placeholder="Filter by client ID…"
          className="bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 w-48"
        />

        {/* Device search */}
        <input
          type="text"
          value={deviceSearch}
          onChange={e => setDeviceSearch(e.target.value)}
          placeholder="Search by device…"
          className="bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 w-48"
        />

        <button
          onClick={() => loadCommands(1)}
          className="px-4 py-2 rounded-md bg-teal-700 hover:bg-teal-600 text-white text-sm font-medium transition-colors"
        >
          Apply
        </button>

        {/* Auto-refresh indicator */}
        <span className="ml-auto self-center text-xs text-slate-500">
          Auto-refresh every 30s · Last: {lastRefresh.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>

      {/* Commands table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm">
            {loading ? 'Loading…' : `${meta.total} command${meta.total !== 1 ? 's' : ''}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {commands.length === 0 && !loading ? (
            <p className="text-slate-400 text-sm px-6 py-8 text-center">No commands found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="text-left px-4 py-3 font-medium">Time</th>
                    <th className="text-left px-4 py-3 font-medium">Client</th>
                    <th className="text-left px-4 py-3 font-medium">Device</th>
                    <th className="text-left px-4 py-3 font-medium">Command</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Risk</th>
                    <th className="text-left px-4 py-3 font-medium">Queued By</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {commands.map((cmd) => (
                    <tr key={cmd.id} className="border-b border-slate-700/40 last:border-0 hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3 text-slate-400 font-mono whitespace-nowrap">
                        {timeAgo(cmd.created_at)}
                        {cmd.scheduled_for && (
                          <p className="text-teal-400 text-[10px]">sched {new Date(cmd.scheduled_for).toLocaleString('en-ZA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {cmd.client_id ? (
                          <Link href={`/clients/${cmd.client_id}`} className="text-teal-400 hover:text-teal-300 font-mono">
                            {cmd.client_name || cmd.client_id}
                          </Link>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-mono">{cmd.device_id}</td>
                      <td className="px-4 py-3 text-slate-200">{COMMAND_LABELS[cmd.command_type] || cmd.command_type}</td>
                      <td className="px-4 py-3"><StatusBadge status={cmd.status} /></td>
                      <td className="px-4 py-3"><RiskBadge level={cmd.risk_level} /></td>
                      <td className="px-4 py-3 text-slate-400">{cmd.queued_by || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        {cmd.status === 'pending' && (
                          <button
                            onClick={() => handleCancel(cmd.id)}
                            disabled={cancelling === cmd.id}
                            className="text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
                          >
                            {cancelling === cmd.id ? 'Cancelling…' : 'Cancel'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {meta.total > meta.per_page && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
              <p className="text-slate-500 text-xs">
                Showing {(meta.page - 1) * meta.per_page + 1}–{Math.min(meta.page * meta.per_page, meta.total)} of {meta.total}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={meta.page <= 1}
                  onClick={() => loadCommands(meta.page - 1)}
                  className="text-xs px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-300 transition-colors"
                >
                  Prev
                </button>
                <button
                  disabled={meta.page * meta.per_page >= meta.total}
                  onClick={() => loadCommands(meta.page + 1)}
                  className="text-xs px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-300 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function RemoteCommandsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Loading...</div>}>
      <RemoteCommandsContent />
    </Suspense>
  );
}
