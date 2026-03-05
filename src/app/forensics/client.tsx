'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Investigation = {
  id: string;
  client_id: string;
  device_hostname?: string;
  device_id?: string;
  scope: string;
  status: string;
  initiated_by: string;
  reason: string;
  consent_granted: boolean;
  created_at: string;
  completed_at?: string;
  findings_critical?: number;
  findings_high?: number;
  findings_medium?: number;
  findings_low?: number;
  findings_info?: number;
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-slate-400',
  consent_granted: 'text-blue-400',
  running: 'text-yellow-400',
  complete: 'text-green-400',
  cancelled: 'text-slate-500',
  failed: 'text-red-400',
};

export function ForensicsClient() {
  const [clientId, setClientId] = useState('');
  const [status, setStatus] = useState('');
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (clientId) params.set('client_id', clientId);
    if (status) params.set('status', status);
    try {
      const res = await fetch(`/api/forensics?${params}`);
      const json = await res.json();
      setInvestigations(Array.isArray(json) ? json : []);
    } catch {
      setError('Failed to load investigations');
    } finally {
      setLoading(false);
    }
  }

  const totalFindings = (inv: Investigation) =>
    (inv.findings_critical ?? 0) + (inv.findings_high ?? 0) +
    (inv.findings_medium ?? 0) + (inv.findings_low ?? 0) + (inv.findings_info ?? 0);

  return (
    <div>
      <div className="flex gap-3 mb-6 flex-wrap">
        <input
          className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white w-56 focus:outline-none focus:border-blue-500"
          placeholder="Client ID (optional)"
          value={clientId}
          onChange={e => setClientId(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load()}
        />
        <select
          className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="consent_granted">Consent Granted</option>
          <option value="running">Running</option>
          <option value="complete">Complete</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button
          onClick={load}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded transition-colors"
        >
          Load
        </button>
      </div>

      {loading && <p className="text-slate-400 text-sm">Loading...</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {!loading && !error && investigations.length === 0 && (
        <p className="text-slate-400 text-sm">No investigations found. Use the backend API to create one.</p>
      )}

      {investigations.length > 0 && (
        <div className="space-y-3">
          {investigations.map(inv => (
            <Card key={inv.id} className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-white font-mono">
                    {inv.id.slice(0, 8)}…
                  </CardTitle>
                  <span className={`text-xs font-semibold ${STATUS_COLORS[inv.status] ?? 'text-slate-400'}`}>
                    {inv.status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-400">
                <div>
                  <p className="text-slate-500">Device</p>
                  <p className="text-slate-200">{inv.device_hostname || inv.device_id || '—'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Scope</p>
                  <p className="text-slate-200">{inv.scope?.replace(/_/g, ' ') ?? '—'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Initiated by</p>
                  <p className="text-slate-200">{inv.initiated_by}</p>
                </div>
                <div>
                  <p className="text-slate-500">Consent</p>
                  <p className={inv.consent_granted ? 'text-green-400' : 'text-red-400'}>
                    {inv.consent_granted ? 'Granted' : 'Not granted'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Created</p>
                  <p>{inv.created_at?.slice(0, 10) ?? '—'}</p>
                </div>
                {inv.completed_at && (
                  <div>
                    <p className="text-slate-500">Completed</p>
                    <p>{inv.completed_at.slice(0, 10)}</p>
                  </div>
                )}
                {totalFindings(inv) > 0 && (
                  <div className="col-span-2">
                    <p className="text-slate-500 mb-1">Findings</p>
                    <div className="flex gap-3">
                      {inv.findings_critical! > 0 && <span className="text-red-400">Crit: {inv.findings_critical}</span>}
                      {inv.findings_high! > 0 && <span className="text-orange-400">High: {inv.findings_high}</span>}
                      {inv.findings_medium! > 0 && <span className="text-yellow-400">Med: {inv.findings_medium}</span>}
                      {inv.findings_low! > 0 && <span className="text-green-400">Low: {inv.findings_low}</span>}
                      {inv.findings_info! > 0 && <span className="text-blue-400">Info: {inv.findings_info}</span>}
                    </div>
                  </div>
                )}
                {inv.reason && (
                  <div className="col-span-4">
                    <p className="text-slate-500">Reason</p>
                    <p className="text-slate-300">{inv.reason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
