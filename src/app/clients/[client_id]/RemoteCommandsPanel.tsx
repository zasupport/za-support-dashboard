'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Terminal } from 'lucide-react';

type CommandStatus = 'pending' | 'executing' | 'completed' | 'failed' | 'expired';
type CommandType = 'run_diagnostic' | 'run_scout' | 'force_update' | 'log_flush';

interface Command {
  id: string;
  created_at: string;
  device_id: string;
  command_type: string;
  status: CommandStatus;
  risk_level?: string;
}

const STATUS_BADGE: Record<CommandStatus, string> = {
  pending:   'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  executing: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  completed: 'bg-green-500/20 text-green-300 border-green-500/30',
  failed:    'bg-red-500/20 text-red-300 border-red-500/30',
  expired:   'bg-slate-600/40 text-slate-400 border-slate-600',
};

const QUICK_COMMANDS: { type: CommandType; label: string; risk: string }[] = [
  { type: 'run_diagnostic', label: 'Run Diagnostic', risk: 'low' },
  { type: 'run_scout',      label: 'Run Scout',      risk: 'low' },
  { type: 'force_update',   label: 'Force Update',   risk: 'medium' },
  { type: 'log_flush',      label: 'Log Flush',      risk: 'low' },
];

const RISK_CLS: Record<string, string> = {
  low:      'text-green-400',
  medium:   'text-yellow-400',
  high:     'text-orange-400',
  critical: 'text-red-400',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function RemoteCommandsPanel({
  clientId,
  deviceSerial,
}: {
  clientId: string;
  deviceSerial?: string;
}) {
  const [commands, setCommands] = useState<Command[]>([]);
  const [loading, setLoading] = useState(false);
  const [queueing, setQueueing] = useState<CommandType | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/commands?client_id=${clientId}&per_page=5`);
      const json = await res.json();
      setCommands(Array.isArray(json.data) ? json.data : []);
    } catch {
      setCommands([]);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  async function queueCommand(type: CommandType) {
    if (!deviceSerial) {
      setError('No registered device serial found for this client.');
      return;
    }
    setQueueing(type);
    setError('');
    try {
      const res = await fetch('/api/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, device_id: deviceSerial, command_type: type }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.detail || d.error || 'Failed to queue command.');
        return;
      }
      await load();
    } catch {
      setError('Network error — please try again.');
    } finally {
      setQueueing(null);
    }
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Terminal size={14} className="text-teal-400" />
          Remote Commands
        </CardTitle>
        <Link
          href={`/remote-commands?client_id=${clientId}`}
          className="text-xs text-teal-400 hover:text-teal-300"
        >
          View all →
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick action buttons */}
        <div className="flex flex-wrap gap-2">
          {QUICK_COMMANDS.map(({ type, label, risk }) => (
            <button
              key={type}
              onClick={() => queueCommand(type)}
              disabled={queueing !== null || !deviceSerial}
              title={deviceSerial ? `Queue ${label} on ${deviceSerial}` : 'No device serial registered'}
              className="text-xs px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 border border-slate-600 transition-colors"
            >
              {queueing === type ? 'Queuing…' : label}
              <span className={`ml-1 ${RISK_CLS[risk] ?? 'text-slate-400'}`}>({risk})</span>
            </button>
          ))}
        </div>

        {!deviceSerial && (
          <p className="text-slate-500 text-xs">No registered device serial — install Scout PKG first to enable remote commands.</p>
        )}

        {error && <p className="text-red-400 text-xs">{error}</p>}

        {/* Recent commands */}
        {loading ? (
          <p className="text-slate-500 text-xs py-2">Loading…</p>
        ) : commands.length === 0 ? (
          <p className="text-slate-500 text-xs py-2">No commands sent yet.</p>
        ) : (
          <div className="space-y-1">
            {commands.map((cmd) => {
              const status = cmd.status as CommandStatus;
              const cls = STATUS_BADGE[status] ?? STATUS_BADGE.expired;
              return (
                <div key={cmd.id} className="flex items-center justify-between py-1.5 border-b border-slate-700/50 last:border-0">
                  <div className="min-w-0 flex-1">
                    <span className="text-slate-200 text-xs">{cmd.command_type.replace(/_/g, ' ')}</span>
                    <span className="text-slate-500 text-xs ml-2 font-mono">{cmd.device_id}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className={`text-xs px-2 py-0.5 rounded border font-medium capitalize ${cls}`}>{cmd.status}</span>
                    <span className="text-slate-500 text-xs">{timeAgo(cmd.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
