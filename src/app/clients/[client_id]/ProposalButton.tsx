'use client';

import { useState } from 'react';

export function ProposalButton({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [url, setUrl]         = useState('');
  const [copied, setCopied]   = useState(false);
  const [summary, setSummary] = useState('');
  const [error, setError]     = useState('');

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, client_name: clientName, assessment_summary: summary || undefined }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUrl(data.proposal_url);
    } catch {
      setError('Failed to generate proposal. Check backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs px-3 py-1.5 rounded border border-teal-600/50 bg-teal-600/10 text-teal-300 hover:bg-teal-600/20 transition-colors font-medium"
      >
        Generate Proposal
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-white font-semibold mb-1">Generate Sales Proposal</h3>
        <p className="text-slate-400 text-sm mb-4">
          Creates a personalised pricing page for <strong className="text-slate-200">{clientName}</strong>. Share the link via WhatsApp or email — they select their tier, you get notified instantly.
        </p>

        {!url ? (
          <>
            <textarea
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="Assessment summary (optional) — shown to client above the tier cards."
              rows={3}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none mb-3"
            />
            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={generate}
                disabled={loading}
                className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                {loading ? 'Generating…' : 'Generate Link'}
              </button>
              <button onClick={() => setOpen(false)} className="px-4 py-2.5 text-slate-400 hover:text-white text-sm">
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 mb-3 break-all text-teal-300 text-xs font-mono">
              {url}
            </div>
            <div className="flex gap-2">
              <button
                onClick={copy}
                className="flex-1 bg-teal-600 hover:bg-teal-500 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={() => { setUrl(''); setSummary(''); setOpen(false); }}
                className="px-4 py-2.5 text-slate-400 hover:text-white text-sm"
              >
                Done
              </button>
            </div>
            <p className="text-slate-500 text-xs mt-3 text-center">
              Link expires in 30 days. Client selects a tier → you&apos;re notified via Discord instantly.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
