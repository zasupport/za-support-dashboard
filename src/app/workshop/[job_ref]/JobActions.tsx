'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight, Loader2, CalendarDays, Clock, User, FileText, Mail } from 'lucide-react';

const STATUS_NEXT: Record<string, string> = {
  open:          'in_progress',
  in_progress:   'waiting_parts',
  waiting_parts: 'completed',
};

const STATUS_NEXT_LABEL: Record<string, string> = {
  open:          'Start Job',
  in_progress:   'Waiting on Parts',
  waiting_parts: 'Mark Done',
};

export function JobActions({
  jobRef,
  currentStatus,
  scheduledDate,
  labourMinutes,
  assignedTo,
}: {
  jobRef: string;
  currentStatus: string;
  scheduledDate?: string | null;
  labourMinutes?: number | null;
  assignedTo?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading]           = useState<string | null>(null);
  const [showDate, setShowDate]         = useState(false);
  const [date, setDate]                 = useState(scheduledDate ? scheduledDate.slice(0, 10) : '');
  const [savingDate, setSavingDate]     = useState(false);
  const [showLabour, setShowLabour]     = useState(false);
  const [labour, setLabour]             = useState(String(labourMinutes ?? ''));
  const [savingLabour, setSavingLabour] = useState(false);
  const [showAssign, setShowAssign]     = useState(false);
  const [assignee, setAssignee]         = useState(assignedTo ?? '');
  const [savingAssign, setSavingAssign] = useState(false);
  const [emailingInv, setEmailingInv]   = useState(false);
  const [invMsg, setInvMsg]             = useState<string | null>(null);

  async function advance(status: string) {
    setLoading(status);
    try {
      const res = await fetch(`/api/workshop/${jobRef}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function saveDate() {
    if (!date) return;
    setSavingDate(true);
    try {
      const res = await fetch(`/api/workshop/${jobRef}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduled_date: date }),
      });
      if (res.ok) { setShowDate(false); router.refresh(); }
    } finally {
      setSavingDate(false);
    }
  }

  async function saveLabour() {
    const mins = parseInt(labour);
    if (isNaN(mins)) return;
    setSavingLabour(true);
    try {
      const res = await fetch(`/api/workshop/${jobRef}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labour_minutes: mins }),
      });
      if (res.ok) { setShowLabour(false); router.refresh(); }
    } finally {
      setSavingLabour(false);
    }
  }

  async function saveAssign() {
    setSavingAssign(true);
    try {
      const res = await fetch(`/api/workshop/${jobRef}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: assignee || null }),
      });
      if (res.ok) { setShowAssign(false); router.refresh(); }
    } finally {
      setSavingAssign(false);
    }
  }

  async function emailInvoice() {
    setEmailingInv(true);
    setInvMsg(null);
    try {
      const res = await fetch(`/api/workshop/${jobRef}/invoice?send=true`);
      if (res.ok) {
        setInvMsg('Invoice emailed to client');
      } else {
        setInvMsg('Email failed — check backend logs');
      }
    } catch {
      setInvMsg('Email failed — network error');
    } finally {
      setEmailingInv(false);
      setTimeout(() => setInvMsg(null), 5000);
    }
  }

  const invoiceButtons = (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={`/api/workshop/${jobRef}/invoice`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-xs px-3 py-2 rounded-md text-teal-300 hover:text-white bg-teal-900/40 hover:bg-teal-800/60 border border-teal-700 transition-colors"
      >
        <FileText size={13} />
        Download Invoice PDF
      </a>
      <button
        onClick={emailInvoice}
        disabled={emailingInv}
        className="flex items-center gap-2 text-xs px-3 py-2 rounded-md text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 border border-slate-600 transition-colors disabled:opacity-50"
      >
        {emailingInv ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
        Email Invoice to Client
      </button>
      {invMsg && <span className="text-xs text-teal-400">{invMsg}</span>}
    </div>
  );

  if (currentStatus === 'completed' || currentStatus === 'done' || currentStatus === 'cancelled') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-green-400 text-sm">
          <CheckCircle size={16} />
          {currentStatus === 'cancelled' ? 'Cancelled' : 'Job complete'}
        </div>
        {currentStatus !== 'cancelled' && invoiceButtons}
      </div>
    );
  }

  const nextStatus = STATUS_NEXT[currentStatus];
  const nextLabel  = STATUS_NEXT_LABEL[currentStatus];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {nextStatus && (
          <button
            onClick={() => advance(nextStatus)}
            disabled={!!loading}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-md bg-teal-700 hover:bg-teal-600 text-white font-medium transition-colors disabled:opacity-50"
          >
            {loading === nextStatus ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
            {nextLabel}
          </button>
        )}
        {currentStatus !== 'waiting_parts' && (
          <button
            onClick={() => advance('completed')}
            disabled={!!loading}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-md bg-green-700 hover:bg-green-600 text-white font-medium transition-colors disabled:opacity-50"
          >
            {loading === 'completed' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            Mark Done
          </button>
        )}
        <button
          onClick={() => setShowDate(v => !v)}
          className="flex items-center gap-2 text-xs px-3 py-2 rounded-md text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 border border-slate-600 transition-colors"
        >
          <CalendarDays size={13} />
          {scheduledDate ? `Scheduled: ${new Date(scheduledDate).toLocaleDateString('en-ZA')}` : 'Set Visit Date'}
        </button>
        <button
          onClick={() => setShowLabour(v => !v)}
          className="flex items-center gap-2 text-xs px-3 py-2 rounded-md text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 border border-slate-600 transition-colors"
        >
          <Clock size={13} />
          {labourMinutes ? `Labour: ${labourMinutes}min` : 'Log Labour'}
        </button>
        <button
          onClick={() => setShowAssign(v => !v)}
          className="flex items-center gap-2 text-xs px-3 py-2 rounded-md text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 border border-slate-600 transition-colors"
        >
          <User size={13} />
          {assignedTo ? `@${assignedTo}` : 'Assign'}
        </button>
        <button
          onClick={() => advance('cancelled')}
          disabled={!!loading}
          className="text-xs px-3 py-2 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-700 transition-colors disabled:opacity-50"
        >
          Cancel Job
        </button>
      </div>

      {showDate && (
        <div className="flex items-center gap-2 bg-slate-700/40 border border-slate-600 rounded-md px-3 py-2">
          <CalendarDays size={13} className="text-slate-400 shrink-0" />
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="bg-transparent text-sm text-white focus:outline-none"
          />
          <button
            onClick={saveDate}
            disabled={savingDate || !date}
            className="text-xs px-3 py-1 rounded bg-teal-700 hover:bg-teal-600 text-white font-medium disabled:opacity-50 transition-colors"
          >
            {savingDate ? 'Saving…' : 'Save Date'}
          </button>
          <button onClick={() => setShowDate(false)} className="text-slate-500 hover:text-white text-xs">Cancel</button>
        </div>
      )}

      {showLabour && (
        <div className="flex items-center gap-2 bg-slate-700/40 border border-slate-600 rounded-md px-3 py-2">
          <Clock size={13} className="text-slate-400 shrink-0" />
          <input
            type="number"
            min="0"
            placeholder="Minutes"
            value={labour}
            onChange={e => setLabour(e.target.value)}
            className="bg-transparent text-sm text-white focus:outline-none w-24"
          />
          <span className="text-xs text-slate-500">minutes</span>
          <button
            onClick={saveLabour}
            disabled={savingLabour}
            className="text-xs px-3 py-1 rounded bg-teal-700 hover:bg-teal-600 text-white font-medium disabled:opacity-50 transition-colors"
          >
            {savingLabour ? 'Saving…' : 'Save'}
          </button>
          <button onClick={() => setShowLabour(false)} className="text-slate-500 hover:text-white text-xs">Cancel</button>
        </div>
      )}

      {showAssign && (
        <div className="flex items-center gap-2 bg-slate-700/40 border border-slate-600 rounded-md px-3 py-2">
          <User size={13} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Assignee name"
            value={assignee}
            onChange={e => setAssignee(e.target.value)}
            className="bg-transparent text-sm text-white focus:outline-none flex-1"
          />
          <button
            onClick={saveAssign}
            disabled={savingAssign}
            className="text-xs px-3 py-1 rounded bg-teal-700 hover:bg-teal-600 text-white font-medium disabled:opacity-50 transition-colors"
          >
            {savingAssign ? 'Saving…' : 'Assign'}
          </button>
          <button onClick={() => setShowAssign(false)} className="text-slate-500 hover:text-white text-xs">Cancel</button>
        </div>
      )}

      {invoiceButtons}
    </div>
  );
}
