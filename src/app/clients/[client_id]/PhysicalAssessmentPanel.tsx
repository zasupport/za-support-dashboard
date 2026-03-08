'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface Assessment {
  id: string;
  visit_type: string;
  status: string;
  site_address?: string;
  assessor: string;
  created_at: string;
  asset_count?: number;
  finding_count?: number;
  critical_findings?: number;
  total_financial_exposure?: number;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'text-red-400',
  high:     'text-orange-400',
  moderate: 'text-yellow-400',
  low:      'text-green-400',
};

const STATUS_BADGE: Record<string, string> = {
  in_progress: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  complete:    'bg-green-500/20 text-green-300 border-green-500/30',
  completed:   'bg-green-500/20 text-green-300 border-green-500/30',
};

export function PhysicalAssessmentPanel({ clientId }: { clientId: string }) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/physical-assessment/client/${encodeURIComponent(clientId)}`)
      .then(r => r.json())
      .then(j => { setAssessments(j?.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [clientId]);

  if (loading) return null;
  if (assessments.length === 0) return null;

  const latest = assessments[0];
  const hasCritical = (latest.critical_findings ?? 0) > 0;

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="text-white text-sm">
          Site Assessments ({assessments.length})
        </CardTitle>
        <Link href="/physical-assessment" className="text-xs text-teal-400 hover:text-teal-300">
          All assessments →
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">

        {hasCritical && (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2">
            <p className="text-red-300 text-xs font-semibold">
              {latest.critical_findings} critical finding{(latest.critical_findings ?? 0) > 1 ? 's' : ''} from last site visit
              {latest.total_financial_exposure ? ` — R ${latest.total_financial_exposure.toLocaleString('en-ZA')} exposure` : ''}
            </p>
          </div>
        )}

        {assessments.map((a) => {
          const badge = STATUS_BADGE[a.status] ?? 'bg-slate-600/40 text-slate-300 border-slate-600';
          return (
            <div key={a.id} className="py-2 border-b border-slate-700/50 last:border-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm text-slate-200 capitalize">{a.visit_type.replace(/_/g, ' ')} visit</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${badge}`}>
                      {a.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {new Date(a.created_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {a.site_address ? ` · ${a.site_address}` : ''}
                  </p>
                  <div className="flex gap-3 mt-1">
                    {a.asset_count != null && (
                      <span className="text-xs text-slate-400">{a.asset_count} asset{a.asset_count !== 1 ? 's' : ''}</span>
                    )}
                    {a.finding_count != null && a.finding_count > 0 && (
                      <span className={`text-xs ${(a.critical_findings ?? 0) > 0 ? 'text-red-400' : 'text-orange-400'}`}>
                        {a.finding_count} finding{a.finding_count !== 1 ? 's' : ''}
                        {(a.critical_findings ?? 0) > 0 ? ` (${a.critical_findings} critical)` : ''}
                      </span>
                    )}
                    {a.total_financial_exposure != null && a.total_financial_exposure > 0 && (
                      <span className="text-xs text-yellow-400">
                        R {a.total_financial_exposure.toLocaleString('en-ZA')} exposure
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
