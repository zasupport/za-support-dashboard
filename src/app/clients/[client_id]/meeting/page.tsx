'use client';

/**
 * Client Meeting View — /clients/[client_id]/meeting
 *
 * Full-screen, mobile-optimised value presentation that Courtney shows to
 * clients during site visits and meetings. No login required on the client's
 * side — Courtney opens this on her own phone.
 *
 * Shows: health grade, ROI value, automated actions, top risks, upsell
 * recommendations, and one-tap WhatsApp send of the client's portal link.
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type HealthSummary = {
  client_id:    string;
  client_name:  string;
  status:       string;
  health_grade: string;
  device: {
    model?:          string;
    macos?:          string;
    risk_score?:     number;
    risk_level?:     string;
    days_since_scan?: number;
    last_scan?:      string;
  };
  roi: {
    lifetime_value_zar:   number;
    lifetime_roi_ratio:   number;
    automated_actions:    number;
    recent_interventions: Array<{ description: string; financial_value_rand?: number; detected_at?: string }>;
    pitch:                string;
  };
  upsell: {
    pending_count:    number;
    total_value_zar:  number;
    recommendations:  Array<{ product: string; reason: string; value_zar: number }>;
  };
  share_url?:   string;
  generated_at: string;
};

const GRADE_COLOR: Record<string, string> = {
  A: 'text-green-400',
  B: 'text-teal-400',
  C: 'text-yellow-400',
  D: 'text-orange-400',
  F: 'text-red-400',
};

const RISK_COLOR: Record<string, string> = {
  low:      'bg-green-900/40 text-green-300 border-green-700/50',
  moderate: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/50',
  high:     'bg-orange-900/40 text-orange-300 border-orange-700/50',
  critical: 'bg-red-900/40 text-red-300 border-red-700/50',
};

function formatRand(v: number) {
  if (v >= 1_000_000) return `R ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `R ${(v / 1_000).toFixed(0)}k`;
  return `R ${v.toFixed(0)}`;
}

export default function MeetingPage() {
  const params      = useParams();
  const clientId    = Array.isArray(params.client_id) ? params.client_id[0] : params.client_id;

  const [data,     setData]     = useState<HealthSummary | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [sending,  setSending]  = useState(false);
  const [sent,     setSent]     = useState(false);
  const [portalUrl, setPortalUrl] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/reports/health-summary/${clientId}`);
      if (!res.ok) throw new Error(`${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(`Could not load health summary — ${e}`);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  async function generateAndSend() {
    if (!data) return;
    setSending(true);
    try {
      const pr = await fetch(`/api/clients/${clientId}/portal-link`);
      if (!pr.ok) throw new Error('Portal link failed');
      const pd = await pr.json();
      setPortalUrl(pd.portal_url);
      setSent(true);
    } catch {
      alert('Could not generate portal link — check network connection');
    } finally {
      setSending(false);
    }
  }

  function buildWhatsAppUrl() {
    if (!data || !portalUrl) return '';
    const name = data.client_name.split(' ')[0];
    const roiLine = data.roi.lifetime_value_zar > 0
      ? `\n\nZA Support has protected R ${data.roi.lifetime_value_zar.toLocaleString('en-ZA')} in value for you with a ${data.roi.lifetime_roi_ratio.toFixed(0)}:1 return on investment.`
      : '';
    const text = encodeURIComponent(
      `Hi ${name}, I hope you're well.\n\nYour ZA Support Health Check dashboard is ready — it shows your device health, everything we monitor, and what we've done automatically for your IT security.${roiLine}\n\nView your dashboard:\n${portalUrl}\n\nFeel free to reach out if you have any questions.\n\nKind regards,\nCourtney Bentley\nZA Support\n064 529 5863`
    );
    return `https://wa.me/?text=${text}`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Loading health summary…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-red-400">{error || 'No data'}</p>
          <button onClick={load} className="text-sm text-teal-400 border border-teal-700 px-4 py-2 rounded">Retry</button>
        </div>
      </div>
    );
  }

  const grade     = data.health_grade || 'C';
  const risk      = (data.device.risk_level || 'moderate').toLowerCase();
  const riskClass = RISK_COLOR[risk] || RISK_COLOR.moderate;
  const lifetimeVal = data.roi.lifetime_value_zar || 0;
  const roiRatio    = data.roi.lifetime_roi_ratio  || 0;
  const autoCount   = data.roi.automated_actions   || 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-8">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href={`/clients/${clientId}`} className="text-slate-400 text-sm hover:text-white">← Back</Link>
        <span className="text-xs text-slate-500">Meeting View</span>
        <button onClick={load} className="text-xs text-teal-400 hover:text-teal-300">Refresh</button>
      </div>

      <div className="px-4 pt-6 space-y-5 max-w-lg mx-auto">

        {/* Client name + grade */}
        <div className="text-center space-y-1">
          <p className="text-slate-400 text-sm uppercase tracking-widest">Health Check</p>
          <h1 className="text-2xl font-bold text-white">{data.client_name}</h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className={`text-5xl font-black ${GRADE_COLOR[grade] || 'text-slate-300'}`}>{grade}</span>
            <div className="text-left">
              <p className="text-xs text-slate-500">Health Grade</p>
              <span className={`text-xs px-2 py-0.5 rounded border capitalize ${riskClass}`}>
                {risk} risk
              </span>
            </div>
          </div>
        </div>

        {/* ROI hero card */}
        {lifetimeVal > 0 && (
          <div className="rounded-2xl bg-gradient-to-br from-teal-900/60 to-slate-900 border border-teal-700/40 p-5">
            <p className="text-xs text-teal-400 uppercase tracking-wide mb-1">ZA Support ROI</p>
            <p className="text-4xl font-black text-white">{formatRand(lifetimeVal)}</p>
            <p className="text-sm text-teal-300 mt-0.5">in risk exposure identified &amp; addressed</p>
            <div className="mt-3 flex gap-4">
              {roiRatio > 0 && (
                <div>
                  <p className="text-2xl font-bold text-green-400">{roiRatio.toFixed(0)}:1</p>
                  <p className="text-xs text-slate-400">return on investment</p>
                </div>
              )}
              {autoCount > 0 && (
                <div>
                  <p className="text-2xl font-bold text-teal-300">{autoCount}</p>
                  <p className="text-xs text-slate-400">automated actions taken</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Device info */}
        {data.device.model && (
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-500">Device</p>
              <p className="text-sm text-white font-medium">{data.device.model}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">macOS</p>
              <p className="text-sm text-white font-medium">{data.device.macos || '—'}</p>
            </div>
            {data.device.days_since_scan !== undefined && (
              <div>
                <p className="text-xs text-slate-500">Last Scan</p>
                <p className={`text-sm font-medium ${(data.device.days_since_scan || 0) > 30 ? 'text-orange-400' : 'text-green-400'}`}>
                  {data.device.days_since_scan === 0 ? 'Today' : `${data.device.days_since_scan}d ago`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Recent automated interventions */}
        {data.roi.recent_interventions?.length > 0 && (
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">
              What ZA Support Did Automatically
            </p>
            <div className="space-y-2">
              {data.roi.recent_interventions.map((a, i) => (
                <div key={i} className="flex items-start justify-between gap-2">
                  <p className="text-sm text-slate-300 flex-1">{a.description}</p>
                  {(a.financial_value_rand || 0) > 0 && (
                    <span className="text-xs text-green-400 shrink-0 font-mono">
                      {formatRand(a.financial_value_rand!)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upsell recommendations */}
        {data.upsell.recommendations?.length > 0 && (
          <div className="rounded-xl bg-amber-900/20 border border-amber-700/40 p-4">
            <p className="text-xs text-amber-400 uppercase tracking-wide mb-3">
              Recommended for {data.client_name.split(' ')[0]}
            </p>
            <div className="space-y-3">
              {data.upsell.recommendations.map((r, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white">{r.product}</p>
                    {r.value_zar > 0 && (
                      <span className="text-xs text-amber-400 font-mono">{formatRand(r.value_zar)}</span>
                    )}
                  </div>
                  {r.reason && <p className="text-xs text-slate-400 mt-0.5">{r.reason}</p>}
                </div>
              ))}
            </div>
            {data.upsell.total_value_zar > 0 && (
              <p className="text-xs text-amber-300 mt-3 pt-3 border-t border-amber-700/30">
                Total upsell opportunity: {formatRand(data.upsell.total_value_zar)}
              </p>
            )}
          </div>
        )}

        {/* ROI pitch line */}
        {data.roi.pitch && (
          <div className="rounded-xl bg-teal-900/20 border border-teal-700/30 px-4 py-3">
            <p className="text-sm text-teal-300 text-center font-medium italic">"{data.roi.pitch}"</p>
          </div>
        )}

        {/* CTA — Send portal to client */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-3">
          <p className="text-xs text-slate-400 text-center">Send {data.client_name.split(' ')[0]} their personal dashboard</p>

          {!sent ? (
            <button
              onClick={generateAndSend}
              disabled={sending}
              className="w-full py-3 rounded-xl bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
            >
              {sending ? 'Generating link…' : 'Generate & Send via WhatsApp'}
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-green-400 text-center">Portal link ready</p>
              <a
                href={buildWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.523 3.659 1.438 5.168L2.18 21.454l4.394-1.24A9.954 9.954 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.946 7.946 0 01-4.076-1.12l-.292-.174-3.032.856.866-3.163-.191-.307A7.944 7.944 0 014 12c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8z"/>
                </svg>
                Open WhatsApp to {data.client_name.split(' ')[0]}
              </a>
              <button
                onClick={() => { setSent(false); setPortalUrl(''); }}
                className="w-full py-2 text-xs text-slate-500 hover:text-slate-300"
              >
                Reset
              </button>
            </div>
          )}

          {data.share_url && (
            <a
              href={data.share_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-xs text-teal-400 hover:text-teal-300 mt-1"
            >
              View latest CyberPulse PDF →
            </a>
          )}
        </div>

        {/* Generate proposal link */}
        <Link
          href={`/clients/${clientId}#proposal`}
          className="block text-center py-3 rounded-xl border border-teal-700/40 text-teal-400 hover:bg-teal-900/20 text-sm font-medium transition-colors"
        >
          Generate Proposal for {data.client_name.split(' ')[0]} →
        </Link>

        <p className="text-center text-xs text-slate-600">
          Updated {new Date(data.generated_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
