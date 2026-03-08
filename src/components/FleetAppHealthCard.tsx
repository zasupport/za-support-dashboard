'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type FleetAppHealth = {
  total_devices_graded: number;
  grade_counts: { A: number; B: number; C: number; D: number; F: number };
  needs_attention: number;
  total_crashes_7d: number;
  total_unsigned_apps: number;
  pct_healthy: number;
};

const GRADE_COLOR: Record<string, string> = {
  A: 'text-green-400',
  B: 'text-teal-400',
  C: 'text-yellow-400',
  D: 'text-orange-400',
  F: 'text-red-400',
};

export function FleetAppHealthCard() {
  const [data, setData] = useState<FleetAppHealth | null>(null);

  useEffect(() => {
    fetch('/api/diagnostics/fleet/app-health')
      .then(r => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data || !data.total_devices_graded) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs text-slate-400">App Health Fleet</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 text-xs">No Phase 23 data yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs text-slate-400 flex items-center justify-between">
          <span>App Health Fleet</span>
          <Link href="/devices" className="text-teal-400 hover:text-teal-300 text-xs font-normal">
            View →
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Headline: pct healthy */}
        <div className="flex items-baseline gap-1 mb-3">
          <span className={`text-3xl font-bold ${data.pct_healthy >= 80 ? 'text-green-400' : data.pct_healthy >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
            {data.pct_healthy}%
          </span>
          <span className="text-slate-400 text-xs">healthy</span>
        </div>

        {/* Grade distribution */}
        <div className="flex gap-3 mb-3">
          {(['A', 'B', 'C', 'D', 'F'] as const).map(g => (
            <div key={g} className="text-center">
              <p className={`text-sm font-bold ${GRADE_COLOR[g]}`}>{data.grade_counts[g] ?? 0}</p>
              <p className={`text-[10px] ${GRADE_COLOR[g]}`}>{g}</p>
            </div>
          ))}
        </div>

        {/* Flags */}
        <div className="space-y-1">
          {data.needs_attention > 0 && (
            <p className="text-xs text-red-400">{data.needs_attention} device{data.needs_attention !== 1 ? 's' : ''} need attention (D/F)</p>
          )}
          {data.total_crashes_7d > 0 && (
            <p className="text-xs text-orange-400">{data.total_crashes_7d} crash{data.total_crashes_7d !== 1 ? 'es' : ''} /7d fleet-wide</p>
          )}
          {data.total_unsigned_apps > 0 && (
            <p className="text-xs text-yellow-500">{data.total_unsigned_apps} unsigned app{data.total_unsigned_apps !== 1 ? 's' : ''} detected</p>
          )}
          {data.needs_attention === 0 && data.total_crashes_7d === 0 && (
            <p className="text-xs text-green-400">Fleet app health nominal</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
