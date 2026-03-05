'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ReportRecord = {
  id: number;
  client_id: string;
  serial: string | null;
  snapshot_id: number | null;
  report_type: string;
  filename: string;
  generated_at: string;
};

export function ReportsClient() {
  const [clientId, setClientId] = useState('');
  const [history, setHistory] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadHistory(cid: string) {
    if (!cid.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/reports?client_id=${encodeURIComponent(cid)}`);
      setHistory(await res.json());
    } catch {
      setError('Failed to load report history.');
    } finally {
      setLoading(false);
    }
  }

  async function generate() {
    if (!clientId.trim()) { setError('Enter a client ID.'); return; }
    setGenerating(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId.trim() }),
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
      loadHistory(clientId.trim());
    } catch (e) {
      setError(String(e));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Generate */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-white">Generate CyberPulse Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3 flex-wrap">
            <input
              className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white flex-1 min-w-[200px] focus:outline-none focus:border-blue-500"
              placeholder="Client ID (e.g. dr-evan-shoul)"
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { loadHistory(clientId.trim()); } }}
            />
            <button
              onClick={() => loadHistory(clientId.trim())}
              className="bg-slate-700 hover:bg-slate-600 text-white text-sm px-4 py-2 rounded transition-colors"
            >
              Load History
            </button>
            <button
              onClick={generate}
              disabled={generating}
              className="bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white text-sm px-4 py-2 rounded transition-colors"
            >
              {generating ? 'Generating…' : 'Generate & Download PDF'}
            </button>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {success && <p className="text-green-400 text-sm">{success}</p>}
        </CardContent>
      </Card>

      {/* History */}
      {loading && <p className="text-slate-400 text-sm">Loading history…</p>}
      {!loading && history.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Report History</h2>
          <div className="space-y-2">
            {history.map(r => (
              <div
                key={r.id}
                className="bg-slate-800 border border-slate-700 rounded px-4 py-3 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-white text-sm font-mono truncate max-w-[420px]">{r.filename}</p>
                  <p className="text-slate-500 text-xs">
                    {r.report_type.toUpperCase()} · {r.serial || '—'} ·{' '}
                    {r.generated_at?.slice(0, 19).replace('T', ' ')}
                  </p>
                </div>
                <span className="text-xs text-slate-500 shrink-0">#{r.id}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {!loading && clientId && history.length === 0 && (
        <p className="text-slate-500 text-sm">No reports generated yet for this client.</p>
      )}
    </div>
  );
}
