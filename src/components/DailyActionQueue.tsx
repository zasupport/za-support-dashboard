'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Action {
  priority: number;
  client_id: string;
  client_name: string;
  phone: string;
  action_type: string;
  badge: string;
  badge_colour: 'emerald' | 'red' | 'amber' | 'orange' | 'slate' | 'sky';
  title: string;
  description: string;
  wa_url: string;
  wa_message: string;
}

const BADGE_CLASSES: Record<string, string> = {
  emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  red:     'bg-red-500/20 text-red-300 border-red-500/30',
  amber:   'bg-amber-500/20 text-amber-300 border-amber-500/30',
  orange:  'bg-orange-500/20 text-orange-300 border-orange-500/30',
  slate:   'bg-slate-600/40 text-slate-300 border-slate-500/30',
  sky:     'bg-sky-500/20 text-sky-300 border-sky-500/30',
};

const ACTION_ICON: Record<string, string> = {
  portal_viewed:    '👁',
  proposal_expiring: '⏰',
  upsell_ready:     '💰',
  scan_overdue:     '🔍',
  no_scan_yet:      '🔧',
  new_client:       '👋',
};

export function DailyActionQueue() {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/clients/daily-actions')
      .then(r => r.json())
      .then(d => { setActions(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (actions.length === 0) return null;

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <span className="text-base">📋</span>
          Today&apos;s Client Actions
          <span className="text-xs font-normal text-slate-400">
            {actions.length} action{actions.length !== 1 ? 's' : ''}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">

        {actions.map((action, idx) => {
          const open = expanded === idx;
          const badgeCls = BADGE_CLASSES[action.badge_colour] || BADGE_CLASSES.slate;
          const icon = ACTION_ICON[action.action_type] || '📌';

          return (
            <div key={idx} className="rounded-md border border-slate-700 bg-slate-700/20">
              {/* Header row — always visible */}
              <button
                className="w-full text-left px-3 py-2.5 flex items-center justify-between gap-2"
                onClick={() => setExpanded(open ? null : idx)}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-base shrink-0">{icon}</span>
                  <span className="text-xs text-slate-200 truncate flex-1">{action.title}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded border font-medium shrink-0 ${badgeCls}`}>
                    {action.badge}
                  </span>
                </div>
                <span className="text-slate-500 text-xs shrink-0 ml-1">{open ? '▲' : '▼'}</span>
              </button>

              {/* Expanded — description + action buttons */}
              {open && (
                <div className="px-3 pb-3 border-t border-slate-700/60 pt-2.5 space-y-2.5">
                  <p className="text-xs text-slate-400">{action.description}</p>

                  {/* Pre-composed WhatsApp preview */}
                  <div className="bg-slate-900/50 rounded-md p-2.5 border border-slate-700/50">
                    <p className="text-xs text-slate-500 mb-1 font-medium">Pre-composed message:</p>
                    <p className="text-xs text-slate-300 leading-relaxed">{action.wa_message}</p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 flex-wrap">
                    <a
                      href={action.wa_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded font-medium transition-colors"
                    >
                      <span>📱</span>
                      Send on WhatsApp
                    </a>
                    <a
                      href={`tel:${action.phone}`}
                      className="flex items-center gap-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded font-medium transition-colors"
                    >
                      <span>📞</span>
                      Call
                    </a>
                    <a
                      href={`/clients/${action.client_id}`}
                      className="flex items-center gap-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded font-medium transition-colors"
                    >
                      View profile
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}

      </CardContent>
    </Card>
  );
}
