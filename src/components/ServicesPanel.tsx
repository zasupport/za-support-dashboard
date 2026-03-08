'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ServiceEntry {
  configured: boolean;
  label: string;
  missing: string[];
  impact: string;
}

interface ServicesData {
  services: Record<string, ServiceEntry>;
  summary: {
    total: number;
    configured: number;
    not_configured: number;
  };
}

const SERVICE_ORDER = [
  'whatsapp',
  'email',
  'slack',
  'anthropic',
  'docuseal',
  'payfast',
  'microsoft_graph',
];

const SETUP_HINT: Record<string, string> = {
  whatsapp:         'Meta Business → WhatsApp → API Setup → generate access token and phone number ID. Set WHATSAPP_COURTNEY_PHONE to your mobile number (e.g. 27790539964).',
  email:            'resend.com → sign up free (3 000 emails/month) → API Keys → Create → copy key.',
  slack:            'Slack → Apps → Incoming Webhooks → Add → copy webhook URL.',
  anthropic:        'console.anthropic.com → API Keys → Create key.',
  docuseal:         'cloud.docuseal.co → sign up free → Settings → API Key.',
  payfast:          'sandbox.payfast.co.za → register → Dashboard → Merchant Details.',
  microsoft_graph:  'portal.azure.com → App registrations → ZA Support API → Certificates & secrets.',
};

export function ServicesPanel() {
  const [data, setData] = useState<ServicesData | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/system/services')
      .then(r => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) return null;

  const { services, summary } = data;
  const notConfigured = SERVICE_ORDER.filter(k => services[k] && !services[k].configured);
  const configured    = SERVICE_ORDER.filter(k => services[k] && services[k].configured);

  if (summary.not_configured === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Services — All Active
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-xs">All {summary.total} communication services are configured and active.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          Services
          <span className="text-xs font-normal text-slate-400">
            {summary.configured}/{summary.total} active
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">

        {/* Not configured — highlighted */}
        {notConfigured.length > 0 && (
          <div className="mb-2">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1.5">Needs activation</p>
            {notConfigured.map(key => {
              const svc = services[key];
              const open = expanded === key;
              return (
                <div key={key} className="rounded-md border border-amber-500/30 bg-amber-500/5 mb-1.5">
                  <button
                    className="w-full text-left px-3 py-2 flex items-start justify-between gap-2"
                    onClick={() => setExpanded(open ? null : key)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-amber-300 truncate">{svc.label}</span>
                    </div>
                    <span className="text-slate-500 text-xs shrink-0">{open ? '▲' : '▼'}</span>
                  </button>

                  {open && (
                    <div className="px-3 pb-2.5 space-y-2 border-t border-amber-500/20 pt-2">
                      <p className="text-xs text-slate-400">{svc.impact}</p>

                      {svc.missing.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Set on Render:</p>
                          <div className="flex flex-wrap gap-1">
                            {svc.missing.map(v => (
                              <code key={v} className="text-xs bg-slate-700 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                                {v}
                              </code>
                            ))}
                          </div>
                        </div>
                      )}

                      {SETUP_HINT[key] && (
                        <p className="text-xs text-slate-500 italic">{SETUP_HINT[key]}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Configured — compact list */}
        {configured.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1.5">Active</p>
            <div className="space-y-0.5">
              {configured.map(key => (
                <div key={key} className="flex items-center gap-2 py-1 px-2 rounded bg-slate-700/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-xs text-slate-400">{services[key].label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
