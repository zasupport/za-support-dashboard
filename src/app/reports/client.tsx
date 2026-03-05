'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, Loader2 } from 'lucide-react';

type ReportRecord = {
  id: number;
  client_id: string;
  serial: string | null;
  snapshot_id: number | null;
  report_type: string;
  filename: string;
  generated_at: string;
};

type Client = { client_id: string; first_name: string; last_name: string; status: string };

export function ReportsClient() {
  const [clients, setClients]       = useState<Client[]>([]);
  const [clientId, setClientId]     = useState('');
  const [history, setHistory]       = useState<ReportRecord[]>([]);
  const [loadingH, setLoadingH]     = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');

  useEffect(() => {
    fetch('/api/clients?per_page=100')
      .then(r => r.json())
      .then(json => setClients(json.data ?? []))
      .catch(() => {});
  }, []);

  async function loadHistory(cid: string) {
    if (!cid) return;
    setLoadingH(true);
    setError('');
    try {
      const res = await fetch(`/api/reports?client_id=${encodeURIComponent(cid)}`);
      setHistory(await res.json());
    } catch {
      setError('Failed to load report history.');
    } finally {
      setLoadingH(false);
    }
  }

  function handleClientChange(cid: string) {
    setClientId(cid);
    setHistory([]);
    setError('');
    setSuccess('');
    if (cid) loadHistory(cid);
  }

  async function generate() {
    if (!clientId) { setError('Select a client.'); return; }
    setGenerating(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error || 'Generation failed.');
        return;
      }
      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition') || '';
      const match = cd.match(/filename="([^"]+)"/);
      const filename = match ? match[1] : `CyberPulse_${clientId}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess(`Downloaded: ${filename}`);
      loadHistory(clientId);
    } catch (e) {
      setError(String(e));
    } finally {
      setGenerating(false);
    }
  }

  const selectedClient = clients.find(c => c.client_id === clientId);

  return (
    <div className="space-y-6">
      {/* Generate */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <FileText size={14} /> Generate CyberPulse Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Client dropdown */}
            <div className="lg:col-span-2">
              <label className="text-xs text-slate-400 block mb-1">Client</label>
              <select
                value={clientId}
                onChange={e => handleClientChange(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400"
              >
                <option value="">Select a client…</option>
                {clients.map(c => (
                  <option key={c.client_id} value={c.client_id}>
                    {c.first_name} {c.last_name}
                    {c.status === 'sla' ? ' (SLA)' : c.status === 'new' ? ' (New)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={generate}
                disabled={generating || !clientId}
                className="w-full flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white text-sm px-4 py-2 rounded transition-colors font-medium"
              >
                {generating
                  ? <><Loader2 size={14} className="animate-spin" /> Generating…</>
                  : <><Download size={14} /> Generate & Download</>}
              </button>
            </div>
          </div>

          {selectedClient && (
            <p className="text-xs text-slate-400">
              Generating from latest Scout diagnostic for{' '}
              <span className="text-white">{selectedClient.first_name} {selectedClient.last_name}</span>.
            </p>
          )}

          {error   && <p className="text-red-400 text-sm">{error}</p>}
          {success && <p className="text-green-400 text-sm">{success}</p>}
        </CardContent>
      </Card>

      {/* History */}
      {loadingH && <p className="text-slate-400 text-sm">Loading history…</p>}
      {!loadingH && history.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-3">
            Report History — {selectedClient?.first_name} {selectedClient?.last_name}
          </h2>
          <div className="space-y-2">
            {history.map(r => (
              <div
                key={r.id}
                className="bg-slate-800 border border-slate-700 rounded px-4 py-3 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-white text-sm font-mono truncate max-w-[420px]">{r.filename}</p>
                  <p className="text-slate-500 text-xs">
                    {r.report_type.toUpperCase()} · {r.serial || 'All devices'} ·{' '}
                    {r.generated_at?.slice(0, 19).replace('T', ' ')}
                  </p>
                </div>
                <a
                  href={`/api/reports/${r.client_id}${r.snapshot_id ? `?snapshot_id=${r.snapshot_id}` : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-teal-400 hover:text-teal-300 shrink-0"
                >
                  Re-download →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
      {!loadingH && clientId && history.length === 0 && !generating && (
        <p className="text-slate-500 text-sm">No reports generated yet for this client.</p>
      )}
    </div>
  );
}
