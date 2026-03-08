'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface SimilarClient {
  client_id: string;
  cluster_label: string;
  avg_risk_score: number;
  backup_compliance: number;
  avg_device_age_yrs: number;
  automated_actions_30d: number;
}

interface Pattern {
  id: string;
  pattern_type: string;
  title: string;
  description: string;
  severity: string;
  affected_count: number;
}

interface AIProfile {
  cluster_label: string;
  cluster_confidence: number;
  segment: string;
  avg_risk_score: number;
  backup_compliance: number;
  automated_actions_30d: number;
  roi_ratio_current: number;
}

interface Props {
  clientId: string;
}

function severityColour(s: string) {
  if (s === 'critical') return 'bg-red-900 text-red-300 border-red-700';
  if (s === 'high') return 'bg-orange-900 text-orange-300 border-orange-700';
  return 'bg-yellow-900 text-yellow-300 border-yellow-700';
}

export function SimilarInsights({ clientId }: Props) {
  const [data, setData] = useState<{ profile: AIProfile | null; similar: SimilarClient[]; patterns: Pattern[] } | null>(null);

  useEffect(() => {
    fetch(`/api/ai-profiling/${clientId}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => null);
  }, [clientId]);

  if (!data || (!data.profile && data.similar.length === 0 && data.patterns.length === 0)) {
    return null; // no profiling data yet — section hidden until first /run
  }

  const { profile, similar, patterns } = data;

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <span className="text-teal-400">◈</span>
          AI Client Insights
          {profile && (
            <Badge className="ml-auto bg-slate-700 text-slate-300 text-xs font-normal border-slate-600">
              {profile.cluster_label}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Profile summary */}
        {profile && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-900 rounded-md p-3 text-center">
              <p className="text-slate-400 text-xs mb-1">Risk Score</p>
              <p className={`text-lg font-bold ${profile.avg_risk_score >= 70 ? 'text-red-400' : profile.avg_risk_score >= 40 ? 'text-orange-400' : 'text-green-400'}`}>
                {Math.round(profile.avg_risk_score)}
              </p>
            </div>
            <div className="bg-slate-900 rounded-md p-3 text-center">
              <p className="text-slate-400 text-xs mb-1">Backup</p>
              <p className={`text-lg font-bold ${profile.backup_compliance >= 80 ? 'text-green-400' : 'text-orange-400'}`}>
                {Math.round(profile.backup_compliance)}%
              </p>
            </div>
            <div className="bg-slate-900 rounded-md p-3 text-center">
              <p className="text-slate-400 text-xs mb-1">ROI ratio</p>
              <p className="text-lg font-bold text-teal-400">
                {profile.roi_ratio_current > 0 ? `${profile.roi_ratio_current.toFixed(1)}×` : '—'}
              </p>
            </div>
          </div>
        )}

        {/* Cross-client patterns affecting this client */}
        {patterns.length > 0 && (
          <div className="space-y-2">
            <p className="text-slate-400 text-xs uppercase tracking-wide">Shared Patterns</p>
            {patterns.map(p => (
              <div key={p.id} className={`border rounded-md p-3 text-xs ${severityColour(p.severity)}`}>
                <p className="font-medium">{p.title}</p>
                <p className="mt-1 opacity-80">{p.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Similar clients */}
        {similar.length > 0 && (
          <div className="space-y-2">
            <p className="text-slate-400 text-xs uppercase tracking-wide">Similar Clients in Cluster</p>
            {similar.map(s => (
              <Link
                key={s.client_id}
                href={`/clients/${s.client_id}`}
                className="flex items-center justify-between bg-slate-900 hover:bg-slate-700 rounded-md p-3 transition-colors group"
              >
                <div>
                  <p className="text-white text-xs font-medium group-hover:text-teal-400 transition-colors">{s.client_id}</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Risk {Math.round(s.avg_risk_score)} · Backup {Math.round(s.backup_compliance)}% · {s.automated_actions_30d} actions/30d
                  </p>
                </div>
                <span className="text-slate-600 group-hover:text-teal-400 text-xs">→</span>
              </Link>
            ))}
          </div>
        )}

        {similar.length === 0 && patterns.length === 0 && profile && (
          <p className="text-slate-500 text-xs text-center py-2">
            No cross-client patterns detected. Run profiling monthly to detect trends.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
