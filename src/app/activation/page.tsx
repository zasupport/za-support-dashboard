'use client';

import { useState, useEffect, useCallback } from 'react';

interface ActivationCode {
  id: string;
  code: string;
  client_id: string;
  client_name: string;
  created_at: string | null;
  expires_at: string | null;
  used_at: string | null;
  machine_serial: string | null;
  machine_hostname: string | null;
  revoked: boolean;
  notes: string | null;
  status: 'active' | 'used' | 'expired' | 'revoked';
}

interface DeviceToken {
  id: string;
  client_id: string;
  machine_serial: string;
  activated_at: string | null;
  last_used_at: string | null;
  revoked: boolean;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-ZA', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: 'bg-teal-900/40 text-teal-300 border border-teal-700/40',
    used: 'bg-slate-700 text-slate-300 border border-slate-600',
    expired: 'bg-orange-900/30 text-orange-400 border border-orange-700/30',
    revoked: 'bg-red-900/30 text-red-400 border border-red-700/30',
  };
  return `text-xs px-2 py-0.5 rounded font-medium ${map[status] || map.active}`;
}

export default function ActivationPage() {
  const [codes, setCodes] = useState<ActivationCode[]>([]);
  const [devices, setDevices] = useState<DeviceToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'codes' | 'devices'>('codes');
  const [generating, setGenerating] = useState(false);
  const [genForm, setGenForm] = useState({ client_id: '', client_name: '', notes: '' });
  const [genResult, setGenResult] = useState<{ code: string; whatsapp_message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cr, dr] = await Promise.all([
        fetch('/api/activation', { cache: 'no-store' }),
        fetch('/api/activation/devices', { cache: 'no-store' }),
      ]);
      const cj = cr.ok ? await cr.json() : { data: [] };
      const dj = dr.ok ? await dr.json() : { data: [] };
      setCodes(cj.data ?? []);
      setDevices(dj.data ?? []);
    } catch {
      setError('Could not load activation data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function revokeCode(code: string) {
    if (!confirm(`Revoke code ${code}? The device using this code will retain its device token.`)) return;
    await fetch(`/api/activation/${encodeURIComponent(code)}/revoke`, { method: 'PATCH' });
    load();
  }

  async function revokeDevice(id: string, serial: string) {
    if (!confirm(`Revoke device token for ${serial}? This device will be locked out immediately.`)) return;
    await fetch(`/api/activation/devices/${encodeURIComponent(id)}/revoke`, { method: 'PATCH' });
    load();
  }

  async function generate() {
    if (!genForm.client_id || !genForm.client_name) {
      setError('Client ID and name are required.');
      return;
    }
    setGenerating(true);
    setError(null);
    setGenResult(null);
    try {
      const res = await fetch('/api/activation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(genForm),
      });
      if (!res.ok) {
        const e = await res.json();
        setError(e.detail || 'Failed to generate code.');
      } else {
        const j = await res.json();
        setGenResult(j);
        setGenForm({ client_id: '', client_name: '', notes: '' });
        load();
      }
    } catch {
      setError('Network error generating code.');
    } finally {
      setGenerating(false);
    }
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const activeCodes = codes.filter(c => c.status === 'active').length;
  const usedCodes = codes.filter(c => c.status === 'used').length;
  const activeDevices = devices.filter(d => !d.revoked).length;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Activation Codes</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage generic PKG activation codes and registered devices.
          </p>
        </div>
        <button onClick={load} className="text-xs text-slate-400 hover:text-teal-400 px-3 py-1.5 border border-slate-700 rounded-lg transition-colors">
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Codes', value: activeCodes, colour: 'text-teal-400' },
          { label: 'Used Codes', value: usedCodes, colour: 'text-slate-300' },
          { label: 'Active Devices', value: activeDevices, colour: 'text-green-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.colour}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Generate new code */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
        <h2 className="text-white font-semibold mb-4">Generate New Code</h2>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <input
            className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            placeholder="client_id (e.g. kai-smith)"
            value={genForm.client_id}
            onChange={e => setGenForm(f => ({ ...f, client_id: e.target.value }))}
          />
          <input
            className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            placeholder="Client name (e.g. Kai Smith)"
            value={genForm.client_name}
            onChange={e => setGenForm(f => ({ ...f, client_name: e.target.value }))}
          />
          <input
            className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            placeholder="Notes (optional)"
            value={genForm.notes}
            onChange={e => setGenForm(f => ({ ...f, notes: e.target.value }))}
          />
        </div>
        <button
          onClick={generate}
          disabled={generating}
          className="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {generating ? 'Generating...' : 'Generate Code'}
        </button>

        {genResult && (
          <div className="mt-4 bg-teal-900/20 border border-teal-700/40 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-3">
              <span className="font-mono text-teal-300 text-lg font-bold">{genResult.code}</span>
              <button
                onClick={() => copyToClipboard(genResult.code, 'code')}
                className="text-xs text-slate-400 hover:text-teal-400"
              >
                {copied === 'code' ? 'Copied!' : 'Copy code'}
              </button>
            </div>
            <div className="flex items-start gap-3">
              <p className="text-slate-300 text-sm font-mono whitespace-pre-wrap flex-1">{genResult.whatsapp_message}</p>
              <button
                onClick={() => copyToClipboard(genResult.whatsapp_message, 'wa')}
                className="text-xs text-slate-400 hover:text-teal-400 shrink-0"
              >
                {copied === 'wa' ? 'Copied!' : 'Copy WhatsApp msg'}
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3 text-red-400 text-sm">{error}</div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-700 flex gap-6">
        {(['codes', 'devices'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-teal-500 text-teal-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            {t === 'codes' ? `Activation Codes (${codes.length})` : `Registered Devices (${devices.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading...</p>
      ) : tab === 'codes' ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-xs">
                <th className="text-left px-4 py-3">Code</th>
                <th className="text-left px-4 py-3">Client</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Used</th>
                <th className="text-left px-4 py-3">Machine</th>
                <th className="text-left px-4 py-3">Expires</th>
                <th className="text-left px-4 py-3">Notes</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {codes.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-6 text-slate-500 text-center">No activation codes found.</td></tr>
              )}
              {codes.map(c => (
                <tr key={c.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-teal-300 font-semibold">{c.code}</span>
                      <button onClick={() => copyToClipboard(c.code, c.id)} className="text-slate-500 hover:text-teal-400 text-xs">
                        {copied === c.id ? '✓' : 'copy'}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-white">{c.client_name}</div>
                    <div className="text-xs text-slate-500 font-mono">{c.client_id}</div>
                  </td>
                  <td className="px-4 py-3"><span className={statusBadge(c.status)}>{c.status}</span></td>
                  <td className="px-4 py-3 text-slate-300">{formatDate(c.used_at)}</td>
                  <td className="px-4 py-3">
                    {c.machine_serial ? (
                      <div>
                        <div className="text-slate-300 font-mono text-xs">{c.machine_serial}</div>
                        {c.machine_hostname && <div className="text-slate-500 text-xs">{c.machine_hostname}</div>}
                      </div>
                    ) : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(c.expires_at)}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs max-w-[120px] truncate">{c.notes || '—'}</td>
                  <td className="px-4 py-3">
                    {c.status === 'active' && (
                      <button
                        onClick={() => revokeCode(c.code)}
                        className="text-xs text-red-500 hover:text-red-400 transition-colors"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-xs">
                <th className="text-left px-4 py-3">Serial</th>
                <th className="text-left px-4 py-3">Client</th>
                <th className="text-left px-4 py-3">Activated</th>
                <th className="text-left px-4 py-3">Last Seen</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {devices.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-slate-500 text-center">No registered devices.</td></tr>
              )}
              {devices.map(d => (
                <tr key={d.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-300 text-xs">{d.machine_serial}</td>
                  <td className="px-4 py-3 text-slate-300 text-xs font-mono">{d.client_id}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(d.activated_at)}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(d.last_used_at)}</td>
                  <td className="px-4 py-3">
                    <span className={statusBadge(d.revoked ? 'revoked' : 'active')}>
                      {d.revoked ? 'revoked' : 'active'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {!d.revoked && (
                      <button
                        onClick={() => revokeDevice(d.id, d.machine_serial)}
                        className="text-xs text-red-500 hover:text-red-400 transition-colors"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
