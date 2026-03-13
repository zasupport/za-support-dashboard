import Link from 'next/link';
import { HardDrive } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DedupClientRow {
  client_id: string;
  client_name?: string;
  recoverable_gb: number;
  duplicate_sets?: number;
  last_scan?: string | null;
}

interface DedupFleetSummary {
  total_recoverable_gb: number;
  clients_with_data: number;
  clients_above_threshold: number;
  rows: DedupClientRow[];
}

interface DedupSummaryPanelProps {
  summary: DedupFleetSummary | null;
}

function gbColor(gb: number) {
  if (gb >= 10) return 'text-red-400';
  if (gb >= 2)  return 'text-yellow-400';
  return 'text-slate-400';
}

export function DedupSummaryPanel({ summary }: DedupSummaryPanelProps) {
  if (!summary || summary.clients_with_data === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <HardDrive size={14} />
            Recoverable Storage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-sm">No deduplication scans available.</p>
          <p className="text-slate-500 text-xs mt-1">
            Run a scan via{' '}
            <Link href="/dedup" className="text-teal-400 hover:text-teal-300">
              Deduplication →
            </Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalGb = summary.total_recoverable_gb ?? 0;

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <HardDrive size={14} />
            Recoverable Storage
          </CardTitle>
          <Link href="/dedup" className="text-xs text-teal-400 hover:text-teal-300 transition-colors">
            Full report →
          </Link>
        </div>

        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className={`text-2xl font-bold ${gbColor(totalGb)}`}>
            {totalGb.toFixed(1)} GB
          </span>
          <span className="text-xs text-slate-500">
            across {summary.clients_with_data} client{summary.clients_with_data !== 1 ? 's' : ''}
          </span>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          {(summary.rows ?? [])
            .filter(r => r.recoverable_gb > 0)
            .sort((a, b) => b.recoverable_gb - a.recoverable_gb)
            .slice(0, 6)
            .map(row => (
              <div key={row.client_id} className="flex items-center justify-between text-sm">
                <Link
                  href={`/clients/${row.client_id}`}
                  className="text-slate-300 hover:text-white transition-colors truncate max-w-[160px]"
                >
                  {row.client_name || row.client_id}
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  {row.duplicate_sets != null && (
                    <span className="text-xs text-slate-500">{row.duplicate_sets} sets</span>
                  )}
                  <span className={`text-xs font-semibold tabular-nums ${gbColor(row.recoverable_gb)}`}>
                    {row.recoverable_gb.toFixed(1)} GB
                  </span>
                </div>
              </div>
            ))}

          {summary.clients_above_threshold > 0 && (
            <p className="text-xs text-yellow-400 pt-1 border-t border-slate-700/50">
              {summary.clients_above_threshold} client{summary.clients_above_threshold !== 1 ? 's' : ''} with &gt;1 GB recoverable — upsell opportunity
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
