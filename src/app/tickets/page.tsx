'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Ticket, Plus, RefreshCw, AlertCircle, CheckCircle, Clock, Wrench } from 'lucide-react';

type TicketItem = {
  id: string;
  ticket_number: string;
  title: string;
  description: string;
  source: string;
  status: string;
  priority: string;
  ai_classification: string | null;
  ai_recommendation: string | null;
  ai_summary: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
};

const PRIORITY_COLOURS: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 border-red-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  low: 'bg-green-100 text-green-800 border-green-300',
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  open: <AlertCircle className="w-4 h-4 text-blue-500" />,
  in_progress: <Clock className="w-4 h-4 text-yellow-500" />,
  resolved: <CheckCircle className="w-4 h-4 text-green-500" />,
  closed: <CheckCircle className="w-4 h-4 text-gray-400" />,
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<TicketItem | null>(null);
  const [form, setForm] = useState({ title: '', description: '', contact_name: '', contact_email: '', contact_phone: '' });

  const load = async () => {
    setLoading(true);
    const params = statusFilter ? `?status=${statusFilter}` : '';
    const res = await fetch(`/api/tickets${params}`);
    const data = await res.json();
    setTickets(data.data || []);
    setTotal(data.meta?.total || 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter]);

  const submit = async () => {
    if (!form.title || !form.description) return;
    setSubmitting(true);
    await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, source: 'dashboard' }),
    });
    setSubmitting(false);
    setShowForm(false);
    setForm({ title: '', description: '', contact_name: '', contact_email: '', contact_phone: '' });
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/tickets/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
    if (selected?.id === id) setSelected(s => s ? { ...s, status } : null);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Ticket className="w-7 h-7 text-[#27504D]" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
            <p className="text-sm text-gray-500">{total} total · open via dashboard, WhatsApp, or email</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setShowForm(true)} className="bg-[#27504D] hover:bg-[#1e3d3a] text-white">
            <Plus className="w-4 h-4 mr-1" /> New Ticket
          </Button>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {['', 'open', 'in_progress', 'resolved', 'closed'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
              statusFilter === s
                ? 'bg-[#27504D] text-white border-[#27504D]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-[#27504D]'
            }`}
          >
            {s === '' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* New ticket form */}
      {showForm && (
        <Card className="border-[#27504D] border-2">
          <CardHeader>
            <CardTitle className="text-lg">Open a New Ticket</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Brief issue description"
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact name</label>
                <input className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Client name"
                  value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea className="w-full border rounded-md px-3 py-2 text-sm min-h-[80px]"
                placeholder="Describe the problem in detail..."
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" className="w-full border rounded-md px-3 py-2 text-sm"
                  value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input className="w-full border rounded-md px-3 py-2 text-sm"
                  value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={submit} disabled={submitting || !form.title || !form.description}
                className="bg-[#27504D] hover:bg-[#1e3d3a] text-white">
                {submitting ? 'Submitting…' : 'Submit Ticket'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
            <p className="text-xs text-gray-400">
              Claude AI will immediately triage this ticket and alert Courtney + Mary.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket list */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="text-center text-gray-400 py-12">Loading tickets…</div>
          ) : tickets.length === 0 ? (
            <div className="text-center text-gray-400 py-12">No tickets found</div>
          ) : tickets.map(ticket => (
            <Card
              key={ticket.id}
              className={`cursor-pointer hover:shadow-md transition-shadow border ${selected?.id === ticket.id ? 'border-[#27504D] ring-1 ring-[#27504D]' : 'border-gray-200'}`}
              onClick={() => setSelected(ticket)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {STATUS_ICON[ticket.status] || <Ticket className="w-4 h-4" />}
                    <span className="font-mono text-xs text-gray-400">{ticket.ticket_number}</span>
                    <Badge className={`text-xs border ${PRIORITY_COLOURS[ticket.priority] || 'bg-gray-100 text-gray-600'}`}>
                      {ticket.priority}
                    </Badge>
                    {ticket.ai_classification && (
                      <Badge variant="outline" className="text-xs">{ticket.ai_classification}</Badge>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {new Date(ticket.created_at).toLocaleDateString('en-ZA')}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mt-2">{ticket.title}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ticket.description}</p>
                {ticket.contact_name && (
                  <p className="text-xs text-gray-400 mt-2">👤 {ticket.contact_name} · via {ticket.source}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Ticket detail panel */}
        <div className="lg:col-span-1">
          {selected ? (
            <Card className="sticky top-6">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{selected.ticket_number}</CardTitle>
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="font-semibold text-gray-900">{selected.title}</p>
                  <p className="text-gray-600 mt-1">{selected.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-400">Priority</span><p className="font-medium capitalize">{selected.priority}</p></div>
                  <div><span className="text-gray-400">Status</span><p className="font-medium capitalize">{selected.status.replace('_', ' ')}</p></div>
                  <div><span className="text-gray-400">Source</span><p className="font-medium capitalize">{selected.source}</p></div>
                  <div><span className="text-gray-400">Type</span><p className="font-medium">{selected.ai_classification || '—'}</p></div>
                </div>
                {selected.contact_name && (
                  <div className="border-t pt-3 text-xs space-y-1">
                    <p className="font-medium text-gray-700">Contact</p>
                    <p>{selected.contact_name}</p>
                    {selected.contact_email && <p className="text-blue-600">{selected.contact_email}</p>}
                    {selected.contact_phone && <p>{selected.contact_phone}</p>}
                  </div>
                )}
                {selected.ai_summary && (
                  <div className="bg-blue-50 rounded-lg p-3 text-xs">
                    <p className="font-semibold text-blue-800 mb-1">AI Summary</p>
                    <p className="text-blue-700">{selected.ai_summary}</p>
                  </div>
                )}
                {selected.ai_recommendation && (
                  <div className="bg-green-50 rounded-lg p-3 text-xs">
                    <p className="font-semibold text-green-800 mb-1">Recommendation</p>
                    <p className="text-green-700">{selected.ai_recommendation}</p>
                  </div>
                )}
                <div className="border-t pt-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">Update Status</p>
                  <div className="flex flex-wrap gap-1">
                    {['open', 'in_progress', 'resolved', 'closed'].map(s => (
                      <button
                        key={s}
                        onClick={() => updateStatus(selected.id, s)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          selected.status === s
                            ? 'bg-[#27504D] text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {s.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Ticket className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">Select a ticket to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
