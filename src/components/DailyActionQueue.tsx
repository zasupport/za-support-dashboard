'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

type DailyAction = {
  priority: number;
  client_id: string;
  client_name: string;
  phone: string;
  action_type: string;
  badge: string;
  badge_colour: string;
  title: string;
  description: string;
  wa_url: string;
  wa_message: string;
};

const BADGE_CLASSES: Record<string, string> = {
  emerald: 'bg-emerald-800/60 border-emerald-700/40 text-emerald-300',
  amber:   'bg-amber-800/60 border-amber-700/40 text-amber-300',
  blue:    'bg-blue-800/60 border-blue-700/40 text-blue-300',
  orange:  'bg-orange-800/60 border-orange-700/40 text-orange-300',
  purple:  'bg-purple-800/60 border-purple-700/40 text-purple-300',
  slate:   'bg-slate-700/60 border-slate-600/40 text-slate-300',
};

export function DailyActionQueue() {
  const [actions, setActions] = useState<DailyAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/clients/daily-actions')
      .then(r => r.ok ? r.json() : [])
      .then(d => setActions(Array.isArray(d) ? d : d.actions ?? []))
      .catch(() => setActions([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || actions.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Priority Actions</p>
      {actions.map((a, i) => {
        const badgeCls = BADGE_CLASSES[a.badge_colour] ?? BADGE_CLASSES.slate;
        return (
          <Card key={i} className="bg-slate-800/80 border-slate-700">
            <CardContent className="p-3 flex items-center gap-3">
              <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium ${badgeCls}`}>
                {a.badge}
              </span>
              <div className="flex-1 min-w-0">
                <a href={`/clients/${a.client_id}`} className="text-white text-sm font-medium hover:text-teal-400 transition-colors">
                  {a.client_name}
                </a>
                <p className="text-slate-400 text-xs truncate">{a.title}</p>
              </div>
              {a.wa_url && (
                <a
                  href={a.wa_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 text-xs px-2.5 py-1 rounded-full bg-green-800/50 hover:bg-green-700/60 text-green-300 hover:text-white border border-green-700/40 transition-colors whitespace-nowrap"
                >
                  WhatsApp →
                </a>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
