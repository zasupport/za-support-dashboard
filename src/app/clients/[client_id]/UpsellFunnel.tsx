'use client';

import { useState, useEffect } from 'react';

type Stage = {
  status: string;
  count: number;
  total_rand: number;
};

type Funnel = {
  stages: Stage[];
  active_value_rand: number;
  converted_value_rand: number;
};

const STAGE_CONFIG: Record<string, { label: string; dot: string; bar: string }> = {
  pending:   { label: 'Pending',   dot: 'bg-amber-400',   bar: 'bg-amber-400/20 border-amber-500/30 text-amber-300' },
  presented: { label: 'Presented', dot: 'bg-blue-400',    bar: 'bg-blue-400/20 border-blue-500/30 text-blue-300' },
  accepted:  { label: 'Accepted',  dot: 'bg-teal-400',    bar: 'bg-teal-400/20 border-teal-500/30 text-teal-300' },
  converted: { label: 'Converted', dot: 'bg-emerald-400', bar: 'bg-emerald-400/20 border-emerald-500/30 text-emerald-300' },
};

export function UpsellFunnel({ clientId }: { clientId: string }) {
  const [funnel, setFunnel] = useState<Funnel | null>(null);

  useEffect(() => {
    fetch(`/api/sales/funnel/${clientId}`)
      .then(r => r.json())
      .then(d => {
        if (d?.stages?.length) setFunnel(d);
      })
      .catch(() => {});
  }, [clientId]);

  if (!funnel) return null;

  const activeStages = funnel.stages.filter(
    s => s.status !== 'declined' && (s.count > 0 || s.status === 'pending'),
  );
  const convertedStage = funnel.stages.find(s => s.status === 'converted');
  const hasActivity = funnel.stages.some(s => s.count > 0);

  if (!hasActivity) return null;

  const maxCount = Math.max(...activeStages.map(s => s.count), 1);

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-white">Upsell Pipeline</p>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          {funnel.active_value_rand > 0 && (
            <span>R {funnel.active_value_rand.toLocaleString('en-ZA')} active</span>
          )}
          {convertedStage && convertedStage.count > 0 && (
            <span className="text-emerald-400">
              R {convertedStage.total_rand.toLocaleString('en-ZA')} converted
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {funnel.stages
          .filter(s => s.status !== 'declined')
          .map(stage => {
            const cfg = STAGE_CONFIG[stage.status];
            if (!cfg) return null;
            const pct = stage.count === 0 ? 0 : Math.max(8, (stage.count / maxCount) * 100);
            return (
              <div key={stage.status} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-20 shrink-0">{cfg.label}</span>
                <div className="flex-1 relative h-5 bg-slate-700/40 rounded overflow-hidden">
                  <div
                    className={`h-full rounded transition-all duration-500 ${cfg.dot}`}
                    style={{ width: `${pct}%`, opacity: stage.count === 0 ? 0.15 : 0.7 }}
                  />
                </div>
                <div className="w-24 shrink-0 text-right">
                  {stage.count > 0 ? (
                    <span className={`text-xs font-medium ${cfg.bar.split(' ')[2]}`}>
                      {stage.count} · R {stage.total_rand.toLocaleString('en-ZA')}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-600">—</span>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {(() => {
        const total = funnel.stages.reduce((s, r) => s + r.count, 0);
        const converted = convertedStage?.count ?? 0;
        if (total === 0 || converted === 0) return null;
        const rate = Math.round((converted / total) * 100);
        return (
          <p className="mt-3 text-xs text-slate-500">
            Conversion rate: <span className="text-emerald-400 font-medium">{rate}%</span>
          </p>
        );
      })()}
    </div>
  );
}
