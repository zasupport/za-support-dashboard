'use client';

import { useState, useEffect, useCallback } from 'react';

type RoiPeriod = {
  period_start: string;
  period_end: string;
  roi_ratio: number;
  total_exposure_identified: number;
  total_value_delivered: number;
  zasupport_cost_period: number;
  automated_actions_count: number;
  manual_hours_saved: number;
};

type RoiSummary = {
  client_id: string;
  lifetime_value_delivered: number;
  lifetime_exposure_identified: number;
  lifetime_roi_ratio: number;
  total_automated_actions: number;
  total_manual_hours_saved: number;
  current_period: RoiPeriod | null;
  periods: RoiPeriod[];
};

function formatRand(value: number): string {
  return `R ${value.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-700 rounded ${className ?? ''}`} />;
}

export function RoiWidget({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [data, setData] = useState<RoiSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState('');

  const fetchRoi = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/reports/roi/${clientId}`);
      if (res.status === 404) {
        setData(null);
        return;
      }
      if (!res.ok) throw new Error('Failed to load ROI data');
      const json = await res.json();
      setData(json);
    } catch {
      setError('Unable to load ROI data');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { fetchRoi(); }, [fetchRoi]);

  async function recalculate() {
    setRecalculating(true);
    try {
      await fetch(`/api/reports/roi/${clientId}`, { method: 'POST' });
      await fetchRoi();
    } catch {
      setError('Recalculation failed');
    } finally {
      setRecalculating(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-700 overflow-hidden bg-slate-800">
      {/* Header */}
      <div className="bg-teal-800 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-teal-200 text-xs font-medium uppercase tracking-wide">ZA Support ROI</p>
          <p className="text-white text-sm font-semibold">{clientName}</p>
        </div>
        <button
          onClick={recalculate}
          disabled={recalculating || loading}
          className="text-xs px-3 py-1.5 rounded bg-teal-700 hover:bg-teal-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {recalculating ? 'Recalculating…' : 'Recalculate'}
        </button>
      </div>

      <div className="p-4">
        {error && (
          <p className="text-red-400 text-xs mb-3">{error}</p>
        )}

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-5 w-24" />
            <div className="grid grid-cols-3 gap-3 mt-4">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
          </div>
        ) : data === null ? (
          <div className="py-4 text-center">
            <p className="text-slate-400 text-sm">ROI tracking active — data populates after first automated action.</p>
            <button
              onClick={recalculate}
              disabled={recalculating}
              className="mt-3 text-xs px-3 py-1.5 rounded bg-teal-700 hover:bg-teal-600 text-white font-medium transition-colors disabled:opacity-50"
            >
              {recalculating ? 'Running…' : 'Run First Calculation'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Hero numbers */}
            <div className="flex items-end gap-4">
              <div>
                <p className="text-slate-400 text-xs mb-0.5">Lifetime value delivered</p>
                <p className="text-white text-3xl font-bold leading-none">
                  {formatRand(data.lifetime_value_delivered)}
                </p>
              </div>
              {data.lifetime_roi_ratio > 0 && (
                <span className="mb-0.5 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                  {data.lifetime_roi_ratio.toFixed(1)}:1 return
                </span>
              )}
            </div>

            {/* Sub-stats row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-900/60 rounded-md p-3 text-center">
                <p className="text-slate-500 text-xs mb-1">Exposure identified</p>
                <p className="text-slate-200 text-sm font-semibold leading-tight">
                  {formatRand(data.lifetime_exposure_identified)}
                </p>
              </div>
              <div className="bg-slate-900/60 rounded-md p-3 text-center">
                <p className="text-slate-500 text-xs mb-1">Automated actions</p>
                <p className="text-white text-lg font-bold leading-tight">{data.total_automated_actions}</p>
              </div>
              <div className="bg-slate-900/60 rounded-md p-3 text-center">
                <p className="text-slate-500 text-xs mb-1">Hours saved</p>
                <p className="text-white text-lg font-bold leading-tight">
                  {data.total_manual_hours_saved.toFixed(1)}h
                </p>
              </div>
            </div>

            {/* Current period */}
            {data.current_period && (
              <div className="border border-slate-700 rounded-md p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-slate-400 text-xs font-medium">Current period</p>
                  {data.current_period.roi_ratio > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/25 font-semibold">
                      {data.current_period.roi_ratio.toFixed(1)}:1 ROI
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-xs">
                  {new Date(data.current_period.period_start).toLocaleDateString('en-ZA')}
                  {' — '}
                  {new Date(data.current_period.period_end).toLocaleDateString('en-ZA')}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Value delivered: </span>
                    <span className="text-slate-200 font-medium">{formatRand(data.current_period.total_value_delivered)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Exposure found: </span>
                    <span className="text-slate-200 font-medium">{formatRand(data.current_period.total_exposure_identified)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">ZA Support cost: </span>
                    <span className="text-slate-200 font-medium">{formatRand(data.current_period.zasupport_cost_period)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Actions: </span>
                    <span className="text-slate-200 font-medium">{data.current_period.automated_actions_count}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
