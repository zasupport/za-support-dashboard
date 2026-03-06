'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Practice = {
  id: string;
  client_id: string;
  practice_name: string;
  specialty?: string;
  hpcsa_number?: string;
  goodx_active?: boolean;
  elixir_active?: boolean;
  healthbridge_active?: boolean;
  popia_compliant?: boolean;
  hpcsa_compliant?: boolean;
  created_at: string;
};

type Assessment = {
  id: string;
  practice_id: string;
  assessment_date: string;
  network_score?: number;
  software_score?: number;
  backup_score?: number;
  overall_risk?: string;
  recommendations?: string[];
};

type Compliance = {
  popia_score: number;
  hpcsa_score: number;
  overall_compliant: boolean;
  gaps: string[];
};

const riskColour: Record<string, string> = {
  LOW:      'text-green-400',
  MODERATE: 'text-amber-400',
  HIGH:     'text-orange-400',
  CRITICAL: 'text-red-400',
};

const bool = (v?: boolean | null) =>
  v ? <span className="text-green-400">Yes</span> : <span className="text-red-400">No</span>;

export function MedicalClient() {
  const [practices, setPractices]         = useState<Practice[]>([]);
  const [selected, setSelected]           = useState<Practice | null>(null);
  const [assessments, setAssessments]     = useState<Assessment[]>([]);
  const [compliance, setCompliance]       = useState<Compliance | null>(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetch('/api/medical/practices')
      .then(r => r.ok ? r.json() : [])
      .then(d => setPractices(Array.isArray(d) ? d : d.data ?? []))
      .catch(() => setError('Medical Practice API not reachable — deploy may be pending'))
      .finally(() => setLoading(false));
  }, []);

  function selectPractice(p: Practice) {
    setSelected(p);
    setDetailLoading(true);
    Promise.all([
      fetch(`/api/medical/assessments/${p.id}`).then(r => r.ok ? r.json() : []),
      fetch(`/api/medical/compliance/${p.id}`).then(r => r.ok ? r.json() : null),
    ])
      .then(([a, c]) => {
        setAssessments(Array.isArray(a) ? a : a.data ?? []);
        setCompliance(c);
      })
      .finally(() => setDetailLoading(false));
  }

  if (loading) return <p className="text-slate-500 text-sm">Loading Medical Practices…</p>;
  if (error)   return <p className="text-amber-400 text-sm">{error}</p>;

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {/* Practice list */}
      <div className="md:col-span-1 space-y-2">
        {practices.length === 0 && (
          <p className="text-slate-500 text-sm">No medical practices registered yet.</p>
        )}
        {practices.map(p => (
          <Card
            key={p.id}
            onClick={() => selectPractice(p)}
            className={`cursor-pointer transition-colors ${selected?.id === p.id ? 'bg-teal-900/40 border-teal-600' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}
          >
            <CardContent className="p-4">
              <p className="text-white text-sm font-medium leading-snug">{p.practice_name}</p>
              {p.specialty && <p className="text-slate-400 text-xs mt-0.5">{p.specialty}</p>}
              <div className="flex gap-2 mt-2">
                {p.popia_compliant != null && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${p.popia_compliant ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                    POPIA
                  </span>
                )}
                {p.hpcsa_compliant != null && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${p.hpcsa_compliant ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                    HPCSA
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail panel */}
      <div className="md:col-span-2 space-y-4">
        {!selected && (
          <p className="text-slate-600 text-sm mt-8 text-center">Select a practice to view details</p>
        )}
        {selected && (
          <>
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-base">{selected.practice_name}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                <div><span className="text-slate-400">Specialty</span><p className="text-white">{selected.specialty ?? '—'}</p></div>
                <div><span className="text-slate-400">HPCSA No.</span><p className="text-white">{selected.hpcsa_number ?? '—'}</p></div>
                <div><span className="text-slate-400">GoodX</span><p>{bool(selected.goodx_active)}</p></div>
                <div><span className="text-slate-400">Elixir</span><p>{bool(selected.elixir_active)}</p></div>
                <div><span className="text-slate-400">HealthBridge</span><p>{bool(selected.healthbridge_active)}</p></div>
              </CardContent>
            </Card>

            {compliance && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-sm">Compliance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-6">
                    <div>
                      <p className="text-xs text-slate-400">POPIA Score</p>
                      <p className="text-xl font-bold text-white">{compliance.popia_score}<span className="text-xs text-slate-500">/100</span></p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">HPCSA Score</p>
                      <p className="text-xl font-bold text-white">{compliance.hpcsa_score}<span className="text-xs text-slate-500">/100</span></p>
                    </div>
                  </div>
                  {compliance.gaps.length > 0 && (
                    <div>
                      <p className="text-xs text-red-400 font-medium mb-1">Compliance Gaps</p>
                      <ul className="space-y-1">
                        {compliance.gaps.map((g, i) => (
                          <li key={i} className="text-xs text-slate-300 flex gap-2">
                            <span className="text-red-400">•</span>{g}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm">Assessment History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {detailLoading && <p className="text-slate-500 text-xs">Loading…</p>}
                {!detailLoading && assessments.length === 0 && (
                  <p className="text-slate-500 text-xs">No assessments recorded yet.</p>
                )}
                {assessments.map(a => (
                  <div key={a.id} className="border border-slate-700 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white text-xs font-medium">
                        {new Date(a.assessment_date).toLocaleDateString('en-ZA')}
                      </p>
                      {a.overall_risk && (
                        <span className={`text-xs font-semibold ${riskColour[a.overall_risk] ?? 'text-slate-400'}`}>
                          {a.overall_risk}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {a.network_score != null && <div><span className="text-slate-400">Network</span><p className="text-white">{a.network_score}/100</p></div>}
                      {a.software_score != null && <div><span className="text-slate-400">Software</span><p className="text-white">{a.software_score}/100</p></div>}
                      {a.backup_score != null && <div><span className="text-slate-400">Backup</span><p className="text-white">{a.backup_score}/100</p></div>}
                    </div>
                    {a.recommendations && a.recommendations.length > 0 && (
                      <ul className="mt-2 space-y-0.5">
                        {a.recommendations.slice(0, 3).map((r, i) => (
                          <li key={i} className="text-xs text-slate-400">• {r}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
