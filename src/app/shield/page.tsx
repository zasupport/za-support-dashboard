import { fetchShieldEvents } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AutoRefresh } from '@/components/auto-refresh';

export default async function ShieldPage() {
  const events = await fetchShieldEvents(48);
  const list = Array.isArray(events) ? events : [];

  const severityVariant = (s: string): 'destructive' | 'secondary' | 'outline' => {
    if (s === 'CRITICAL' || s === 'HIGH') return 'destructive';
    if (s === 'MEDIUM') return 'secondary';
    return 'outline';
  };

  return (
    <div>
      <AutoRefresh intervalMs={30000} />
      <h1 className="text-2xl font-bold text-white mb-6">Shield Events</h1>
      <p className="text-slate-400 text-sm mb-4">Last 48 hours — {list.length} events</p>
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-4">
          {list.length === 0 ? (
            <p className="text-slate-400 text-sm">No shield events recorded</p>
          ) : (
            <div className="space-y-2">
              {list.map((e: any, i: number) => (
                <div key={i} className="flex items-start justify-between py-2 border-b border-slate-700/50 last:border-0">
                  <div>
                    <p className="text-sm text-white font-medium">{e.event_type}</p>
                    <p className="text-xs text-slate-400">{e.hostname} · {e.details}</p>
                    <p className="text-xs text-slate-500">
                      {e.timestamp ? new Date(e.timestamp).toLocaleString('en-ZA') : '—'}
                    </p>
                  </div>
                  <Badge variant={severityVariant(e.severity)} className="ml-4 shrink-0">
                    {e.severity}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
