import Link from 'next/link';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ISPEntry {
  isp_name?: string;
  name?: string;
  status: string;
  latency_ms?: number | null;
  packet_loss?: number | null;
  last_checked?: string | null;
}

function statusVariant(status: string): 'default' | 'destructive' | 'secondary' {
  if (status === 'operational') return 'default';
  if (status === 'outage') return 'destructive';
  return 'secondary';
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'operational') return <Wifi size={13} className="text-green-400 shrink-0" />;
  if (status === 'outage') return <WifiOff size={13} className="text-red-400 shrink-0" />;
  return <AlertTriangle size={13} className="text-yellow-400 shrink-0" />;
}

interface ISPStatusPanelProps {
  ispList: ISPEntry[];
  maxRows?: number;
}

export function ISPStatusPanel({ ispList, maxRows = 10 }: ISPStatusPanelProps) {
  const list = Array.isArray(ispList) ? ispList : [];

  const operational = list.filter(i => i.status === 'operational').length;
  const degraded    = list.filter(i => i.status === 'degraded').length;
  const outage      = list.filter(i => i.status === 'outage').length;
  const issues      = degraded + outage;

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Wifi size={14} />
            ISP Status
          </CardTitle>
          <Link href="/isp" className="text-xs text-teal-400 hover:text-teal-300 transition-colors">
            View all →
          </Link>
        </div>

        {/* Summary pill row */}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs text-green-400">{operational} up</span>
          {degraded > 0 && <span className="text-xs text-yellow-400">{degraded} degraded</span>}
          {outage > 0 && <span className="text-xs text-red-400">{outage} outage</span>}
          {issues === 0 && list.length > 0 && (
            <span className="text-xs text-slate-500">All ISPs operational</span>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {list.length === 0 ? (
          <p className="text-slate-400 text-sm">No ISP data available.</p>
        ) : (
          <div className="space-y-2">
            {list.slice(0, maxRows).map((isp, i) => {
              const name = isp.isp_name || isp.name || `ISP #${i + 1}`;
              const hasIssue = isp.status !== 'operational';

              return (
                <div
                  key={i}
                  className={`flex items-center justify-between gap-3 rounded px-2 py-1.5 text-sm ${
                    hasIssue ? 'bg-red-950/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <StatusIcon status={isp.status} />
                    <span className={`truncate ${hasIssue ? 'text-white font-medium' : 'text-slate-300'}`}>
                      {name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isp.latency_ms != null && (
                      <span
                        className={`text-xs tabular-nums ${
                          isp.latency_ms > 200 ? 'text-yellow-400' : 'text-slate-500'
                        }`}
                      >
                        {isp.latency_ms}ms
                      </span>
                    )}
                    <Badge variant={statusVariant(isp.status)} className="text-xs">
                      {isp.status}
                    </Badge>
                  </div>
                </div>
              );
            })}

            {list.length > maxRows && (
              <p className="text-xs text-slate-500 pt-1 text-right">
                +{list.length - maxRows} more ·{' '}
                <Link href="/isp" className="text-teal-400 hover:text-teal-300">
                  See full report
                </Link>
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
