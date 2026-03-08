'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Practice {
  id: string;
  practice_name: string;
  primary_contact?: string;
  contact_email?: string;
  contact_phone?: string;
  isp_provider?: string;
  doctor_count?: number;
  staff_count?: number;
  segment: string;
  sla_status?: string;
  cybershield_status?: string;
  last_scan_date?: string;
  popia_status?: string;
  hpcsa_status?: string;
  software_stack?: string[];
  notes?: string;
  created_at: string;
}

interface ComplianceRow {
  practice_id: string;
  practice_name: string;
  popia_status: string;
  hpcsa_status: string;
  backup_compliance: string;
  encryption_status: string;
  network_security: string;
  last_audit_date?: string;
}

interface SoftwareRow {
  id: string;
  practice_id: string;
  practice_name: string;
  software: string;
  version?: string;
  last_updated?: string;
  compatibility_status?: string;
  notes?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = ['Practices', 'Compliance', 'Software Stack'] as const;
type Tab = typeof TABS[number];

const SOFTWARE_OPTIONS = [
  'GoodX', 'Elixir', 'HealthBridge', 'Best Practice', 'Dragon Dictate', 'Other',
];

const COMPLIANCE_STATUS_COLOUR: Record<string, string> = {
  MET:     '#16A34A',
  'NOT MET': '#CC0000',
  PENDING: '#D97706',
};

const SLA_COLOUR: Record<string, string> = {
  active:   '#0FEA7A',
  inactive: '#6B7280',
  pending:  '#D97706',
  expired:  '#CC0000',
};

const CYBERSHIELD_COLOUR: Record<string, string> = {
  enrolled:    '#0FEA7A',
  not_enrolled:'#6B7280',
  pending:     '#D97706',
};

const COMPAT_COLOUR: Record<string, string> = {
  current:    '#16A34A',
  outdated:   '#D97706',
  unsupported:'#CC0000',
  unknown:    '#6B7280',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(s?: string) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-ZA', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({ text, colour }: { text: string; colour: string }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
      background: colour + '22', color: colour, border: `1px solid ${colour}44`,
      textTransform: 'uppercase', letterSpacing: 0.8, whiteSpace: 'nowrap',
    }}>
      {text.replace(/_/g, ' ')}
    </span>
  );
}

function ComplianceBadge({ status }: { status: string }) {
  const colour = COMPLIANCE_STATUS_COLOUR[status] ?? '#6B7280';
  return <Badge text={status} colour={colour} />;
}

function SummaryCard({ label, value, colour = '#0FEA7A', sub }: { label: string; value: string; colour?: string; sub?: string }) {
  return (
    <div style={{
      background: '#0d1f1e', border: '1px solid #27504D', borderRadius: 8,
      padding: '16px 20px', minWidth: 150, flex: '1 1 150px',
    }}>
      <div style={{ fontSize: 11, color: '#999', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: colour }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: '#555' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🏥</div>
      <div style={{ fontSize: 14, color: '#666' }}>{message}</div>
    </div>
  );
}

// ─── Add Practice Modal ───────────────────────────────────────────────────────

interface PracticeForm {
  practice_name: string;
  primary_contact: string;
  contact_email: string;
  contact_phone: string;
  isp_provider: string;
  doctor_count: string;
  staff_count: string;
  software_stack: string[];
  notes: string;
}

const defaultForm: PracticeForm = {
  practice_name: '', primary_contact: '', contact_email: '', contact_phone: '',
  isp_provider: '', doctor_count: '', staff_count: '', software_stack: [], notes: '',
};

function AddPracticeModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState<PracticeForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof PracticeForm, v: string | string[]) =>
    setForm(f => ({ ...f, [k]: v }));

  const toggleSoftware = (sw: string) => {
    set('software_stack',
      form.software_stack.includes(sw)
        ? form.software_stack.filter(s => s !== sw)
        : [...form.software_stack, sw]
    );
  };

  const handleSave = async () => {
    if (!form.practice_name.trim()) { setError('Practice name is required'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/medical/practices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          segment: 'medical_practice',
          doctor_count: form.doctor_count ? parseInt(form.doctor_count) : undefined,
          staff_count: form.staff_count ? parseInt(form.staff_count) : undefined,
        }),
      });
      if (!res.ok) { setError('Failed to save. Backend may not be available yet.'); return; }
      onSave();
      onClose();
    } catch {
      setError('Network error. Backend endpoint may not exist yet.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#00000088', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: '#0d1f1e', border: '1px solid #27504D', borderRadius: 12,
        padding: 28, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#E8F4F3', marginBottom: 20 }}>
          Add Medical Practice
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={labelStyle}>Practice Name *
            <input value={form.practice_name} onChange={e => set('practice_name', e.target.value)}
              placeholder="e.g. Pieterse, Hunt, Meyberg &amp; Associates" style={inputStyle} />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={labelStyle}>Primary Contact (Dr)
              <input value={form.primary_contact} onChange={e => set('primary_contact', e.target.value)}
                placeholder="Dr Jane Smith" style={inputStyle} />
            </label>
            <label style={labelStyle}>Contact Email
              <input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)}
                placeholder="dr@practice.co.za" style={inputStyle} />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={labelStyle}>Contact Phone
              <input value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)}
                placeholder="011 123 4567" style={inputStyle} />
            </label>
            <label style={labelStyle}>ISP Provider
              <input value={form.isp_provider} onChange={e => set('isp_provider', e.target.value)}
                placeholder="e.g. Stem, Vox, NTT" style={inputStyle} />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={labelStyle}>Number of Doctors
              <input type="number" min="1" value={form.doctor_count} onChange={e => set('doctor_count', e.target.value)}
                placeholder="2" style={inputStyle} />
            </label>
            <label style={labelStyle}>Number of Staff
              <input type="number" min="0" value={form.staff_count} onChange={e => set('staff_count', e.target.value)}
                placeholder="5" style={inputStyle} />
            </label>
          </div>

          <div>
            <div style={{ fontSize: 12, color: '#A8D5D1', marginBottom: 8 }}>Software Stack</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SOFTWARE_OPTIONS.map(sw => (
                <button key={sw} onClick={() => toggleSoftware(sw)} style={{
                  padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: `1px solid ${form.software_stack.includes(sw) ? '#0FEA7A' : '#27504D'}`,
                  background: form.software_stack.includes(sw) ? '#0FEA7A22' : 'transparent',
                  color: form.software_stack.includes(sw) ? '#0FEA7A' : '#A8D5D1',
                }}>
                  {sw}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: '#0a1510', border: '1px solid #27504D', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#666' }}>
            Segment: <span style={{ color: '#0FEA7A', fontWeight: 700 }}>medical_practice</span> (pre-set)
          </div>

          <label style={labelStyle}>Notes
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              rows={3} placeholder="Internal notes about this practice..." style={{ ...inputStyle, resize: 'vertical' }} />
          </label>

          {error && <div style={{ color: '#D97706', fontSize: 12, background: '#D9770622', border: '1px solid #D9770644', padding: '8px 12px', borderRadius: 6 }}>{error}</div>}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnSecStyle}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ ...btnPrimStyle, opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : 'Add Practice'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Practices Tab ────────────────────────────────────────────────────────────

function PracticesTab({ practices, loading, onAddPractice, onRefresh }: {
  practices: Practice[];
  loading: boolean;
  onAddPractice: () => void;
  onRefresh: () => void;
}) {
  const total = practices.length;
  const activeSLAs = practices.filter(p => p.sla_status === 'active').length;
  const cyberShield = practices.filter(p => p.cybershield_status === 'enrolled').length;
  const complianceIssues = practices.filter(
    p => p.popia_status === 'NOT MET' || p.hpcsa_status === 'NOT MET'
  ).length;

  const createJob = async (practiceId: string, practiceName: string) => {
    try {
      await fetch('/api/workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Medical Practice Site Visit — ${practiceName}`,
          service_type: 'Medical Practice Assessment',
          status: 'open',
          priority: 'normal',
          notes: `Auto-created from Medical Practices dashboard. Practice ID: ${practiceId}`,
        }),
      });
      alert(`Job created for ${practiceName}`);
    } catch {
      alert('Job creation failed — backend may not be available');
    }
  };

  return (
    <div>
      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <SummaryCard label="Total Practices" value={String(total)} />
        <SummaryCard label="Active SLAs" value={String(activeSLAs)} colour="#3B82F6" />
        <SummaryCard label="CyberShield Enrolled" value={String(cyberShield)} colour="#0FEA7A" />
        <SummaryCard
          label="Compliance Issues"
          value={String(complianceIssues)}
          colour={complianceIssues > 0 ? '#CC0000' : '#16A34A'}
          sub={complianceIssues > 0 ? 'POPIA or HPCSA not met' : 'All compliant'}
        />
      </div>

      {/* Add Practice button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14, gap: 10 }}>
        <button onClick={onRefresh} style={btnSecStyle}>↺ Refresh</button>
        <button onClick={onAddPractice} style={btnPrimStyle}>+ Add Practice</button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#555' }}>Loading practices…</div>
      ) : practices.length === 0 ? (
        <EmptyState message="No medical practices registered yet. Add your first practice above." />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 900 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #0FEA7A' }}>
                {['Practice Name', 'Doctors', 'Segment', 'SLA', 'CyberShield', 'Last Scan', 'POPIA', 'HPCSA', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#A8D5D1', textTransform: 'uppercase', letterSpacing: 0.8, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {practices.map((p, i) => (
                <tr key={p.id} style={{ background: i % 2 === 0 ? 'transparent' : '#27504D11', borderBottom: '1px solid #27504D22' }}>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontWeight: 600, color: '#E8F4F3' }}>{p.practice_name}</div>
                    {p.primary_contact && <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{p.primary_contact}</div>}
                    {p.contact_email && <div style={{ fontSize: 11, color: '#555' }}>{p.contact_email}</div>}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#A8D5D1' }}>
                    {p.doctor_count ?? '—'}
                    {p.staff_count ? <span style={{ color: '#555', fontSize: 11 }}> / {p.staff_count} staff</span> : null}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <Badge text="medical" colour="#3B82F6" />
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {p.sla_status
                      ? <Badge text={p.sla_status} colour={SLA_COLOUR[p.sla_status] ?? '#6B7280'} />
                      : <span style={{ color: '#444', fontSize: 12 }}>—</span>}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {p.cybershield_status
                      ? <Badge text={p.cybershield_status} colour={CYBERSHIELD_COLOUR[p.cybershield_status] ?? '#6B7280'} />
                      : <span style={{ color: '#444', fontSize: 12 }}>—</span>}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#A8D5D1', whiteSpace: 'nowrap' }}>
                    {fmtDate(p.last_scan_date)}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {p.popia_status
                      ? <ComplianceBadge status={p.popia_status} />
                      : <span style={{ color: '#444', fontSize: 12 }}>—</span>}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {p.hpcsa_status
                      ? <ComplianceBadge status={p.hpcsa_status} />
                      : <span style={{ color: '#444', fontSize: 12 }}>—</span>}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'nowrap' }}>
                      <button style={{ ...btnSecStyle, padding: '4px 10px', fontSize: 11 }}>View</button>
                      <button
                        onClick={() => createJob(p.id, p.practice_name)}
                        style={{ ...btnSecStyle, padding: '4px 10px', fontSize: 11, color: '#0FEA7A', borderColor: '#0FEA7A44' }}
                      >
                        + Job
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Compliance Tab ───────────────────────────────────────────────────────────

function ComplianceTab({ rows, loading }: { rows: ComplianceRow[]; loading: boolean }) {
  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#555' }}>Loading compliance data…</div>;
  if (rows.length === 0) return <EmptyState message="No compliance data available. Add practices and run assessments to populate this view." />;

  const metCount = rows.filter(r => r.popia_status === 'MET' && r.hpcsa_status === 'MET').length;
  const notMetCount = rows.filter(r => r.popia_status === 'NOT MET' || r.hpcsa_status === 'NOT MET').length;
  const pendingCount = rows.filter(r => r.popia_status === 'PENDING' || r.hpcsa_status === 'PENDING').length;

  return (
    <div>
      {/* Summary row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <SummaryCard label="Fully Compliant" value={String(metCount)} colour="#16A34A" />
        <SummaryCard label="Issues Found" value={String(notMetCount)} colour={notMetCount > 0 ? '#CC0000' : '#16A34A'} />
        <SummaryCard label="Pending Review" value={String(pendingCount)} colour="#D97706" />
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 900 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #0FEA7A' }}>
              {['Practice', 'POPIA', 'HPCSA', 'Backup', 'Encryption', 'Network Security', 'Last Audit'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#A8D5D1', textTransform: 'uppercase', letterSpacing: 0.8, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.practice_id} style={{ background: i % 2 === 0 ? 'transparent' : '#27504D11', borderBottom: '1px solid #27504D22' }}>
                <td style={{ padding: '10px 14px', fontWeight: 600, color: '#E8F4F3' }}>{r.practice_name}</td>
                <td style={{ padding: '10px 14px' }}><ComplianceBadge status={r.popia_status} /></td>
                <td style={{ padding: '10px 14px' }}><ComplianceBadge status={r.hpcsa_status} /></td>
                <td style={{ padding: '10px 14px' }}><ComplianceBadge status={r.backup_compliance} /></td>
                <td style={{ padding: '10px 14px' }}><ComplianceBadge status={r.encryption_status} /></td>
                <td style={{ padding: '10px 14px' }}><ComplianceBadge status={r.network_security} /></td>
                <td style={{ padding: '10px 14px', color: '#A8D5D1', whiteSpace: 'nowrap' }}>{fmtDate(r.last_audit_date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Software Stack Tab ───────────────────────────────────────────────────────

function SoftwareTab({ rows, loading }: { rows: SoftwareRow[]; loading: boolean }) {
  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#555' }}>Loading software stack data…</div>;
  if (rows.length === 0) return <EmptyState message="No software stack data available. Add practices with software information to populate this view." />;

  const outdatedCount = rows.filter(r => r.compatibility_status === 'outdated' || r.compatibility_status === 'unsupported').length;

  return (
    <div>
      {/* Summary */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <SummaryCard label="Software Records" value={String(rows.length)} />
        <SummaryCard label="Outdated / Unsupported" value={String(outdatedCount)} colour={outdatedCount > 0 ? '#D97706' : '#16A34A'} sub={outdatedCount > 0 ? 'Requires attention' : 'All current'} />
        <SummaryCard label="Practices Covered" value={String(new Set(rows.map(r => r.practice_id)).size)} colour="#A8D5D1" />
      </div>

      {outdatedCount > 0 && (
        <div style={{ background: '#D9770622', border: '1px solid #D9770644', borderRadius: 8, padding: '12px 16px', marginBottom: 16, borderLeft: '4px solid #D97706' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#D97706', marginBottom: 4 }}>ATTENTION REQUIRED</div>
          <div style={{ fontSize: 12, color: '#A8D5D1' }}>
            {outdatedCount} software record{outdatedCount !== 1 ? 's' : ''} marked as outdated or unsupported.
            Outdated medical software can impact HPCSA compliance and patient safety.
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 800 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #0FEA7A' }}>
              {['Practice', 'Software', 'Version', 'Last Updated', 'Status', 'Notes'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#A8D5D1', textTransform: 'uppercase', letterSpacing: 0.8, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const compatColour = COMPAT_COLOUR[r.compatibility_status ?? 'unknown'] ?? '#6B7280';
              const isProblematic = r.compatibility_status === 'outdated' || r.compatibility_status === 'unsupported';
              return (
                <tr key={r.id} style={{
                  background: isProblematic ? '#D9770611' : (i % 2 === 0 ? 'transparent' : '#27504D11'),
                  borderBottom: '1px solid #27504D22',
                  borderLeft: isProblematic ? '3px solid #D97706' : undefined,
                }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#E8F4F3' }}>{r.practice_name}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ color: '#A8D5D1', fontWeight: 600 }}>{r.software}</span>
                  </td>
                  <td style={{ padding: '10px 14px', color: isProblematic ? '#D97706' : '#A8D5D1', fontFamily: 'monospace', fontSize: 12 }}>
                    {r.version ?? '—'}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#A8D5D1', whiteSpace: 'nowrap' }}>
                    {fmtDate(r.last_updated)}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {r.compatibility_status
                      ? <Badge text={r.compatibility_status} colour={compatColour} />
                      : <span style={{ color: '#444', fontSize: 12 }}>—</span>}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#666', fontSize: 12 }}>
                    {r.notes ?? '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MedicalPage() {
  const [tab, setTab] = useState<Tab>('Practices');
  const [practices, setPractices] = useState<Practice[]>([]);
  const [compliance, setCompliance] = useState<ComplianceRow[]>([]);
  const [software, setSoftware] = useState<SoftwareRow[]>([]);
  const [loadingPractices, setLoadingPractices] = useState(true);
  const [loadingCompliance, setLoadingCompliance] = useState(false);
  const [loadingSoftware, setLoadingSoftware] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const loadPractices = useCallback(async () => {
    setLoadingPractices(true);
    try {
      const res = await fetch('/api/medical/practices');
      const json = await res.json().catch(() => ({}));
      setPractices(json.data ?? (Array.isArray(json) ? json : []));
    } catch {
      setPractices([]);
    } finally {
      setLoadingPractices(false);
    }
  }, []);

  const loadCompliance = useCallback(async () => {
    if (compliance.length > 0) return; // already loaded
    setLoadingCompliance(true);
    try {
      const res = await fetch('/api/medical/compliance');
      const json = await res.json().catch(() => ({}));
      setCompliance(json.data ?? (Array.isArray(json) ? json : []));
    } catch {
      setCompliance([]);
    } finally {
      setLoadingCompliance(false);
    }
  }, [compliance.length]);

  const loadSoftware = useCallback(async () => {
    if (software.length > 0) return; // already loaded
    setLoadingSoftware(true);
    try {
      const res = await fetch('/api/medical/software');
      const json = await res.json().catch(() => ({}));
      setSoftware(json.data ?? (Array.isArray(json) ? json : []));
    } catch {
      setSoftware([]);
    } finally {
      setLoadingSoftware(false);
    }
  }, [software.length]);

  useEffect(() => { loadPractices(); }, [loadPractices]);

  useEffect(() => {
    if (tab === 'Compliance') loadCompliance();
    if (tab === 'Software Stack') loadSoftware();
  }, [tab, loadCompliance, loadSoftware]);

  return (
    <div style={{
      minHeight: '100vh', background: '#0f1923', color: '#E8F4F3',
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", padding: '24px 20px',
    }}>
      {/* Header */}
      <div style={{
        background: '#27504D', borderRadius: 10, padding: '20px 24px', marginBottom: 20,
        borderBottom: '3px solid #0FEA7A', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>ZA SUPPORT</div>
          <div style={{ fontSize: 11, color: '#A8D5D1' }}>Medical Practice Management — Practice IT. Perfected.</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            fontSize: 11, color: '#A8D5D1', background: '#0d1f1e', padding: '4px 10px',
            borderRadius: 4, border: '1px solid #27504D',
          }}>
            POPIA · HPCSA · National Health Act
          </div>
        </div>
      </div>

      {/* Page title */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>Medical Practices</h1>
        <p style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
          Practice profiles · HPCSA/POPIA compliance · software stack · assessments
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 24,
        background: '#0d1f1e', borderRadius: 8, padding: 4, width: 'fit-content',
      }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 18px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: tab === t ? '#27504D' : 'transparent',
            color: tab === t ? '#0FEA7A' : '#999',
          }}>{t}</button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ background: '#0d1f1e', border: '1px solid #27504D', borderRadius: 10, padding: '20px 20px' }}>
        {tab === 'Practices' && (
          <PracticesTab
            practices={practices}
            loading={loadingPractices}
            onAddPractice={() => setShowAddModal(true)}
            onRefresh={() => loadPractices()}
          />
        )}
        {tab === 'Compliance' && (
          <ComplianceTab rows={compliance} loading={loadingCompliance} />
        )}
        {tab === 'Software Stack' && (
          <SoftwareTab rows={software} loading={loadingSoftware} />
        )}
      </div>

      {/* Add Practice Modal */}
      {showAddModal && (
        <AddPracticeModal
          onClose={() => setShowAddModal(false)}
          onSave={() => {
            // clear and reload practices
            setPractices([]);
            loadPractices();
          }}
        />
      )}
    </div>
  );
}

// ─── Shared Styles ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  display: 'block', width: '100%', marginTop: 4, padding: '8px 10px',
  background: '#0a1510', border: '1px solid #27504D', borderRadius: 6,
  color: '#E8F4F3', fontSize: 13, boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12, color: '#A8D5D1', display: 'block',
};

const btnPrimStyle: React.CSSProperties = {
  padding: '8px 18px', background: '#0FEA7A', color: '#0a1510',
  fontWeight: 700, fontSize: 13, border: 'none', borderRadius: 6, cursor: 'pointer',
};

const btnSecStyle: React.CSSProperties = {
  padding: '8px 18px', background: 'transparent', color: '#A8D5D1',
  fontWeight: 600, fontSize: 13, border: '1px solid #27504D', borderRadius: 6, cursor: 'pointer',
};
