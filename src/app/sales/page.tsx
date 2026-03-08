'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Opportunity {
  id: string;
  contact_id?: string;
  client_id?: string;
  title: string;
  stage: string;
  value_rand?: number;
  segment?: string;
  investec_client?: boolean;
  urgency?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  days_in_stage?: number;
  client_name?: string;
}

interface Contact {
  id: string;
  full_name: string;
  company?: string;
  segment?: string;
  email?: string;
  phone?: string;
  investec_client?: boolean;
  lifetime_value_rand?: number;
  open_opportunities?: number;
  last_contact?: string;
  created_at: string;
}

interface Recommendation {
  id: string;
  client_id: string;
  client_name?: string;
  product_name: string;
  roi_description?: string;
  reason?: string;          // legacy alias
  trigger_field?: string;
  trigger?: string;         // legacy alias
  rand_value?: number;
  estimated_value_rand?: number;  // legacy alias
  status: string;
  created_at: string;
}

interface PipelineSummary {
  pending_count: number;
  pending_value_rand: number;
  won_count: number;
  won_revenue_rand: number;
  by_category: { category: string; count: number; total_rand: number }[];
}

interface Client {
  client_id: string;
  first_name: string;
  last_name: string;
  business_name?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = ['Pipeline', 'Clients', 'Upsell Recommendations', 'Insights'] as const;
type Tab = typeof TABS[number];

const STAGES = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const;
const SEGMENTS = ['medical_practice', 'sme', 'individual', 'family'] as const;
const URGENCIES = ['low', 'medium', 'high', 'critical'] as const;

const STAGE_COLOUR: Record<string, string> = {
  lead:        '#6B7280',
  qualified:   '#3B82F6',
  proposal:    '#F59E0B',
  negotiation: '#F97316',
  won:         '#0FEA7A',
  lost:        '#CC0000',
};

const SEGMENT_COLOUR: Record<string, string> = {
  medical_practice: '#0FEA7A',
  sme:              '#8B5CF6',
  individual:       '#3B82F6',
  family:           '#EC4899',
};

const URGENCY_COLOUR: Record<string, string> = {
  low:      '#6B7280',
  medium:   '#F59E0B',
  high:     '#F97316',
  critical: '#CC0000',
};

const PIE_COLOURS = ['#0FEA7A', '#3B82F6', '#F59E0B', '#8B5CF6', '#F97316', '#CC0000'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtRand(n: number | undefined | null) {
  if (n == null || n === 0) return 'R 0';
  return `R ${n.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtDate(s?: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-ZA', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function daysAgo(s?: string | null): number {
  if (!s) return 0;
  return Math.floor((Date.now() - new Date(s).getTime()) / 86400000);
}

// ─── Shared Styles ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  display: 'block', width: '100%', marginTop: 4, padding: '8px 10px',
  background: '#0a1510', border: '1px solid #27504D', borderRadius: 6,
  color: '#E8F4F3', fontSize: 13, outline: 'none',
};

const btnPrimStyle: React.CSSProperties = {
  padding: '8px 18px', background: '#0FEA7A', color: '#0a1510',
  fontWeight: 700, fontSize: 13, border: 'none', borderRadius: 6, cursor: 'pointer',
};

const btnSecStyle: React.CSSProperties = {
  padding: '8px 18px', background: 'transparent', color: '#A8D5D1',
  fontWeight: 600, fontSize: 13, border: '1px solid #27504D', borderRadius: 6, cursor: 'pointer',
};

const chartBox: React.CSSProperties = {
  background: '#0d1f1e', border: '1px solid #27504D', borderRadius: 8, padding: '18px 20px',
};

const chartTitle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#0FEA7A',
  textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Pill({ text, colour }: { text: string; colour: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
      background: colour + '22', color: colour, border: `1px solid ${colour}44`,
      textTransform: 'uppercase', letterSpacing: 0.8, whiteSpace: 'nowrap',
    }}>
      {text.replace(/_/g, ' ')}
    </span>
  );
}

function SummaryCard({ label, value, sub, colour = '#0FEA7A' }: {
  label: string; value: string; sub?: string; colour?: string;
}) {
  return (
    <div style={{
      background: '#0d1f1e', border: '1px solid #27504D', borderRadius: 8,
      padding: '16px 20px', minWidth: 140, flex: 1,
    }}>
      <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: colour }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── New Opportunity Modal ─────────────────────────────────────────────────────

function OpportunityModal({
  clients,
  onClose,
  onSave,
}: {
  clients: Client[];
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => void;
}) {
  const [form, setForm] = useState<Record<string, unknown>>({
    stage: 'lead', segment: 'individual', urgency: 'medium',
    investec_client: false,
  });

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#00000099', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: '#0d1f1e', border: '1px solid #27504D', borderRadius: 12,
        padding: 28, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#E8F4F3', marginBottom: 20 }}>
          New Opportunity
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Client */}
          <label style={{ fontSize: 12, color: '#A8D5D1' }}>Client
            <select value={(form.client_id as string) || ''} onChange={e => set('client_id', e.target.value)}
              style={inputStyle}>
              <option value="">— Select client —</option>
              {clients.map(c => (
                <option key={c.client_id} value={c.client_id}>
                  {c.business_name || `${c.first_name} ${c.last_name}`}
                </option>
              ))}
            </select>
          </label>
          {/* Title */}
          <label style={{ fontSize: 12, color: '#A8D5D1' }}>Title
            <input value={(form.title as string) || ''} onChange={e => set('title', e.target.value)}
              placeholder="Opportunity description" style={inputStyle} />
          </label>
          {/* Stage + Value */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={{ fontSize: 12, color: '#A8D5D1' }}>Stage
              <select value={(form.stage as string) || 'lead'} onChange={e => set('stage', e.target.value)}
                style={inputStyle}>
                {STAGES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 12, color: '#A8D5D1' }}>Value (R excl. VAT)
              <input type="number" value={(form.value_rand as number) || ''} onChange={e => set('value_rand', parseFloat(e.target.value))}
                placeholder="0" style={inputStyle} />
            </label>
          </div>
          {/* Segment + Urgency */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={{ fontSize: 12, color: '#A8D5D1' }}>Segment
              <select value={(form.segment as string) || 'individual'} onChange={e => set('segment', e.target.value)}
                style={inputStyle}>
                {SEGMENTS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 12, color: '#A8D5D1' }}>Urgency
              <select value={(form.urgency as string) || 'medium'} onChange={e => set('urgency', e.target.value)}
                style={inputStyle}>
                {URGENCIES.map(u => <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
              </select>
            </label>
          </div>
          {/* Investec flag */}
          <label style={{ fontSize: 12, color: '#A8D5D1', display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={!!form.investec_client} onChange={e => set('investec_client', e.target.checked)} />
            Investec client (triggers priority pipeline)
          </label>
          {/* Notes */}
          <label style={{ fontSize: 12, color: '#A8D5D1' }}>Notes
            <textarea value={(form.notes as string) || ''} onChange={e => set('notes', e.target.value)}
              rows={3} placeholder="Context, source, next action..." style={{ ...inputStyle, resize: 'vertical' }} />
          </label>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnSecStyle}>Cancel</button>
          <button onClick={() => onSave(form)} style={btnPrimStyle}>Save Opportunity</button>
        </div>
      </div>
    </div>
  );
}

// ─── Pipeline Tab ─────────────────────────────────────────────────────────────

function PipelineTab({
  opps,
  onNewOpp,
}: {
  opps: Opportunity[];
  onNewOpp: () => void;
}) {
  const wonThisMonth = opps.filter(o => {
    if (o.stage !== 'won') return false;
    const d = new Date(o.updated_at || o.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const wonValue = wonThisMonth.reduce((s, o) => s + (o.value_rand ?? 0), 0);
  const openOpps = opps.filter(o => !['won', 'lost'].includes(o.stage));
  const openValue = openOpps.reduce((s, o) => s + (o.value_rand ?? 0), 0);
  const closed = opps.filter(o => ['won', 'lost'].includes(o.stage));
  const convRate = closed.length ? Math.round((opps.filter(o => o.stage === 'won').length / closed.length) * 100) : 0;

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <SummaryCard label="Total Opportunities" value={String(opps.length)} />
        <SummaryCard label="Open Pipeline Value" value={fmtRand(openValue)} colour="#3B82F6" />
        <SummaryCard label="Won This Month" value={fmtRand(wonValue)} colour="#0FEA7A" />
        <SummaryCard label="Conversion Rate" value={`${convRate}%`} colour={convRate >= 50 ? '#0FEA7A' : '#F59E0B'} />
      </div>

      {/* New Opportunity button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={onNewOpp} style={btnPrimStyle}>+ New Opportunity</button>
      </div>

      {/* Kanban by stage */}
      {STAGES.map(stage => {
        const stageOpps = opps.filter(o => o.stage === stage);
        if (stageOpps.length === 0) return null;
        return (
          <div key={stage} style={{ marginBottom: 24 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
              borderLeft: `3px solid ${STAGE_COLOUR[stage]}`, paddingLeft: 10,
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: STAGE_COLOUR[stage], textTransform: 'uppercase', letterSpacing: 1 }}>
                {stage}
              </span>
              <span style={{ fontSize: 11, color: '#666' }}>
                {stageOpps.length} · {fmtRand(stageOpps.reduce((s, o) => s + (o.value_rand ?? 0), 0))}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stageOpps.map(opp => {
                const days = opp.days_in_stage ?? daysAgo(opp.updated_at || opp.created_at);
                return (
                  <div key={opp.id} style={{
                    background: '#0d1f1e',
                    border: '1px solid #27504D',
                    borderLeft: `4px solid ${STAGE_COLOUR[stage]}`,
                    borderRadius: 8, padding: '14px 16px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10,
                  }}>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6, alignItems: 'center' }}>
                        {opp.segment && <Pill text={opp.segment} colour={SEGMENT_COLOUR[opp.segment] || '#6B7280'} />}
                        {opp.urgency && opp.urgency !== 'low' && (
                          <Pill text={opp.urgency} colour={URGENCY_COLOUR[opp.urgency] || '#6B7280'} />
                        )}
                        {opp.investec_client && (
                          <span style={{
                            fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 4,
                            background: '#78350F', color: '#FCD34D', border: '1px solid #92400E',
                            textTransform: 'uppercase', letterSpacing: 0.8,
                          }}>Investec</span>
                        )}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#E8F4F3', marginBottom: 3 }}>{opp.title}</div>
                      {opp.client_name && (
                        <div style={{ fontSize: 12, color: '#A8D5D1' }}>{opp.client_name}</div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {opp.value_rand ? (
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#0FEA7A' }}>{fmtRand(opp.value_rand)}</div>
                      ) : null}
                      <div style={{ fontSize: 11, color: '#666', marginTop: 3 }}>
                        {days}d in stage
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {opps.length === 0 && (
        <div style={{ textAlign: 'center', color: '#666', padding: 40 }}>
          No opportunities yet — create your first one.
        </div>
      )}
    </div>
  );
}

// ─── Clients Tab ──────────────────────────────────────────────────────────────

function ClientsTab({ contacts }: { contacts: Contact[] }) {
  const [search, setSearch] = useState('');

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      c.full_name.toLowerCase().includes(q) ||
      (c.company || '').toLowerCase().includes(q) ||
      (c.segment || '').toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search clients..."
          style={{ ...inputStyle, width: 260, display: 'inline-block' }}
        />
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #0FEA7A' }}>
            {['Client', 'Segment', 'Lifetime Value', 'Open Opps', 'Last Contact', 'Flag'].map(h => (
              <th key={h} style={{
                textAlign: 'left', padding: '10px 14px',
                fontSize: 11, color: '#A8D5D1', textTransform: 'uppercase', letterSpacing: 1,
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: '32px 14px', color: '#666', textAlign: 'center' }}>
                {contacts.length === 0 ? 'No contacts yet.' : 'No results.'}
              </td>
            </tr>
          )}
          {filtered.map((c, i) => (
            <tr key={c.id} style={{
              background: i % 2 === 0 ? 'transparent' : '#27504D11',
              borderBottom: '1px solid #27504D22',
            }}>
              <td style={{ padding: '10px 14px' }}>
                <div style={{ fontWeight: 600, color: '#E8F4F3' }}>{c.full_name}</div>
                {c.company && <div style={{ fontSize: 11, color: '#666' }}>{c.company}</div>}
              </td>
              <td style={{ padding: '10px 14px' }}>
                {c.segment
                  ? <Pill text={c.segment} colour={SEGMENT_COLOUR[c.segment] || '#6B7280'} />
                  : <span style={{ color: '#444' }}>—</span>}
              </td>
              <td style={{ padding: '10px 14px', color: c.lifetime_value_rand ? '#0FEA7A' : '#444', fontWeight: c.lifetime_value_rand ? 600 : 400 }}>
                {fmtRand(c.lifetime_value_rand)}
              </td>
              <td style={{ padding: '10px 14px', color: (c.open_opportunities || 0) > 0 ? '#F59E0B' : '#6B7280' }}>
                {c.open_opportunities ?? 0}
              </td>
              <td style={{ padding: '10px 14px', color: '#A8D5D1', fontSize: 12 }}>
                {fmtDate(c.last_contact)}
              </td>
              <td style={{ padding: '10px 14px' }}>
                {c.investec_client && (
                  <span style={{
                    fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 4,
                    background: '#78350F', color: '#FCD34D', border: '1px solid #92400E',
                    textTransform: 'uppercase', letterSpacing: 0.8,
                  }}>Investec</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Upsell Recommendations Tab ───────────────────────────────────────────────

function UpsellTab({ recs, summary }: { recs: Recommendation[]; summary: PipelineSummary | null }) {
  const STATUS_COLOUR: Record<string, string> = {
    pending:  '#F59E0B',
    sent:     '#3B82F6',
    accepted: '#0FEA7A',
    rejected: '#CC0000',
  };

  const CATEGORY_COLOUR: Record<string, string> = {
    repair:       '#F97316',
    accessory:    '#3B82F6',
    warranty:     '#8B5CF6',
    subscription: '#0FEA7A',
    hardware:     '#EC4899',
  };

  return (
    <div>
      {/* Pipeline KPIs */}
      {summary && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <SummaryCard label="Pending Recommendations" value={String(summary.pending_count)} colour="#F59E0B" />
          <SummaryCard label="Pending Pipeline Value" value={fmtRand(summary.pending_value_rand)} colour="#F59E0B"
            sub="Total upsell opportunity" />
          <SummaryCard label="Won Revenue" value={fmtRand(summary.won_revenue_rand)} colour="#0FEA7A"
            sub={`${summary.won_count} closed won`} />
        </div>
      )}

      {/* Category breakdown */}
      {summary && summary.by_category.length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          {summary.by_category.map(cat => (
            <div key={cat.category} style={{
              background: '#0d1f1e', border: '1px solid #27504D', borderRadius: 8,
              padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 2,
            }}>
              <Pill text={cat.category} colour={CATEGORY_COLOUR[cat.category] || '#6B7280'} />
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0FEA7A', marginTop: 4 }}>
                {fmtRand(cat.total_rand)}
              </div>
              <div style={{ fontSize: 11, color: '#666' }}>{cat.count} pending</div>
            </div>
          ))}
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #0FEA7A' }}>
            {['Client', 'Product', 'ROI Reason', 'Value', 'Trigger', 'Status'].map(h => (
              <th key={h} style={{
                textAlign: 'left', padding: '10px 14px',
                fontSize: 11, color: '#A8D5D1', textTransform: 'uppercase', letterSpacing: 1,
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {recs.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: '32px 14px', color: '#666', textAlign: 'center' }}>
                No upsell recommendations yet — upload a diagnostic to auto-generate.
              </td>
            </tr>
          )}
          {recs.map((r, i) => {
            const roiText = r.roi_description || r.reason || '—';
            const triggerKey = r.trigger_field || r.trigger || '—';
            const value = r.rand_value ?? r.estimated_value_rand;
            return (
              <tr key={r.id} style={{
                background: i % 2 === 0 ? 'transparent' : '#27504D11',
                borderBottom: '1px solid #27504D22',
              }}>
                <td style={{ padding: '10px 14px', color: '#E8F4F3', fontWeight: 600 }}>
                  {r.client_name || r.client_id}
                </td>
                <td style={{ padding: '10px 14px', color: '#E8F4F3', fontWeight: 600 }}>
                  {r.product_name}
                </td>
                <td style={{ padding: '10px 14px', color: '#A8D5D1', maxWidth: 280 }}>
                  <div style={{ fontSize: 11, lineHeight: 1.4 }}>{roiText}</div>
                </td>
                <td style={{ padding: '10px 14px', color: '#0FEA7A', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {fmtRand(value)}
                </td>
                <td style={{ padding: '10px 14px', color: '#666', fontSize: 11 }}>
                  {triggerKey.replace(/_/g, ' ')}
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <Pill text={r.status} colour={STATUS_COLOUR[r.status] || '#6B7280'} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Insights Tab ─────────────────────────────────────────────────────────────

function InsightsTab({ opps, contacts }: { opps: Opportunity[]; contacts: Contact[] }) {
  // Revenue by segment
  const segmentRevenue = SEGMENTS.map(seg => ({
    name: seg.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    value: opps.filter(o => o.segment === seg && o.stage === 'won')
      .reduce((s, o) => s + (o.value_rand ?? 0), 0),
  })).filter(x => x.value > 0);

  // Stage distribution
  const stageDist = STAGES.map(stage => ({
    name: stage.charAt(0).toUpperCase() + stage.slice(1),
    count: opps.filter(o => o.stage === stage).length,
  })).filter(x => x.count > 0);

  // Conversion funnel
  const funnelStages = STAGES.filter(s => s !== 'lost');
  const funnelData = funnelStages.map((stage, i) => {
    const stageOpps = opps.filter(o => o.stage === stage);
    const prevCount = i === 0 ? opps.length : opps.filter(o => (funnelStages.slice(0, i) as string[]).includes(o.stage)).length;
    const convPct = prevCount > 0 ? Math.round((stageOpps.length / (i === 0 ? opps.length || 1 : prevCount || 1)) * 100) : 0;
    return {
      stage: stage.charAt(0).toUpperCase() + stage.slice(1),
      count: stageOpps.length,
      value: stageOpps.reduce((s, o) => s + (o.value_rand ?? 0), 0),
      conversion: convPct,
    };
  });

  // Top 5 clients by lifetime value
  const topClients = [...contacts]
    .filter(c => c.lifetime_value_rand && c.lifetime_value_rand > 0)
    .sort((a, b) => (b.lifetime_value_rand ?? 0) - (a.lifetime_value_rand ?? 0))
    .slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {/* Revenue by segment */}
        <div style={chartBox}>
          <div style={chartTitle}>Revenue by Segment (Won)</div>
          {segmentRevenue.length === 0 ? (
            <div style={{ color: '#666', fontSize: 12, padding: '20px 0' }}>No won opportunities yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={segmentRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27504D44" />
                <XAxis dataKey="name" tick={{ fill: '#999', fontSize: 11 }} />
                <YAxis tick={{ fill: '#999', fontSize: 11 }} tickFormatter={v => `R${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#0d1f1e', border: '1px solid #27504D', color: '#E8F4F3' }}
                  formatter={(v: number | undefined) => v != null ? fmtRand(v) : ''}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {segmentRevenue.map((_, i) => (
                    <Cell key={i} fill={PIE_COLOURS[i % PIE_COLOURS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Stage distribution pie */}
        <div style={chartBox}>
          <div style={chartTitle}>Opportunity Stage Distribution</div>
          {stageDist.length === 0 ? (
            <div style={{ color: '#666', fontSize: 12, padding: '20px 0' }}>No opportunities yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={stageDist}
                  dataKey="count"
                  nameKey="name"
                  cx="50%" cy="50%"
                  outerRadius={70}
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {stageDist.map((entry) => (
                    <Cell key={entry.name} fill={STAGE_COLOUR[entry.name.toLowerCase()] || '#6B7280'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0d1f1e', border: '1px solid #27504D', color: '#E8F4F3' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Conversion funnel table */}
      <div style={chartBox}>
        <div style={chartTitle}>Conversion Funnel</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #0FEA7A' }}>
              {['Stage', 'Count', 'Total Value', 'Conversion %'].map(h => (
                <th key={h} style={{
                  textAlign: 'left', padding: '8px 12px',
                  fontSize: 11, color: '#A8D5D1', textTransform: 'uppercase', letterSpacing: 1,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {funnelData.map((row, i) => (
              <tr key={row.stage} style={{
                background: i % 2 === 0 ? 'transparent' : '#27504D11',
                borderBottom: '1px solid #27504D22',
              }}>
                <td style={{ padding: '8px 12px' }}>
                  <Pill text={row.stage} colour={STAGE_COLOUR[row.stage.toLowerCase()] || '#6B7280'} />
                </td>
                <td style={{ padding: '8px 12px', color: '#E8F4F3' }}>{row.count}</td>
                <td style={{ padding: '8px 12px', color: '#0FEA7A', fontWeight: 600 }}>{fmtRand(row.value)}</td>
                <td style={{ padding: '8px 12px', color: row.conversion >= 50 ? '#0FEA7A' : '#F59E0B' }}>
                  {row.conversion}%
                </td>
              </tr>
            ))}
            {funnelData.every(r => r.count === 0) && (
              <tr>
                <td colSpan={4} style={{ padding: '24px 12px', color: '#666', textAlign: 'center' }}>
                  No funnel data yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Top 5 clients by lifetime value */}
      <div style={chartBox}>
        <div style={chartTitle}>Top 5 Clients by Lifetime Value</div>
        {topClients.length === 0 ? (
          <div style={{ color: '#666', fontSize: 12 }}>No lifetime value data yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #27504D44' }}>
                {['#', 'Client', 'Segment', 'Lifetime Value'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '6px 12px',
                    fontSize: 11, color: '#A8D5D1', textTransform: 'uppercase', letterSpacing: 1,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topClients.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #27504D22' }}>
                  <td style={{ padding: '8px 12px', color: '#666', fontSize: 12 }}>#{i + 1}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <div style={{ color: '#E8F4F3', fontWeight: 600 }}>{c.full_name}</div>
                    {c.company && <div style={{ fontSize: 11, color: '#666' }}>{c.company}</div>}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    {c.segment
                      ? <Pill text={c.segment} colour={SEGMENT_COLOUR[c.segment] || '#6B7280'} />
                      : <span style={{ color: '#444' }}>—</span>}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#0FEA7A', fontWeight: 700 }}>
                    {fmtRand(c.lifetime_value_rand)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function SalesPage() {
  const [tab, setTab] = useState<Tab>('Pipeline');
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [summary, setSummary] = useState<PipelineSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [oppsRes, contactsRes, recsRes, clientsRes, summaryRes] = await Promise.all([
        fetch('/api/sales/opportunities'),
        fetch('/api/sales/contacts'),
        fetch('/api/sales/recommendations'),
        fetch('/api/clients?per_page=100'),
        fetch('/api/sales/pipeline-summary'),
      ]);
      const oppsJson = await oppsRes.json();
      const contactsJson = await contactsRes.json();
      const recsJson = await recsRes.json();
      const clientsJson = await clientsRes.json();
      const summaryJson = await summaryRes.json();
      setOpps(Array.isArray(oppsJson) ? oppsJson : (oppsJson.data ?? []));
      setContacts(Array.isArray(contactsJson) ? contactsJson : (contactsJson.data ?? []));
      setRecs(Array.isArray(recsJson) ? recsJson : (recsJson.data ?? []));
      setClients(Array.isArray(clientsJson) ? clientsJson : (clientsJson.data ?? []));
      setSummary(summaryJson ?? null);
    } catch {
      // silently handle — API may be pending
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const saveOpportunity = async (data: Record<string, unknown>) => {
    try {
      await fetch('/api/sales/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setShowModal(false);
      await loadData();
    } catch { /* ignore */ }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0f1923', color: '#E8F4F3',
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      padding: '24px 20px',
    }}>
      {/* Header */}
      <div style={{
        background: '#27504D', borderRadius: 10, padding: '20px 24px', marginBottom: 20,
        borderBottom: '3px solid #0FEA7A',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>ZA SUPPORT</div>
          <div style={{ fontSize: 11, color: '#A8D5D1' }}>Sales CRM — Pipeline · Clients · Upsell Recommendations · Insights</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setShowModal(true)} style={btnPrimStyle}>+ New Opportunity</button>
          <button onClick={loadData} style={btnSecStyle}>↺ Refresh</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 20,
        background: '#0d1f1e', borderRadius: 8, padding: 4, width: 'fit-content',
        flexWrap: 'wrap',
      }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600,
            background: tab === t ? '#27504D' : 'transparent',
            color: tab === t ? '#0FEA7A' : '#999',
          }}>{t}</button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ color: '#666', padding: 40, textAlign: 'center' }}>Loading Sales CRM...</div>
      )}

      {/* Tab content */}
      {!loading && tab === 'Pipeline' && (
        <PipelineTab opps={opps} onNewOpp={() => setShowModal(true)} />
      )}
      {!loading && tab === 'Clients' && (
        <ClientsTab contacts={contacts} />
      )}
      {!loading && tab === 'Upsell Recommendations' && (
        <UpsellTab recs={recs} summary={summary} />
      )}
      {!loading && tab === 'Insights' && (
        <InsightsTab opps={opps} contacts={contacts} />
      )}

      {/* New Opportunity Modal */}
      {showModal && (
        <OpportunityModal
          clients={clients}
          onClose={() => setShowModal(false)}
          onSave={saveOpportunity}
        />
      )}
    </div>
  );
}
