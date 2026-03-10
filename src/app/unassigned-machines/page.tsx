'use client';

import { useEffect, useState, useCallback } from 'react';
import { Inbox, CheckCircle, RefreshCw, UserPlus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface UnassignedMachine {
  machine_id: string;
  serial_number: string | null;
  model: string;
  computer_name: string | null;
  icloud_account: string | null;
  identity_score: number;
  suggested_client_name: string | null;
  local_username: string | null;
  full_name: string | null;
  mdm_enrolled: boolean;
  registered_at: string | null;
  last_seen_at: string | null;
  provisional_token: string;
}

interface Client {
  id: string;
  name: string;
}

function IdentityScoreBar({ score }: { score: number }) {
  const colour =
    score >= 80
      ? 'bg-green-500'
      : score >= 50
      ? 'bg-yellow-500'
      : 'bg-red-500';
  const textColour =
    score >= 80
      ? 'text-green-400'
      : score >= 50
      ? 'text-yellow-400'
      : 'text-red-400';
  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${colour} transition-all`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-xs font-medium tabular-nums ${textColour}`}>{score}</span>
    </div>
  );
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function AssignModal({
  machine,
  clients,
  onClose,
  onAssigned,
}: {
  machine: UnassignedMachine;
  clients: Client[];
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleAssign() {
    if (!selectedClientId) {
      setError('Select a client first.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `/api/unassigned/${machine.machine_id}/assign`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_id: selectedClientId }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Assignment failed.');
        return;
      }
      onAssigned();
      onClose();
    } catch {
      setError('Network error — please retry.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-white font-semibold text-base mb-1">Assign Machine to Client</h2>
        <p className="text-slate-400 text-xs mb-4">
          {machine.suggested_client_name || machine.computer_name || machine.serial_number || 'Unknown machine'}
          {machine.serial_number && (
            <span className="ml-1 text-slate-500">· {machine.serial_number}</span>
          )}
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Client</label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
            >
              <option value="">— select client —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAssign}
              disabled={loading || !selectedClientId}
              className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
            >
              {loading ? 'Assigning…' : 'Assign'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm px-4 py-2 rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UnassignedMachinesPage() {
  const [machines, setMachines] = useState<UnassignedMachine[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMachine, setSelectedMachine] = useState<UnassignedMachine | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [machinesRes, clientsRes] = await Promise.all([
        fetch('/api/unassigned', { cache: 'no-store' }),
        fetch('/api/clients?per_page=200', { cache: 'no-store' }),
      ]);

      if (machinesRes.status === 404) {
        setError('feature_pending');
        return;
      }

      const machinesData = machinesRes.ok ? await machinesRes.json() : { machines: [] };
      const clientsData = clientsRes.ok ? await clientsRes.json() : { data: [] };

      setMachines(machinesData.machines || []);
      setClients(clientsData.data || []);
      setLastRefresh(new Date());
    } catch {
      setError('Failed to load data. Retrying…');
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

  if (error === 'feature_pending') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Inbox size={40} className="text-slate-600 mb-3" />
        <p className="text-slate-400 text-sm">Feature pending backend deployment</p>
        <p className="text-slate-600 text-xs mt-1">
          The unassigned machines endpoint is not yet available on the current backend.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">Unassigned Machines</h1>
            {machines.length > 0 && (
              <span className="bg-orange-500/20 border border-orange-500/40 text-orange-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                {machines.length}
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm mt-0.5">
            Machines that have self-registered but not yet been linked to a client
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors shrink-0"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">
            {loading ? 'Refreshing…' : `Updated ${timeAgo(lastRefresh.toISOString())}`}
          </span>
        </button>
      </div>

      {/* Error banner */}
      {error && error !== 'feature_pending' && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && machines.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CheckCircle size={40} className="text-green-500 mb-3" />
          <p className="text-white font-medium">All machines assigned</p>
          <p className="text-slate-400 text-sm mt-1">No pending registrations.</p>
        </div>
      )}

      {/* Table */}
      {machines.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="text-left px-4 py-3 font-medium">Registered</th>
                    <th className="text-left px-4 py-3 font-medium">Model</th>
                    <th className="text-left px-4 py-3 font-medium">Serial</th>
                    <th className="text-left px-4 py-3 font-medium">Computer Name</th>
                    <th className="text-left px-4 py-3 font-medium">iCloud Account</th>
                    <th className="text-left px-4 py-3 font-medium">Identity Score</th>
                    <th className="text-left px-4 py-3 font-medium">Suggested Match</th>
                    <th className="text-left px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {machines.map((m) => (
                    <tr
                      key={m.machine_id}
                      className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        {timeAgo(m.registered_at)}
                      </td>
                      <td className="px-4 py-3 text-white font-medium">
                        {m.model}
                        {m.last_seen_at && (
                          <div className="text-slate-500 font-normal mt-0.5">
                            seen {timeAgo(m.last_seen_at)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-mono">
                        {m.serial_number || <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {m.computer_name || <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {m.icloud_account ? (
                          <span className="text-teal-400">{m.icloud_account}</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <IdentityScoreBar score={m.identity_score} />
                      </td>
                      <td className="px-4 py-3">
                        {m.suggested_client_name ? (
                          <span className="text-white">{m.suggested_client_name}</span>
                        ) : (
                          <span className="text-slate-600">No match</span>
                        )}
                        {m.full_name && m.full_name !== m.suggested_client_name && (
                          <div className="text-slate-500 mt-0.5">{m.full_name}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedMachine(m)}
                          className="flex items-center gap-1.5 bg-teal-600/20 hover:bg-teal-600/40 border border-teal-500/30 text-teal-400 hover:text-teal-300 text-xs px-2.5 py-1 rounded-md transition-colors whitespace-nowrap"
                        >
                          <UserPlus size={11} />
                          Assign to Client
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assign Modal */}
      {selectedMachine && (
        <AssignModal
          machine={selectedMachine}
          clients={clients}
          onClose={() => setSelectedMachine(null)}
          onAssigned={fetchData}
        />
      )}
    </div>
  );
}
