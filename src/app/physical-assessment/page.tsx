'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

type Assessment = {
  id: string;
  client_id: string;
  client_name?: string;
  visit_type: string;
  status: string;
  site_address: string | null;
  assessor: string;
  asset_count: number;
  finding_count: number;
  critical_findings: number;
  total_financial_exposure: number;
  created_at: string;
  completed_at: string | null;
};

type Meta = { total: number };

const STATUS_COLOURS: Record<string, string> = {
  in_progress: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  complete:    'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  draft:       'bg-slate-700 text-slate-400 border-slate-600',
};

function formatRand(v: number) {
  if (v >= 1_000_000) return 'R ' + (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000)     return 'R ' + Math.round(v / 1_000) + 'k';
  return 'R ' + v.toFixed(0);
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function PhysicalAssessmentPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [meta,        setMeta]        = useState<Meta>({ total: 0 });
  const [loading,     setLoading]     = useState(true);
  const [showNew,     setShowNew]     = useState(false);
  const [creating,    setCreating]    = useState(false);
  const [newForm, setNewForm] = useState({
    client_id: '',
    visit_type: 'initial',
    site_address: '',
    notes: '',
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/physical-assessment/list');
      const json = await res.json();
      setAssessments(json.data ?? []);
      setMeta(json.meta ?? { total: 0 });
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function createAssessment() {
    if (!newForm.client_id.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/physical-assessment/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id:    newForm.client_id.trim(),
          visit_type:   newForm.visit_type,
          site_address: newForm.site_address || null,
          assessor:     'Courtney Bentley',
          notes:        newForm.notes || null,
        }),
      });
      if (res.ok) {
        setShowNew(false);
        setNewForm({ client_id: '', visit_type: 'initial', site_address: '', notes: '' });
        await fetchAll();
      }
    } catch { /* silent */ } finally {
      setCreating(false);
    }
  }

  const totalExposure  = assessments.reduce((s, a) => s + (a.total_financial_exposure || 0), 0);
  const criticalCount  = assessments.reduce((s, a) => s + (a.critical_findings || 0), 0);
  const inProgress     = assessments.filter(a => a.status === 'in_progress').length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Physical Assessments</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Site visit asset registers · Security findings · Red-team results
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded transition-colors"
        >
          + New assessment
        </button>
      </div>

      {/* New assessment form */}
      {showNew && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-white mb-3">New site visit assessment</p>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Client ID *</label>
              <input
                value={newForm.client_id}
                onChange={e => setNewForm(f => ({ ...f, client_id: e.target.value }))}
                placeholder="e.g. dr-evan-shoul"
                className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded px-3 py-1.5 outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Visit type</label>
              <select
                value={newForm.visit_type}
                onChange={e => setNewForm(f => ({ ...f, visit_type: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded px-3 py-1.5 outline-none focus:border-teal-500"
              >
                <option value="initial">Initial assessment</option>
                <option value="followup">Follow-up</option>
                <option value="audit">Security audit</option>
                <option value="red_team">Red team</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Site address</label>
              <input
                value={newForm.site_address}
                onChange={e => setNewForm(f => ({ ...f, site_address: e.target.value }))}
                placeholder="e.g. 1 Hyde Park Lane, Johannesburg"
                className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded px-3 py-1.5 outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Notes</label>
              <input
                value={newForm.notes}
                onChange={e => setNewForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Optional pre-visit notes"
                className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded px-3 py-1.5 outline-none focus:border-teal-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={createAssessment}
              disabled={creating || !newForm.client_id.trim()}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm rounded transition-colors"
            >
              {creating ? 'Creating…' : 'Create assessment'}
            </button>
            <button
              onClick={() => setShowNew(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-slate-400 text-xs uppercase tracking-wide">Assessments</p>
          <p className="text-white text-2xl font-bold mt-1">{meta.total}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-slate-400 text-xs uppercase tracking-wide">In progress</p>
          <p className="text-amber-300 text-2xl font-bold mt-1">{inProgress}</p>
        </div>
        <div className={(criticalCount > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-slate-800 border-slate-700') + ' rounded-lg p-4 border'}>
          <p className={(criticalCount > 0 ? 'text-red-400' : 'text-slate-400') + ' text-xs uppercase tracking-wide'}>Critical findings</p>
          <p className={(criticalCount > 0 ? 'text-red-300' : 'text-white') + ' text-2xl font-bold mt-1'}>{criticalCount}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-slate-400 text-xs uppercase tracking-wide">Total exposure</p>
          <p className="text-teal-400 text-2xl font-bold mt-1">{totalExposure > 0 ? formatRand(totalExposure) : '—'}</p>
        </div>
      </div>

      {/* Assessment list */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
          <p className="text-sm font-medium text-white">{loading ? 'Loading…' : assessments.length + ' assessment' + (assessments.length !== 1 ? 's' : '')}</p>
          <button onClick={fetchAll} className="text-xs text-slate-400 hover:text-white transition-colors">Refresh</button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading assessments…</div>
        ) : assessments.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 text-sm">No assessments yet.</p>
            <p className="text-slate-600 text-xs mt-1">Create one for your next site visit — records assets and security findings.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-700/50">
            {assessments.map(assessment => (
              <li key={assessment.id} className="px-4 py-4 hover:bg-slate-700/20 transition-colors">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-white font-medium text-sm">
                        {assessment.client_name || assessment.client_id}
                      </span>
                      <span className={'text-xs px-2 py-0.5 rounded border ' + (STATUS_COLOURS[assessment.status] || 'bg-slate-700 text-slate-400 border-slate-600')}>
                        {assessment.status?.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-slate-500 capitalize">
                        {assessment.visit_type?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {assessment.site_address && (
                      <p className="text-xs text-slate-500 mb-2">{assessment.site_address}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>{assessment.asset_count || 0} asset{assessment.asset_count !== 1 ? 's' : ''}</span>
                      <span className={assessment.critical_findings > 0 ? 'text-red-400' : ''}>
                        {assessment.finding_count || 0} finding{assessment.finding_count !== 1 ? 's' : ''}
                        {assessment.critical_findings > 0 && ' (' + assessment.critical_findings + ' critical)'}
                      </span>
                      {assessment.total_financial_exposure > 0 && (
                        <span className="text-orange-400">{formatRand(assessment.total_financial_exposure)} exposure</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-xs text-slate-500 shrink-0">
                    <span>{formatDate(assessment.created_at)}</span>
                    {assessment.completed_at && (
                      <span className="text-emerald-500">Completed {formatDate(assessment.completed_at)}</span>
                    )}
                    <Link
                      href={'/clients/' + assessment.client_id}
                      className="text-teal-400 hover:text-teal-300 transition-colors"
                    >
                      View client →
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
