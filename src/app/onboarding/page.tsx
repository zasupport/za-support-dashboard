'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, ClipboardList, CalendarCheck, RefreshCw, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

type OnboardingSession = {
  id: string;
  contact_name?: string;
  contact_email?: string;
  journey_type: string;
  status: string;
  created_at: string;
  completed_at?: string;
  notes?: string;
};

type Journey = {
  journey_type: string;
  label?: string;
  description?: string;
};

const JOURNEY_META: Record<string, { label: string; description: string; icon: React.ReactNode; colour: string }> = {
  workshop_booking: {
    label: 'Workshop Booking',
    description: 'Mac repair and upgrade intake — device drop-off, quote, approval, collection.',
    icon: <ClipboardList className="w-6 h-6" />,
    colour: 'bg-orange-50 border-orange-200 text-orange-800',
  },
  site_assessment: {
    label: 'Site Assessment',
    description: 'On-site IT audit — network, devices, security posture, risk report.',
    icon: <CalendarCheck className="w-6 h-6" />,
    colour: 'bg-blue-50 border-blue-200 text-blue-800',
  },
  sla_checkin: {
    label: 'SLA Check-In',
    description: 'Scheduled SLA client health review — Health Check report, renewal, upsell.',
    icon: <Users className="w-6 h-6" />,
    colour: 'bg-teal-50 border-teal-200 text-teal-800',
  },
};

const STATUS_COLOURS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
  completed: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-300',
};

const JOURNEY_BADGE: Record<string, string> = {
  workshop_booking: 'bg-orange-100 text-orange-800 border-orange-300',
  site_assessment: 'bg-blue-100 text-blue-800 border-blue-300',
  sla_checkin: 'bg-teal-100 text-teal-800 border-teal-300',
};

function formatDate(ts?: string) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function OnboardingPage() {
  const [sessions, setSessions] = useState<OnboardingSession[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<OnboardingSession | null>(null);
  const [journeyFilter, setJourneyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [counts, setCounts] = useState<Record<string, number>>({});

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (journeyFilter) params.set('journey_type', journeyFilter);
    if (statusFilter) params.set('status', statusFilter);
    try {
      const res = await fetch(`/api/onboarding/sessions?${params}`);
      const data = await res.json();
      const list: OnboardingSession[] = data.data || [];
      setSessions(list);
      setTotal(data.meta?.total || list.length);

      // Compute per-journey counts from unfiltered data if no filters
      if (!journeyFilter && !statusFilter) {
        const c: Record<string, number> = {};
        list.forEach(s => { c[s.journey_type] = (c[s.journey_type] || 0) + 1; });
        setCounts(c);
      }
    } catch {
      setSessions([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [journeyFilter, statusFilter]);

  const journeyTypes = Object.keys(JOURNEY_META);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-7 h-7 text-[#27504D]" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Onboarding Sessions</h1>
            <p className="text-sm text-gray-500">{total} sessions · Workshop, Site Assessment, SLA Check-In</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Journey type cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {journeyTypes.map(jt => {
          const meta = JOURNEY_META[jt];
          const count = counts[jt] || 0;
          const active = journeyFilter === jt;
          return (
            <button
              key={jt}
              onClick={() => setJourneyFilter(active ? '' : jt)}
              className={`text-left rounded-xl border-2 p-4 transition-all ${
                active
                  ? 'border-[#27504D] bg-[#27504D]/5 shadow-md'
                  : 'border-gray-200 bg-white hover:border-[#27504D]/50 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className={`p-2 rounded-lg border ${meta.colour}`}>
                  {meta.icon}
                </div>
                <span className="text-2xl font-bold text-gray-900">{count}</span>
              </div>
              <p className="font-semibold text-gray-900 mt-3">{meta.label}</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{meta.description}</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-sm text-gray-500 font-medium">Status:</span>
        {['', 'pending', 'in_progress', 'completed', 'cancelled'].map(s => (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions list */}
        <div className="lg:col-span-2 space-y-2">
          {loading ? (
            <div className="text-center text-gray-400 py-12">Loading sessions…</div>
          ) : sessions.length === 0 ? (
            <div className="text-center text-gray-400 py-12">No sessions found</div>
          ) : sessions.map(session => {
            const meta = JOURNEY_META[session.journey_type];
            return (
              <Card
                key={session.id}
                className={`cursor-pointer hover:shadow-md transition-shadow border ${
                  selected?.id === session.id ? 'border-[#27504D] ring-1 ring-[#27504D]' : 'border-gray-200'
                }`}
                onClick={() => setSelected(session)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <Badge className={`text-xs border shrink-0 ${JOURNEY_BADGE[session.journey_type] || 'bg-gray-100 text-gray-600'}`}>
                        {meta?.label || session.journey_type}
                      </Badge>
                      <Badge className={`text-xs border shrink-0 ${STATUS_COLOURS[session.status] || 'bg-gray-100 text-gray-600'}`}>
                        {session.status.replace('_', ' ')}
                      </Badge>
                      <span className="font-mono text-xs text-gray-400 truncate max-w-[120px]">
                        {session.id.slice(0, 8)}…
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-gray-400">{formatDate(session.created_at)}</span>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </div>
                  {session.contact_name && (
                    <p className="text-sm font-medium text-gray-800 mt-2">{session.contact_name}</p>
                  )}
                  {session.contact_email && (
                    <p className="text-xs text-gray-400">{session.contact_email}</p>
                  )}
                  {session.notes && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{session.notes}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-1">
          {selected ? (
            <Card className="sticky top-6">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Session Detail</CardTitle>
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge className={`text-xs border ${JOURNEY_BADGE[selected.journey_type] || 'bg-gray-100 text-gray-600'}`}>
                    {JOURNEY_META[selected.journey_type]?.label || selected.journey_type}
                  </Badge>
                  <Badge className={`text-xs border ${STATUS_COLOURS[selected.status] || 'bg-gray-100 text-gray-600'}`}>
                    {selected.status.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-400">Session ID</p>
                    <p className="font-mono text-xs text-gray-600 break-all">{selected.id}</p>
                  </div>
                  {selected.contact_name && (
                    <div>
                      <p className="text-xs text-gray-400">Contact</p>
                      <p className="font-medium text-gray-900">{selected.contact_name}</p>
                    </div>
                  )}
                  {selected.contact_email && (
                    <div>
                      <p className="text-xs text-gray-400">Email</p>
                      <p className="text-blue-600">{selected.contact_email}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-400">Created</p>
                    <p className="text-gray-700">{formatDate(selected.created_at)}</p>
                  </div>
                  {selected.completed_at && (
                    <div>
                      <p className="text-xs text-gray-400">Completed</p>
                      <p className="text-gray-700">{formatDate(selected.completed_at)}</p>
                    </div>
                  )}
                </div>

                {selected.notes && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-600 mb-1">Notes</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{selected.notes}</p>
                  </div>
                )}

                <div className="border-t pt-3">
                  <p className="text-xs text-gray-400 mb-1">Journey</p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {JOURNEY_META[selected.journey_type]?.description || '—'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">Select a session to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
