/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type DashboardStats = {
  total_devices_scanned: number;
  total_scans_run: number;
  total_findings: number;
  active_threats: number;
  confirmed_malicious_total: number;
  devices_at_critical_risk: number;
  most_common_categories: Record<string, number>;
  most_common_mitre_techniques: Record<string, number>;
  last_scan_at?: string;
  provider_health: Record<string, unknown>;
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-yellow-400',
  low: 'text-green-400',
};

export function BreachScannerClient() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/breach-scanner')
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => setError('Failed to load breach scanner stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-slate-400 text-sm">Loading...</p>;
  if (error) return <p className="text-red-400 text-sm">{error}</p>;
  if (!stats) return <p className="text-slate-400 text-sm">No data available. Ensure consent has been granted and at least one scan completed.</p>;

  const providers = stats.provider_health as Record<string, { status: string }>;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: 'Devices Scanned', value: stats.total_devices_scanned },
          { label: 'Total Scans', value: stats.total_scans_run },
          { label: 'Total Findings', value: stats.total_findings },
          { label: 'Active Threats', value: stats.active_threats, red: stats.active_threats > 0 },
          { label: 'Confirmed Malicious', value: stats.confirmed_malicious_total, red: stats.confirmed_malicious_total > 0 },
          { label: 'Critical Risk Devices', value: stats.devices_at_critical_risk, red: stats.devices_at_critical_risk > 0 },
        ].map(({ label, value, red }) => (
          <Card key={label} className="bg-slate-800 border-slate-700">
            <CardContent className="pt-4">
              <p className="text-slate-400 text-xs mb-1">{label}</p>
              <p className={`text-2xl font-bold ${red ? 'text-red-400' : 'text-white'}`}>{value ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top categories */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white">Top Finding Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.most_common_categories).length === 0 ? (
              <p className="text-slate-400 text-xs">No findings yet.</p>
            ) : (
              <ul className="space-y-1">
                {Object.entries(stats.most_common_categories).slice(0, 8).map(([cat, count]) => (
                  <li key={cat} className="flex justify-between text-xs">
                    <span className="text-slate-300">{cat.replace(/_/g, ' ')}</span>
                    <span className="text-slate-400">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Provider health */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white">Threat Intel Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {Object.entries(providers).map(([name, info]) => {
                const s = (info as any)?.status ?? 'unknown';
                return (
                  <li key={name} className="flex justify-between text-xs">
                    <span className="text-slate-300">{name}</span>
                    <span className={s === 'ok' || s === 'ready' ? 'text-green-400' : 'text-red-400'}>
                      {s}
                    </span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>

      {stats.last_scan_at && (
        <p className="text-slate-500 text-xs">Last scan: {stats.last_scan_at?.slice(0, 19).replace('T', ' ')} UTC</p>
      )}
    </div>
  );
}
