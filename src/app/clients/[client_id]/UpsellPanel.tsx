'use client';

import { useState, useEffect } from 'react';

type Recommendation = {
  id: string;
  product_name: string;
  product_category?: string;
  trigger_value?: string;
  rand_value: number;
  roi_description: string | null;
  status: string;
  created_at: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  repair:    'bg-orange-500/20 text-orange-400 border-orange-500/30',
  warranty:  'bg-blue-500/20 text-blue-400 border-blue-500/30',
  accessory: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  service:   'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const STATUS_CONFIG: Record<string, { label: string; next: string; nextLabel: string; color: string }> = {
  pending:   { label: 'Pending',   next: 'presented', nextLabel: 'Mark Presented', color: 'text-amber-400' },
  presented: { label: 'Presented', next: 'accepted',  nextLabel: 'Mark Accepted',  color: 'text-blue-400' },
  accepted:  { label: 'Accepted',  next: 'converted', nextLabel: 'Mark Converted', color: 'text-teal-400' },
  converted: { label: 'Converted', next: '',           nextLabel: '',               color: 'text-emerald-400' },
  declined:  { label: 'Declined',  next: '',           nextLabel: '',               color: 'text-slate-500' },
};

export function UpsellPanel({ clientId }: { clientId: string }) {
  const [recs, setRecs]       = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/sales/recommendations?client_id=${clientId}`)
      .then(r => r.json())
      .then(d => setRecs(Array.isArray(d) ? d : (d.recommendations || d.data || [])))
      .catch(() => setRecs([]))
      .finally(() => setLoading(false));
  }, [clientId]);

  const updateStatus = async (recId: string, status: string) => {
    setUpdating(recId);
    try {
      const res = await fetch('/api/sales/recommendations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rec_id: recId, status }),
      });
      if (res.ok) {
        setRecs(prev => prev.map(r => r.id === recId ? { ...r, status } : r));
      }
    } finally {
      setUpdating(null);
    }
  };

  const active = recs.filter(r => r.status !== 'declined' && r.status !== 'converted');
  const converted = recs.filter(r => r.status === 'converted');
  const declined  = recs.filter(r => r.status === 'declined');

  if (loading) return null;
  if (recs.length === 0) return null;

  const totalValue = active.reduce((s, r) => s + (r.rand_value || 0), 0);

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-white">Upsell Opportunities</p>
          {active.length > 0 && (
            <p className="text-xs text-slate-400 mt-0.5">
              {active.length} recommendation{active.length !== 1 ? 's' : ''} · R {totalValue.toLocaleString('en-ZA')} potential
            </p>
          )}
        </div>
        {converted.length > 0 && (
          <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            {converted.length} converted
          </span>
        )}
      </div>

      <div className="space-y-2">
        {active.map(rec => {
          const cfg = STATUS_CONFIG[rec.status] ?? STATUS_CONFIG.pending;
          const catColor = CATEGORY_COLORS[rec.product_category ?? ''] ?? 'bg-slate-500/20 text-slate-400 border-slate-500/30';
          return (
            <div key={rec.id} className="bg-slate-700/40 rounded-lg p-3 border border-slate-600/40">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-medium text-white">{rec.product_name}</span>
                    <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  {rec.trigger_value && (
                    <p className="text-xs text-slate-400 leading-snug">{rec.trigger_value}</p>
                  )}
                  {rec.roi_description && (
                    <p className="text-xs text-teal-400 mt-1">{rec.roi_description}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-white">
                    R {(rec.rand_value || 0).toLocaleString('en-ZA')}
                  </p>
                  {cfg.next && (
                    <button
                      onClick={() => updateStatus(rec.id, cfg.next)}
                      disabled={updating === rec.id}
                      className="mt-1 text-xs text-slate-400 hover:text-white border border-slate-600 hover:border-slate-400 px-2 py-0.5 rounded transition-colors disabled:opacity-50"
                    >
                      {updating === rec.id ? '…' : cfg.nextLabel}
                    </button>
                  )}
                  <button
                    onClick={() => updateStatus(rec.id, 'declined')}
                    disabled={updating === rec.id}
                    className="mt-1 ml-1 text-xs text-slate-600 hover:text-red-400 transition-colors"
                    title="Mark as declined"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {declined.length > 0 && (
          <details className="mt-2">
            <summary className="text-xs text-slate-600 cursor-pointer hover:text-slate-400">
              {declined.length} declined
            </summary>
            <div className="mt-2 space-y-1">
              {declined.map(rec => (
                <div key={rec.id} className="flex items-center justify-between px-3 py-2 rounded bg-slate-700/20 opacity-50">
                  <span className="text-xs text-slate-500">{rec.product_name}</span>
                  <span className="text-xs text-slate-600">R {(rec.rand_value || 0).toLocaleString('en-ZA')}</span>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
