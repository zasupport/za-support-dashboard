import { fetchISPStatus } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function ISPPage() {
  const ispList = await fetchISPStatus();
  const list = Array.isArray(ispList) ? ispList : [];

  const operational = list.filter((i: any) => i.status === 'operational').length;
  const issues = list.filter((i: any) => i.status !== 'operational').length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">ISP Status</h1>
      <div className="flex gap-6 mb-6">
        <span className="text-sm text-green-400">{operational} operational</span>
        <span className="text-sm text-red-400">{issues} with issues</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map((isp: any, i: number) => (
          <Card key={i} className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-white">{isp.isp_name || isp.name}</CardTitle>
                <Badge variant={isp.status === 'operational' ? 'default' : 'destructive'}>
                  {isp.status || 'unknown'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-400">
                Last checked: {isp.last_checked ? new Date(isp.last_checked).toLocaleString('en-ZA') : '—'}
              </p>
              {isp.latency_ms && (
                <p className="text-xs text-slate-400">Latency: {isp.latency_ms}ms</p>
              )}
            </CardContent>
          </Card>
        ))}
        {list.length === 0 && (
          <p className="text-slate-400 text-sm col-span-3">No ISP data available</p>
        )}
      </div>
    </div>
  );
}
