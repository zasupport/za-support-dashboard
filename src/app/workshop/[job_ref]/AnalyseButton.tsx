'use client';

import { useState } from 'react';

interface AnalysisResult {
  summary?: string;
  critical_findings?: string[];
  recommended_actions?: string[];
  upsell_opportunities?: string[];
  roi_impact?: string;
  next_step?: string;
  error?: string;
}

export function AnalyseButton({ jobRef }: { jobRef: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/workshop/${encodeURIComponent(jobRef)}/analyse`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Analysis failed.');
      } else {
        setResult(data);
      }
    } catch {
      setError('Network error — could not reach analysis service.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={run}
        disabled={loading}
        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        {loading ? (
          <>
            <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Analysing…
          </>
        ) : (
          <>
            <span className="text-base">✦</span>
            Analyse this job
          </>
        )}
      </button>

      {error && (
        <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-violet-900/20 border border-violet-700/40 rounded-lg p-5 space-y-4">
          <p className="text-xs text-violet-400 font-semibold uppercase tracking-wide">AI Analysis</p>

          {result.summary && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Summary</p>
              <p className="text-slate-200 text-sm leading-relaxed">{result.summary}</p>
            </div>
          )}

          {result.critical_findings && result.critical_findings.length > 0 && (
            <div>
              <p className="text-xs text-red-400 font-medium mb-1.5">Critical Findings</p>
              <ul className="space-y-1">
                {result.critical_findings.map((f, i) => (
                  <li key={i} className="text-sm text-red-300 flex gap-2">
                    <span className="text-red-500 shrink-0">!</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.recommended_actions && result.recommended_actions.length > 0 && (
            <div>
              <p className="text-xs text-teal-400 font-medium mb-1.5">Recommended Actions</p>
              <ol className="space-y-1 list-decimal list-inside">
                {result.recommended_actions.map((a, i) => (
                  <li key={i} className="text-sm text-slate-300">{a}</li>
                ))}
              </ol>
            </div>
          )}

          {result.upsell_opportunities && result.upsell_opportunities.length > 0 && (
            <div>
              <p className="text-xs text-yellow-400 font-medium mb-1.5">Upsell Opportunities</p>
              <ul className="space-y-1">
                {result.upsell_opportunities.map((u, i) => (
                  <li key={i} className="text-sm text-yellow-300 flex gap-2">
                    <span className="text-yellow-500 shrink-0">R</span>
                    {u}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.roi_impact && (
            <div className="bg-slate-900/50 rounded p-3">
              <p className="text-xs text-slate-500 mb-0.5">ROI Impact</p>
              <p className="text-sm text-slate-200">{result.roi_impact}</p>
            </div>
          )}

          {result.next_step && (
            <div className="border-t border-violet-700/30 pt-3">
              <p className="text-xs text-violet-400 mb-0.5">Next Step</p>
              <p className="text-sm text-white font-medium">{result.next_step}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
