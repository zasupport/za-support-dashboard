'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { AddDeviceButton } from './AddDeviceButton';

interface LifecycleDevice {
  id: string;
  display_name: string;
  device_type: string;
  make: string;
  model: string;
  serial_number?: string;
  age_years?: number;
  expected_lifespan?: number;
  lifecycle_pct?: number;
  replacement_urgency: string;
  replacement_due?: string;
  replacement_rec?: string;
  warranty_expires?: string;
  applecare_expires?: string;
  condition?: string;
  notes?: string;
}

const URGENCY: Record<string, { label: string; badge: string; row: string; dot: string }> = {
  critical: {
    label: 'CRITICAL',
    badge: 'bg-red-500/20 text-red-300 border-red-500/30',
    row:   'border-l-2 border-red-500/60',
    dot:   'bg-red-400',
  },
  overdue: {
    label: 'OVERDUE',
    badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    row:   'border-l-2 border-orange-500/60',
    dot:   'bg-orange-400',
  },
  soon: {
    label: 'SOON',
    badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    row:   'border-l-2 border-yellow-500/60',
    dot:   'bg-yellow-400',
  },
  watch: {
    label: 'WATCH',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    row:   'border-l-2 border-blue-500/60',
    dot:   'bg-blue-400',
  },
  none: {
    label: 'OK',
    badge: 'bg-green-500/20 text-green-300 border-green-500/30',
    row:   'border-l-2 border-transparent',
    dot:   'bg-green-400',
  },
};

function LifecycleBar({ pct }: { pct: number }) {
  const capped = Math.min(pct, 150);
  const pctDisplay = Math.min(capped, 100);
  const color =
    pct >= 120 ? 'bg-red-500' :
    pct >= 100 ? 'bg-orange-500' :
    pct >= 80  ? 'bg-yellow-500' :
                 'bg-emerald-500';
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 bg-slate-700 rounded-full h-1.5 overflow-hidden">
        <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${pctDisplay}%` }} />
      </div>
      <span className="text-xs text-slate-400 w-8 text-right">{Math.round(pct)}%</span>
    </div>
  );
}

export function LifecyclePanel({ clientId }: { clientId: string }) {
  const [devices, setDevices] = useState<LifecycleDevice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/lifecycle/client/${encodeURIComponent(clientId)}`)
      .then(r => r.json())
      .then(j => { setDevices(j?.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [clientId]);

  if (loading) return null;

  const critical = devices.filter(d => d.replacement_urgency === 'critical');
  const overdue  = devices.filter(d => d.replacement_urgency === 'overdue');
  const actionable = [...critical, ...overdue];

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="text-white text-sm">
          Device Lifecycle {devices.length > 0 ? `(${devices.length})` : ''}
        </CardTitle>
        <div className="flex items-center gap-3">
          <AddDeviceButton clientId={clientId} />
          <Link href="/upgrade-radar" className="text-xs text-teal-400 hover:text-teal-300">
            Fleet radar →
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-0">

        {devices.length === 0 && (
          <p className="text-slate-500 text-xs py-2 text-center">
            No devices tracked yet. Add a device to start monitoring its lifecycle.
          </p>
        )}

        {/* Upgrade call-to-action when critical/overdue devices exist */}
        {actionable.length > 0 && (
          <div className="mb-3 rounded-md border border-orange-500/40 bg-orange-500/10 px-3 py-2.5">
            <p className="text-orange-300 text-xs font-semibold mb-0.5">
              Ready for an Upgrade? {actionable.length} device{actionable.length > 1 ? 's' : ''} need{actionable.length === 1 ? 's' : ''} replacement.
            </p>
            <p className="text-orange-200/70 text-xs">
              When you buy through ZA Support: data migration + setup + Health Check active from day one.
            </p>
          </div>
        )}

        {devices.map((d) => {
          const cfg = URGENCY[d.replacement_urgency] ?? URGENCY.none;
          return (
            <div key={d.id} className={`py-2.5 border-b border-slate-700/50 last:border-0 pl-3 ${cfg.row}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                    <p className="text-sm text-slate-200 truncate">{d.display_name}</p>
                    <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded border font-medium ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 ml-3.5">
                    {d.make} {d.model}{d.serial_number ? ` · ${d.serial_number}` : ''}
                  </p>
                  {d.lifecycle_pct != null && (
                    <div className="ml-3.5 mt-1 max-w-xs">
                      <LifecycleBar pct={d.lifecycle_pct} />
                    </div>
                  )}
                  {d.replacement_rec && (
                    <p className="text-xs text-slate-400 mt-1 ml-3.5 italic">{d.replacement_rec}</p>
                  )}
                </div>
                <div className="text-right shrink-0 space-y-0.5">
                  {d.age_years != null && (
                    <p className="text-xs text-slate-400">
                      {d.age_years.toFixed(1)}y old
                      {d.expected_lifespan ? ` / ${d.expected_lifespan}y life` : ''}
                    </p>
                  )}
                  {d.replacement_due && (
                    <p className="text-xs text-slate-500">
                      Due {new Date(d.replacement_due).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                  {d.warranty_expires && (
                    <p className="text-xs text-slate-600">
                      Warranty {new Date(d.warranty_expires).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                  {d.applecare_expires && (
                    <p className="text-xs text-teal-600">
                      AppleCare {new Date(d.applecare_expires).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
