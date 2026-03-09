'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, Loader2, Link2, Copy, CheckCircle, Zap } from 'lucide-react';

type ReportRecord = {
  id: number;
  client_id: string;
  serial: string | null;
  snapshot_id: number | null;
  report_type: string;
  filename: string;
  generated_at: string;
};

type ShareLink = {
  token: string;
  share_url: string;
  filename: string;
  expires_at: string;
  viewed_at: string | null;
  view_count: number;
  active: boolean;
  report_type: string;
};

type Client = { client_id: string; first_name: string; last_name: string; status: string };

export function ReportsClient() {
  const [clients, setClients]         = useState<Client[]>([]);
  const [clientId, setClientId]       = useState('');
  const [history, setHistory]         = useState<ReportRecord[]>([]);
  const [shareLinks, setShareLinks]   = useState<ShareLink[]>([]);
  const [loadingH, setLoadingH]       = useState(false);
  const [generating, setGenerating]   = useState(false);
  const [generatingDemo, setGeneratingDemo] = useState(false);
  const [sharingLink, setSharingLink] = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [copied, setCopied]           = useState('');

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
      const [histRes, shareRes] = await Promise.all([
        fetch(`/api/reports?client_id=${encodeURIComponent(cid)}`),
        fetch(`/api/reports/share?client_id=${encodeURIComponent(cid)}`),
      ]);
      setHistory(await histRes.json());
      const shareData = await shareRes.json();
      setShareLinks(shareData.links ?? []);
    } catch {
      setError('Failed to load report history.');
    } finally {
      setLoadingH(false);
    }
  }

  function handleClientChange(cid: string) {
    setClientId(cid);
    setHistory([]);
    setShareLinks([]);
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
        setError(json.error || 'Generation failed. Client may not have Scout data yet — use Demo PDF instead.');
        return;
      }
      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition') || '';
      const match = cd.match(/filename="([^"]+)"/);
      const filename = match ? match[1] : `Health Check_${clientId}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      setSuccess(`Downloaded: ${filename}`);
      loadHistory(clientId);
    } catch (e) {
      setError(String(e));
    } finally {
      setGenerating(false);
    }
  }

  async function generateDemo() {
    if (!clientId) { setError('Select a client.'); return; }
    setGeneratingDemo(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/reports/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error || 'Demo generation failed.');
        return;
      }
      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition') || '';
      const match = cd.match(/filename="([^"]+)"/);
      const filename = match ? match[1] : `Health Check_Preliminary_${clientId}.pdf`;
      const shareUrl = res.headers.get('X-Share-URL') || '';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      setSuccess(`Downloaded: ${filename}${shareUrl ? ` — Share link created ✓` : ''}`);
      loadHistory(clientId);
    } catch (e) {
      setError(String(e));
    } finally {
      setGeneratingDemo(false);
    }
  }

  async function createShareLink() {
    if (!clientId) { setError('Select a client.'); return; }
    setSharingLink(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/reports/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, days_valid: 30 }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error || 'Failed to create share link. Client needs at least one report first.');
        return;
      }
      const data = await res.json();
      setSuccess(`Share link created — valid for 30 days`);
      await copyToClipboard(data.share_url, 'share-new');
      loadHistory(clientId);
    } catch (e) {
      setError(String(e));
    } finally {
      setSharingLink(false);
    }
  }

  async function copyToClipboard(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    } catch {}
  }

  const selectedClient = clients.find(c => c.client_id === clientId);
  const activeShareLinks = shareLinks.filter(l => l.active);

  return (
    <div className="space-y-6">
      {/* Generate */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <FileText size={14} /> Generate Health Check Diagnostic
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
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

          {/* Action buttons row */}
          {clientId && (
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={generateDemo}
                disabled={generatingDemo}
                className="flex items-center gap-1.5 text-xs bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-amber-300 border border-amber-700 px-3 py-1.5 rounded transition-colors"
              >
                {generatingDemo
                  ? <Loader2 size={12} className="animate-spin" />
                  : <Zap size={12} />}
                Generate Demo PDF
              </button>

              <button
                onClick={createShareLink}
                disabled={sharingLink}
                className="flex items-center gap-1.5 text-xs bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-blue-300 border border-blue-700 px-3 py-1.5 rounded transition-colors"
              >
                {sharingLink
                  ? <Loader2 size={12} className="animate-spin" />
                  : <Link2 size={12} />}
                Create Share Link
              </button>
            </div>
          )}

          {selectedClient && (
            <p className="text-xs text-slate-400">
              <span className="text-white">{selectedClient.first_name} {selectedClient.last_name}</span>
              {' — '}Generate from latest Scout diagnostic, or use <span className="text-amber-300">Demo PDF</span> if Scout is not yet installed.
            </p>
          )}

          {error   && <p className="text-red-400 text-sm">{error}</p>}
          {success && <p className="text-green-400 text-sm">{success}</p>}
        </CardContent>
      </Card>

      {/* Active Share Links */}
      {activeShareLinks.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <Link2 size={14} /> Active Share Links — {selectedClient?.first_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeShareLinks.map(link => (
              <div key={link.token} className="bg-slate-700/50 rounded px-3 py-2.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-white text-xs font-mono truncate">{link.share_url}</p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {link.report_type.replace('_', ' ').toUpperCase()} ·{' '}
                    Expires {new Date(link.expires_at).toLocaleDateString('en-ZA')} ·{' '}
                    {link.view_count > 0
                      ? <span className="text-green-400">{link.view_count} view{link.view_count !== 1 ? 's' : ''} {link.viewed_at ? `(first: ${new Date(link.viewed_at).toLocaleDateString('en-ZA')})` : ''}</span>
                      : <span className="text-slate-500">Not yet opened</span>}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(link.share_url, link.token)}
                  className="shrink-0 text-slate-400 hover:text-white transition-colors"
                  title="Copy link"
                >
                  {copied === link.token
                    ? <CheckCircle size={14} className="text-green-400" />
                    : <Copy size={14} />}
                </button>
              </div>
            ))}
            <p className="text-xs text-slate-500 pt-1">
              Send these links directly to your client — no login required. ZA Support tracks when they open the report.
            </p>
          </CardContent>
        </Card>
      )}

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
      {!loadingH && clientId && history.length === 0 && !generating && !generatingDemo && (
        <p className="text-slate-500 text-sm">
          No reports generated yet for this client.{' '}
          <button onClick={generateDemo} className="text-amber-400 hover:text-amber-300 underline">
            Generate a Demo PDF
          </button>{' '}
          to send them a preliminary assessment now.
        </p>
      )}
    </div>
  );
}
