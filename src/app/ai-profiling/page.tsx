'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

type Cluster = {
  cluster_id: number;
  segment: string;
  segment_label?: string;
  client_count: number;
  avg_risk_score: number | null;
  avg_device_age: number | null;
  top_os: string | null;
  backup_compliance_pct: number | null;
  avg_roi?: number | null;
  clients: { client_id: string; client_name: string; risk_score: number | null }[];
};

type Pattern = {
  id: string;
  pattern_type: string;
  title: string;
  description: string;
  affected_client_count: number;
  severity: string;
  recommendation: string | null;
  detected_at: string;
  is_active: boolean;
};

const SEGMENT_COLOURS: Record<string, { bg: string; text: string; border: string }> = {
  medical_practice: { bg: 'bg-teal-500/10',    text: 'text-teal-300',    border: 'border-teal-500/20' },
  sme:              { bg: 'bg-blue-500/10',    text: 'text-blue-300',    border: 'border-blue-500/20' },
  individual:       { bg: 'bg-violet-500/10',  text: 'text-violet-300',  border: 'border-violet-500/20' },
  family:           { bg: 'bg-amber-500/10',   text: 'text-amber-300',   border: 'border-amber-500/20' },
  low:              { bg: 'bg-emerald-500/10', text: 'text-emerald-300', border: 'border-emerald-500/20' },
  moderate:         { bg: 'bg-yellow-500/10',  text: 'text-yellow-300',  border: 'border-yellow-500/20' },
  high:             { bg: 'bg-red-500/10',     text: 'text-red-300',     border: 'border-red-500/20' },
  new_sparse:       { bg: 'bg-slate-500/10',   text: 'text-slate-300',   border: 'border-slate-500/20' },
  unknown:          { bg: 'bg-slate-700/50',   text: 'text-slate-300',   border: 'border-slate-600' },
};

const SEVERITY_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  high:     'bg-orange-500',
  moderate: 'bg-yellow-500',
  low:      'bg-emerald-500',
};

function seg(s: string) {
  return s?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Unknown';
}

function riskColour(score: number | null) {
  if (score === null) return 'text-slate-500';
  if (score >= 75) return 'text-red-400';
  if (score >= 50) return 'text-orange-400';
  if (score >= 25) return 'text-yellow-400';
  return 'text-emerald-400';
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 3600)  return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

export default function AiProfilingPage() {
  const [clusters,  setClusters]  = useState<Cluster[]>([]);
  const [patterns,  setPatterns]  = useState<Pattern[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [running,   setRunning]   = useState(false);
  const [runResult, setRunResult] = useState<string | null>(null);
  const [tab,       setTab]       = useState<'clusters' | 'patterns'>('clusters');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, pRes] = await Promise.all([
        fetch('/api/ai-profiling/clusters'),
        fetch('/api/ai-profiling/patterns'),
      ]);
      const [cJson, pJson] = await Promise.all([cRes.json(), pRes.json()]);
      setClusters(cJson.data ?? []);
      setPatterns(pJson.data ?? []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function triggerRun() {
    setRunning(true);
    setRunResult(null);
    try {
      const res = await fetch('/api/ai-profiling/run', { method: 'POST' });
      const json = await res.json();
      if (res.ok) {
        setRunResult('Profiling complete — ' + (json.clients_profiled ?? 0) + ' clients clustered, ' + (json.patterns_detected ?? 0) + ' patterns detected.');
        await fetchAll();
      } else {
        setRunResult('Run failed — check backend logs.');
      }
    } catch {
      setRunResult('Network error — check API connection.');
    } finally {
      setRunning(false);
    }
  }

  const activePatterns   = patterns.filter(p => p.is_active);
  const criticalPatterns = activePatterns.filter(p => p.severity === 'critical' || p.severity === 'high');
  const totalClients     = clusters.reduce((s, c) => s + c.client_count, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Client Profiling</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Cross-client pattern detection · Segment clustering · Proactive recommendations
          </p>
        </div>
        <button
          onClick={triggerRun}
          disabled={running}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium rounded transition-colors"
        >
          {running ? 'Running…' : 'Run profiling pass'}
        </button>
      </div>

      {runResult && (
        <div className="mb-4 bg-teal-500/10 border border-teal-500/20 rounded-lg px-4 py-3 text-teal-300 text-sm">
          {runResult}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-slate-400 text-xs uppercase tracking-wide">Clients profiled</p>
          <p className="text-white text-2xl font-bold mt-1">{totalClients}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-slate-400 text-xs uppercase tracking-wide">Clusters</p>
          <p className="text-white text-2xl font-bold mt-1">{clusters.length}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-slate-400 text-xs uppercase tracking-wide">Active patterns</p>
          <p className="text-white text-2xl font-bold mt-1">{activePatterns.length}</p>
        </div>
        <div className={(criticalPatterns.length > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-slate-800 border-slate-700') + ' rounded-lg p-4 border'}>
          <p className={(criticalPatterns.length > 0 ? 'text-red-400' : 'text-slate-400') + ' text-xs uppercase tracking-wide'}>
            Critical / High
          </p>
          <p className={(criticalPatterns.length > 0 ? 'text-red-300' : 'text-white') + ' text-2xl font-bold mt-1'}>
            {criticalPatterns.length}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {(['clusters', 'patterns'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={(tab === t ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600') + ' px-3 py-1.5 rounded text-xs font-medium transition-colors capitalize'}
          >
            {t === 'clusters' ? 'Clusters (' + clusters.length + ')' : 'Patterns (' + activePatterns.length + ')'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center text-slate-500 text-sm">
          Loading profiling data…
        </div>
      ) : tab === 'clusters' ? (
        clusters.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
            <p className="text-slate-400 text-sm">No clusters yet.</p>
            <p className="text-slate-600 text-xs mt-1">Click &ldquo;Run profiling pass&rdquo; to cluster all clients.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {clusters.map(cluster => {
              const colours = SEGMENT_COLOURS[cluster.segment] || SEGMENT_COLOURS.unknown;
              return (
                <div key={cluster.cluster_id} className={'rounded-lg border p-4 ' + colours.bg + ' ' + colours.border}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={'text-sm font-semibold ' + colours.text}>{cluster.segment_label || seg(cluster.segment)}</span>
                    <span className="text-xs text-slate-500">Cluster #{cluster.cluster_id}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3 text-xs">
                    <div><span className="text-slate-500">Clients</span><span className="text-white font-semibold ml-2">{cluster.client_count}</span></div>
                    <div><span className="text-slate-500">Avg risk</span><span className={'font-semibold ml-2 ' + riskColour(cluster.avg_risk_score)}>{cluster.avg_risk_score != null ? cluster.avg_risk_score.toFixed(0) : '—'}</span></div>
                    <div><span className="text-slate-500">Avg age</span><span className="text-slate-300 ml-2">{cluster.avg_device_age != null ? cluster.avg_device_age.toFixed(1) + 'y' : '—'}</span></div>
                    <div><span className="text-slate-500">Backup</span><span className="text-slate-300 ml-2">{cluster.backup_compliance_pct != null ? cluster.backup_compliance_pct.toFixed(0) + '%' : '—'}</span></div>
                    {cluster.top_os && <div className="col-span-2"><span className="text-slate-500">Top OS</span><span className="text-slate-300 ml-2">{cluster.top_os}</span></div>}
                  </div>
                  {cluster.clients?.length > 0 && (
                    <div className="space-y-1 border-t border-white/5 pt-2">
                      {cluster.clients.slice(0, 5).map(c => (
                        <div key={c.client_id} className="flex items-center justify-between">
                          <Link href={'/clients/' + c.client_id} className="text-xs text-slate-300 hover:text-white transition-colors truncate max-w-[140px]">
                            {c.client_name || c.client_id}
                          </Link>
                          <span className={'text-xs ' + riskColour(c.risk_score)}>{c.risk_score != null ? c.risk_score.toFixed(0) : '—'}</span>
                        </div>
                      ))}
                      {cluster.clients.length > 5 && <p className="text-xs text-slate-600 pt-0.5">+{cluster.clients.length - 5} more</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        activePatterns.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
            <p className="text-slate-400 text-sm">No active patterns detected.</p>
            <p className="text-slate-600 text-xs mt-1">Run a profiling pass to detect cross-client patterns.</p>
          </div>
        ) : (
          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700">
              <p className="text-sm font-medium text-white">{activePatterns.length} active pattern{activePatterns.length !== 1 ? 's' : ''}</p>
            </div>
            <ul className="divide-y divide-slate-700/50">
              {activePatterns.map(pattern => (
                <li key={pattern.id} className="px-4 py-3 hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="mt-1.5 flex-shrink-0">
                      <span className={'block w-2 h-2 rounded-full ' + (SEVERITY_DOT[pattern.severity] || 'bg-slate-500')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-white">{pattern.title}</span>
                        <span className="text-xs text-slate-500 capitalize">{pattern.pattern_type?.replace(/_/g, ' ')}</span>
                        <span className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">{pattern.affected_client_count} client{pattern.affected_client_count !== 1 ? 's' : ''}</span>
                      </div>
                      <p className="text-sm text-slate-400 mt-0.5 leading-snug">{pattern.description}</p>
                      {pattern.recommendation && <p className="text-xs text-teal-400 mt-1">→ {pattern.recommendation}</p>}
                    </div>
                    <span className="text-xs text-slate-600 flex-shrink-0 mt-0.5">{timeAgo(pattern.detected_at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )
      )}
    </div>
  );
}
