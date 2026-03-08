'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Job {
  id: string;
  job_ref: string;
  client_id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  service_type?: string;
  amount_rands?: number;
  device_serial?: string;
  notes?: string;
  created_at: string;
  due_date?: string;
  billable?: boolean;
}

interface Client {
  client_id: string;
  first_name: string;
  last_name: string;
  business_name?: string;
  status: string;
}

interface Revenue {
  total_rands?: number;
  this_month_rands?: number;
  outstanding_rands?: number;
  job_count?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SERVICE_TYPES = [
  'Battery Replacement', 'Screen Repair', 'Logic Board', 'Keyboard/Trackpad',
  'SSD Upgrade', 'RAM Upgrade', 'OCLP Install', 'Data Recovery', 'Forensic Recovery',
  'Network Setup', 'Software Audit', 'CyberShield Setup', 'General Diagnostics', 'Other',
];

const STATUS_TYPES = ['open', 'in_progress', 'waiting_parts', 'waiting_client', 'done', 'closed'];
const PRIORITY_TYPES = ['low', 'normal', 'high', 'urgent'];

const STATUS_COLOUR: Record<string, string> = {
  open: '#0FEA7A',
  in_progress: '#3B82F6',
  waiting_parts: '#F59E0B',
  waiting_client: '#8B5CF6',
  done: '#16A34A',
  closed: '#6B7280',
};

const PRIORITY_COLOUR: Record<string, string> = {
  low: '#6B7280', normal: '#0FEA7A', high: '#F59E0B', urgent: '#CC0000',
};

const PIE_COLOURS = ['#0FEA7A', '#3B82F6', '#F59E0B', '#8B5CF6', '#CC0000', '#6B7280'];

const TABS = ['Dashboard', 'Job Cards', 'Clients', 'Insights'] as const;
type Tab = typeof TABS[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtRand(n: number | undefined) {
  if (!n) return 'R 0';
  return `R ${n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(s?: string) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-ZA', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function clientName(clients: Client[], client_id: string) {
  const c = clients.find(x => x.client_id === client_id);
  if (!c) return client_id;
  return c.business_name || `${c.first_name} ${c.last_name}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({ text, colour }: { text: string; colour: string }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
      background: colour + '22', color: colour, border: `1px solid ${colour}44`,
      textTransform: 'uppercase', letterSpacing: 1,
    }}>
      {text.replace('_', ' ')}
    </span>
  );
}

function Card({ label, value, sub, colour = '#0FEA7A' }: { label: string; value: string; sub?: string; colour?: string }) {
  return (
    <div style={{
      background: '#0d1f1e', border: '1px solid #27504D', borderRadius: 8,
      padding: '16px 20px', minWidth: 140,
    }}>
      <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: colour }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Job Form Modal ───────────────────────────────────────────────────────────

function JobModal({
  job, clients, onClose, onSave,
}: {
  job: Partial<Job> | null;
  clients: Client[];
  onClose: () => void;
  onSave: (data: Partial<Job>) => void;
}) {
  const [form, setForm] = useState<Partial<Job>>(job || {
    status: 'open', priority: 'normal', billable: true,
  });

  const set = (k: keyof Job, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#00000088', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: '#0d1f1e', border: '1px solid #27504D', borderRadius: 12,
        padding: 28, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#E8F4F3', marginBottom: 20 }}>
          {job?.id ? 'Edit Job' : 'New Job Card'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Client */}
          <label style={{ fontSize: 12, color: '#A8D5D1' }}>Client
            <select value={form.client_id || ''} onChange={e => set('client_id', e.target.value)}
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
            <input value={form.title || ''} onChange={e => set('title', e.target.value)}
              placeholder="Job description" style={inputStyle} />
          </label>
          {/* Service Type */}
          <label style={{ fontSize: 12, color: '#A8D5D1' }}>Service Type
            <select value={form.service_type || ''} onChange={e => set('service_type', e.target.value)}
              style={inputStyle}>
              <option value="">— Select type —</option>
              {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          {/* Status + Priority */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={{ fontSize: 12, color: '#A8D5D1' }}>Status
              <select value={form.status || 'open'} onChange={e => set('status', e.target.value)}
                style={inputStyle}>
                {STATUS_TYPES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 12, color: '#A8D5D1' }}>Priority
              <select value={form.priority || 'normal'} onChange={e => set('priority', e.target.value)}
                style={inputStyle}>
                {PRIORITY_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
          </div>
          {/* Amount + Device */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={{ fontSize: 12, color: '#A8D5D1' }}>Amount (R excl VAT)
              <input type="number" value={form.amount_rands || ''} onChange={e => set('amount_rands', parseFloat(e.target.value))}
                placeholder="0.00" style={inputStyle} />
            </label>
            <label style={{ fontSize: 12, color: '#A8D5D1' }}>Device Serial
              <input value={form.device_serial || ''} onChange={e => set('device_serial', e.target.value)}
                placeholder="Optional" style={inputStyle} />
            </label>
          </div>
          {/* Due Date */}
          <label style={{ fontSize: 12, color: '#A8D5D1' }}>Due Date
            <input type="date" value={form.due_date?.slice(0, 10) || ''} onChange={e => set('due_date', e.target.value)}
              style={inputStyle} />
          </label>
          {/* Notes */}
          <label style={{ fontSize: 12, color: '#A8D5D1' }}>Notes
            <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)}
              rows={3} placeholder="Internal notes..." style={{ ...inputStyle, resize: 'vertical' }} />
          </label>
          {/* Billable */}
          <label style={{ fontSize: 12, color: '#A8D5D1', display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={!!form.billable} onChange={e => set('billable', e.target.checked)} />
            Billable
          </label>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnSecStyle}>Cancel</button>
          <button onClick={() => onSave(form)} style={btnPrimStyle}>Save Job</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function JobCardsPage() {
  const [tab, setTab] = useState<Tab>('Dashboard');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [revenue, setRevenue] = useState<Revenue>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [modalJob, setModalJob] = useState<Partial<Job> | null | false>(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [jobsRes, clientsRes, revRes] = await Promise.all([
        fetch('/api/workshop?per_page=100'),
        fetch('/api/clients?per_page=100'),
        fetch('/api/workshop/revenue').catch(() => null),
      ]);
      const jobsJson = await jobsRes.json();
      const clientsJson = await clientsRes.json();
      setJobs(jobsJson.data ?? []);
      setClients(clientsJson.data ?? []);
      if (revRes?.ok) setRevenue(await revRes.json());
    } catch {
      // silently handle
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const saveJob = async (data: Partial<Job>) => {
    try {
      const isNew = !data.id;
      await fetch('/api/workshop', {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setModalJob(false);
      await loadData();
    } catch { /* ignore */ }
  };

  // ─── Derived Data ──────────────────────────────────────────────────────────

  const filtered = jobs.filter(j => {
    const name = clientName(clients, j.client_id).toLowerCase();
    const matchSearch = !search || j.title.toLowerCase().includes(search.toLowerCase()) || name.includes(search.toLowerCase()) || (j.job_ref || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || j.status === filterStatus;
    const matchClient = !filterClient || j.client_id === filterClient;
    return matchSearch && matchStatus && matchClient;
  });

  const statusBreakdown = STATUS_TYPES.map(s => ({
    name: s.replace('_', ' '), count: jobs.filter(j => j.status === s).length,
  })).filter(x => x.count > 0);

  const priorityBreakdown = PRIORITY_TYPES.map(p => ({
    name: p, count: jobs.filter(j => j.priority === p).length,
  })).filter(x => x.count > 0);

  const clientRevenue = clients.map(c => {
    const cJobs = jobs.filter(j => j.client_id === c.client_id && j.amount_rands);
    return {
      name: (c.business_name || `${c.first_name} ${c.last_name}`).split(' ')[0],
      amount: cJobs.reduce((sum, j) => sum + (j.amount_rands || 0), 0),
    };
  }).filter(x => x.amount > 0).sort((a, b) => b.amount - a.amount).slice(0, 8);

  const slaClients = clients.map(c => {
    const cJobs = jobs.filter(j => j.client_id === c.client_id);
    const open = cJobs.filter(j => ['open', 'in_progress', 'waiting_parts', 'waiting_client'].includes(j.status)).length;
    const done = cJobs.filter(j => j.status === 'done').length;
    return { name: c.business_name || `${c.first_name} ${c.last_name}`, open, done, total: cJobs.length };
  }).filter(x => x.total > 0);

  const exportCSV = () => {
    const rows = [
      ['Ref', 'Client', 'Title', 'Service', 'Status', 'Priority', 'Amount', 'Created', 'Due'],
      ...filtered.map(j => [
        j.job_ref || j.id.slice(0, 8),
        clientName(clients, j.client_id),
        j.title,
        j.service_type || '',
        j.status,
        j.priority,
        j.amount_rands || 0,
        fmtDate(j.created_at),
        fmtDate(j.due_date),
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv,' + encodeURIComponent(csv);
    a.download = `ZA Support Job Cards ${new Date().toLocaleDateString('en-ZA').replace(/\//g, ' ')}.csv`;
    a.click();
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: '#0f1923', color: '#E8F4F3', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", padding: '24px 20px' }}>
      {/* Header */}
      <div style={{ background: '#27504D', borderRadius: 10, padding: '20px 24px', marginBottom: 20, borderBottom: '3px solid #0FEA7A', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>ZA SUPPORT</div>
          <div style={{ fontSize: 11, color: '#A8D5D1' }}>Job Cards & Workshop Management</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setModalJob({})} style={btnPrimStyle}>+ New Job</button>
          <button onClick={exportCSV} style={btnSecStyle}>Export CSV</button>
          <button onClick={loadData} style={btnSecStyle}>↺ Refresh</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#0d1f1e', borderRadius: 8, padding: 4, width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 18px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: tab === t ? '#27504D' : 'transparent',
            color: tab === t ? '#0FEA7A' : '#999',
          }}>{t}</button>
        ))}
      </div>

      {loading && <div style={{ color: '#666', padding: 40, textAlign: 'center' }}>Loading...</div>}

      {/* ── DASHBOARD TAB ──────────────────────────────────────────────────── */}
      {!loading && tab === 'Dashboard' && (
        <div>
          {/* Summary Cards */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
            <Card label="Total Jobs" value={String(jobs.length)} />
            <Card label="Open" value={String(jobs.filter(j => j.status === 'open').length)} colour="#3B82F6" />
            <Card label="In Progress" value={String(jobs.filter(j => j.status === 'in_progress').length)} colour="#F59E0B" />
            <Card label="Done This Month" value={String(jobs.filter(j => j.status === 'done' && new Date(j.created_at).getMonth() === new Date().getMonth()).length)} colour="#0FEA7A" />
            <Card label="Total Revenue" value={fmtRand(revenue.total_rands)} colour="#0FEA7A" />
            <Card label="This Month" value={fmtRand(revenue.this_month_rands)} colour="#A8D5D1" />
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
            {/* Status Pie */}
            <div style={chartBox}>
              <div style={chartTitle}>Job Status Breakdown</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusBreakdown} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {statusBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLOURS[i % PIE_COLOURS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0d1f1e', border: '1px solid #27504D', color: '#E8F4F3' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Client Revenue Bar */}
            <div style={chartBox}>
              <div style={chartTitle}>Revenue by Client</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={clientRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27504D44" />
                  <XAxis dataKey="name" tick={{ fill: '#999', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#999', fontSize: 11 }} tickFormatter={v => `R${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: '#0d1f1e', border: '1px solid #27504D', color: '#E8F4F3' }} formatter={(v: number | undefined) => v != null ? fmtRand(v) : ''} />
                  <Bar dataKey="amount" fill="#0FEA7A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Priority Pie */}
            <div style={chartBox}>
              <div style={chartTitle}>Priority Distribution</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={priorityBreakdown} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {priorityBreakdown.map((e) => <Cell key={e.name} fill={PRIORITY_COLOUR[e.name] || '#6B7280'} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0d1f1e', border: '1px solid #27504D', color: '#E8F4F3' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SLA Utilisation Table */}
          <div style={chartBox}>
            <div style={chartTitle}>SLA Utilisation by Client</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #0FEA7A' }}>
                  {['Client', 'Total Jobs', 'Open', 'Done', 'Completion Rate'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, color: '#A8D5D1', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slaClients.map((c, i) => (
                  <tr key={c.name} style={{ background: i % 2 === 0 ? 'transparent' : '#27504D11', borderBottom: '1px solid #27504D22' }}>
                    <td style={{ padding: '8px 12px', color: '#E8F4F3', fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: '8px 12px', color: '#A8D5D1' }}>{c.total}</td>
                    <td style={{ padding: '8px 12px', color: c.open > 0 ? '#F59E0B' : '#6B7280' }}>{c.open}</td>
                    <td style={{ padding: '8px 12px', color: '#0FEA7A' }}>{c.done}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, background: '#27504D', borderRadius: 4, height: 6 }}>
                          <div style={{ width: `${c.total ? Math.round((c.done / c.total) * 100) : 0}%`, background: '#0FEA7A', borderRadius: 4, height: 6 }} />
                        </div>
                        <span style={{ fontSize: 11, color: '#A8D5D1', minWidth: 36 }}>
                          {c.total ? Math.round((c.done / c.total) * 100) : 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── JOB CARDS TAB ──────────────────────────────────────────────────── */}
      {!loading && tab === 'Job Cards' && (
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs..." style={{ ...inputStyle, width: 220 }} />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: 160 }}>
              <option value="">All Statuses</option>
              {STATUS_TYPES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
            <select value={filterClient} onChange={e => setFilterClient(e.target.value)} style={{ ...inputStyle, width: 180 }}>
              <option value="">All Clients</option>
              {clients.map(c => <option key={c.client_id} value={c.client_id}>{c.business_name || `${c.first_name} ${c.last_name}`}</option>)}
            </select>
            <span style={{ fontSize: 12, color: '#666', alignSelf: 'center' }}>{filtered.length} jobs</span>
          </div>

          {/* Job List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.length === 0 && <div style={{ color: '#666', padding: 32, textAlign: 'center' }}>No jobs found.</div>}
            {filtered.map(job => (
              <div key={job.id} style={{
                background: '#0d1f1e', border: '1px solid #27504D',
                borderLeft: `4px solid ${STATUS_COLOUR[job.status] || '#6B7280'}`,
                borderRadius: 8, padding: '14px 18px',
                display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap',
              }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                    <Badge text={job.status} colour={STATUS_COLOUR[job.status] || '#6B7280'} />
                    <Badge text={job.priority} colour={PRIORITY_COLOUR[job.priority] || '#6B7280'} />
                    {job.service_type && <span style={{ fontSize: 11, color: '#666', background: '#27504D22', padding: '2px 8px', borderRadius: 4 }}>{job.service_type}</span>}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#E8F4F3', marginBottom: 4 }}>{job.title}</div>
                  <div style={{ fontSize: 12, color: '#A8D5D1' }}>{clientName(clients, job.client_id)}</div>
                  {job.notes && <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>{job.notes}</div>}
                </div>
                <div style={{ textAlign: 'right', minWidth: 120 }}>
                  {job.amount_rands ? <div style={{ fontSize: 16, fontWeight: 700, color: '#0FEA7A' }}>{fmtRand(job.amount_rands)}</div> : null}
                  <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>Created {fmtDate(job.created_at)}</div>
                  {job.due_date && <div style={{ fontSize: 11, color: '#F59E0B', marginTop: 2 }}>Due {fmtDate(job.due_date)}</div>}
                  <div style={{ fontSize: 10, color: '#444', marginTop: 4 }}>{job.job_ref || job.id.slice(0, 8)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CLIENTS TAB ────────────────────────────────────────────────────── */}
      {!loading && tab === 'Clients' && (
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #0FEA7A' }}>
                {['Client', 'Status', 'Open Jobs', 'Done Jobs', 'Revenue'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#A8D5D1', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((c, i) => {
                const cJobs = jobs.filter(j => j.client_id === c.client_id);
                const openJobs = cJobs.filter(j => ['open', 'in_progress', 'waiting_parts', 'waiting_client'].includes(j.status)).length;
                const doneJobs = cJobs.filter(j => j.status === 'done').length;
                const rev = cJobs.reduce((sum, j) => sum + (j.amount_rands || 0), 0);
                return (
                  <tr key={c.client_id} style={{ background: i % 2 === 0 ? 'transparent' : '#27504D11', borderBottom: '1px solid #27504D22' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 600, color: '#E8F4F3' }}>{c.business_name || `${c.first_name} ${c.last_name}`}</div>
                      <div style={{ fontSize: 11, color: '#666' }}>{c.client_id}</div>
                    </td>
                    <td style={{ padding: '10px 14px' }}><Badge text={c.status} colour={c.status === 'active' ? '#0FEA7A' : c.status === 'sla' ? '#3B82F6' : '#6B7280'} /></td>
                    <td style={{ padding: '10px 14px', color: openJobs > 0 ? '#F59E0B' : '#6B7280' }}>{openJobs}</td>
                    <td style={{ padding: '10px 14px', color: '#0FEA7A' }}>{doneJobs}</td>
                    <td style={{ padding: '10px 14px', color: rev > 0 ? '#E8F4F3' : '#444', fontWeight: rev > 0 ? 600 : 400 }}>{fmtRand(rev)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── INSIGHTS TAB ───────────────────────────────────────────────────── */}
      {!loading && tab === 'Insights' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {/* Top Service Types */}
            <div style={chartBox}>
              <div style={chartTitle}>Top Service Types</div>
              {SERVICE_TYPES.map(s => {
                const count = jobs.filter(j => j.service_type === s).length;
                if (!count) return null;
                const pct = Math.round((count / jobs.length) * 100);
                return (
                  <div key={s} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: '#E8F4F3' }}>{s}</span>
                      <span style={{ color: '#A8D5D1' }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ background: '#27504D', borderRadius: 4, height: 6 }}>
                      <div style={{ width: `${pct}%`, background: '#0FEA7A', borderRadius: 4, height: 6 }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Revenue by Service */}
            <div style={chartBox}>
              <div style={chartTitle}>Revenue by Service Type</div>
              {(() => {
                const data = SERVICE_TYPES.map(s => ({
                  name: s.length > 18 ? s.slice(0, 18) + '…' : s,
                  amount: jobs.filter(j => j.service_type === s).reduce((sum, j) => sum + (j.amount_rands || 0), 0),
                })).filter(x => x.amount > 0).sort((a, b) => b.amount - a.amount).slice(0, 8);
                return (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#27504D44" />
                      <XAxis type="number" tick={{ fill: '#999', fontSize: 10 }} tickFormatter={v => `R${(v / 1000).toFixed(0)}k`} />
                      <YAxis dataKey="name" type="category" tick={{ fill: '#999', fontSize: 10 }} width={100} />
                      <Tooltip contentStyle={{ background: '#0d1f1e', border: '1px solid #27504D', color: '#E8F4F3' }} formatter={(v: number | undefined) => v != null ? fmtRand(v) : ''} />
                      <Bar dataKey="amount" fill="#0FEA7A" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>
          </div>

          {/* Urgent / Overdue */}
          <div style={chartBox}>
            <div style={chartTitle}>Urgent &amp; Overdue Jobs</div>
            {(() => {
              const now = new Date();
              const flagged = jobs.filter(j =>
                j.priority === 'urgent' ||
                (j.due_date && new Date(j.due_date) < now && !['done', 'closed'].includes(j.status))
              );
              if (!flagged.length) return <div style={{ color: '#16A34A', fontSize: 13, padding: '12px 0' }}>No urgent or overdue jobs.</div>;
              return flagged.map(job => (
                <div key={job.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #27504D22', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#E8F4F3', fontSize: 13 }}>{job.title}</div>
                    <div style={{ fontSize: 11, color: '#A8D5D1' }}>{clientName(clients, job.client_id)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Badge text={job.priority} colour={PRIORITY_COLOUR[job.priority] || '#6B7280'} />
                    {job.due_date && <div style={{ fontSize: 11, color: '#CC0000', marginTop: 4 }}>Due {fmtDate(job.due_date)}</div>}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* ── Job Modal ───────────────────────────────────────────────────────── */}
      {modalJob !== false && (
        <JobModal
          job={modalJob || null}
          clients={clients}
          onClose={() => setModalJob(false)}
          onSave={saveJob}
        />
      )}
    </div>
  );
}

// ─── Shared Styles ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  display: 'block', width: '100%', marginTop: 4, padding: '8px 10px',
  background: '#0a1510', border: '1px solid #27504D', borderRadius: 6,
  color: '#E8F4F3', fontSize: 13,
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
