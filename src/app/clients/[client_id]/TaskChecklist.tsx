'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Task = {
  id: number;
  client_id: string;
  task: string;
  status: string;
  notes: string | null;
  completed_at: string | null;
};

const STATUS_CYCLE: Record<string, string> = {
  pending:     'in_progress',
  in_progress: 'completed',
  completed:   'pending',
  skipped:     'pending',
};

const STATUS_STYLE: Record<string, string> = {
  pending:     'bg-slate-600/40 text-slate-400 border border-slate-600',
  in_progress: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  completed:   'bg-green-500/20  text-green-300  border border-green-500/30',
  skipped:     'bg-slate-500/20  text-slate-500  border border-slate-600',
};

const STATUS_LABEL: Record<string, string> = {
  pending:     'Todo',
  in_progress: 'In Progress',
  completed:   'Done',
  skipped:     'Skipped',
};

export function TaskChecklist({ initialTasks, clientId }: { initialTasks: Task[]; clientId: string }) {
  const [tasks, setTasks]   = useState<Task[]>(initialTasks);
  const [saving, setSaving] = useState<number | null>(null);

  const completedN = tasks.filter(t => t.status === 'completed').length;
  const totalN     = tasks.length;
  const pct        = totalN ? Math.round((completedN / totalN) * 100) : 0;

  async function cycleStatus(task: Task) {
    const next = STATUS_CYCLE[task.status] ?? 'pending';
    setSaving(task.id);
    try {
      const res = await fetch(`/api/clients/${clientId}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...updated } : t));
      }
    } finally {
      setSaving(null);
    }
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white text-sm flex items-center justify-between">
          Onboarding Checklist
          <span className="text-slate-400 font-normal text-xs">{completedN}/{totalN} · {pct}%</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full bg-slate-700 rounded-full h-1.5 mb-5">
          <div
            className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="space-y-1">
          {tasks.map(task => (
            <div
              key={task.id}
              className="flex items-start gap-3 py-2.5 border-b border-slate-700/40 last:border-0"
            >
              <button
                onClick={() => cycleStatus(task)}
                disabled={saving === task.id}
                title="Click to cycle status"
                className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 mt-0.5 cursor-pointer transition-opacity hover:opacity-80 disabled:opacity-40 ${STATUS_STYLE[task.status] ?? STATUS_STYLE.pending}`}
              >
                {saving === task.id ? '...' : STATUS_LABEL[task.status] ?? task.status}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-xs leading-relaxed ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                  {task.task}
                </p>
                {task.notes && (
                  <p className="text-slate-500 text-xs mt-0.5 italic">{task.notes}</p>
                )}
              </div>
              {task.completed_at && (
                <span className="text-slate-600 text-xs shrink-0 mt-0.5">
                  {new Date(task.completed_at).toLocaleDateString('en-ZA')}
                </span>
              )}
            </div>
          ))}
        </div>
        <p className="text-slate-600 text-xs mt-4">Click any status badge to cycle: Todo → In Progress → Done</p>
      </CardContent>
    </Card>
  );
}
