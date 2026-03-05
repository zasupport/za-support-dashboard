import { fetchAlerts } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function AlertsPage() {
  const alerts = await fetchAlerts(50);
  const list = Array.isArray(alerts) ? alerts : [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Alerts</h1>
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-base">{list.length} recent alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-slate-400 text-sm">No alerts</p>
          ) : (
            <div className="space-y-2">
              {list.map((a: any, i: number) => (
                <div key={i} className="py-2 border-b border-slate-700/50 last:border-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-white">{a.title || a.message || a.type}</p>
                      <p className="text-xs text-slate-400">{a.device_id || a.serial} · {a.client_id}</p>
                      <p className="text-xs text-slate-500">
                        {a.created_at ? new Date(a.created_at).toLocaleString('en-ZA') : '—'}
                      </p>
                    </div>
                    <Badge variant={a.severity === 'critical' ? 'destructive' : 'secondary'} className="ml-4 shrink-0 text-xs">
                      {a.severity || 'info'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
