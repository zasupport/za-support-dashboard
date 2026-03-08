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
  'ntfy',
  'email',
  'whatsapp',
  'slack',
  'anthropic',
  'docuseal',
  'payfast',
  'microsoft_graph',
];

interface ServiceMeta {
  steps: string;
  time: string;
  value: string;
  signupUrl: string;
  signupLabel: string;
  renderPath: string;
}

const SERVICE_META: Record<string, ServiceMeta> = {
  ntfy: {
    steps: '1 step',
    time: '30 sec',
    value: 'Instant iPhone/Android push — portal views, backend alerts, critical events',
    signupUrl: 'https://ntfy.sh/',
    signupLabel: 'Install ntfy app (iOS/Android) — free',
    renderPath: 'App Store → ntfy → Subscribe to: zasupport-courtney-alerts',
  },
  email: {
    steps: '3 steps',
    time: '2 min',
    value: 'Activates all automated client emails (52+/year per client)',
    signupUrl: 'https://resend.com/signup',
    signupLabel: 'Sign up at resend.com (free)',
    renderPath: 'Render → Environment → RESEND_API_KEY',
  },
  whatsapp: {
    steps: '4 steps',
    time: '10 min',
    value: 'Activates monthly WhatsApp summaries + real-time scan alerts to clients',
    signupUrl: 'https://business.facebook.com/wa/manage/phone-numbers/',
    signupLabel: 'Meta Business → WhatsApp API',
    renderPath: 'Render → WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID',
  },
  slack: {
    steps: '2 steps',
    time: '2 min',
    value: 'Activates Courtney alerts for backend issues, ISP outages, critical events',
    signupUrl: 'https://api.slack.com/messaging/webhooks',
    signupLabel: 'Slack → Apps → Incoming Webhooks',
    renderPath: 'Render → HC_NOTIFY_DISCORD_WEBHOOK (accepts Slack webhook URL)',
  },
  anthropic: {
    steps: '2 steps',
    time: '1 min',
    value: 'Activates AI-powered research digests + diagnostic verification',
    signupUrl: 'https://console.anthropic.com/settings/keys',
    signupLabel: 'console.anthropic.com → API Keys',
    renderPath: 'Render → ANTHROPIC_API_KEY',
  },
  docuseal: {
    steps: '3 steps',
    time: '3 min',
    value: 'Activates e-signature contracts — clients sign SLA/CyberShield agreements online',
    signupUrl: 'https://cloud.docuseal.co/users/sign_up',
    signupLabel: 'Sign up at cloud.docuseal.co (free)',
    renderPath: 'Render → DOCUSEAL_API_KEY + DOCUSEAL_TEMPLATE_ID',
  },
  payfast: {
    steps: '3 steps',
    time: '5 min',
    value: 'Activates online debit orders — clients pay and activate SLA same day',
    signupUrl: 'https://sandbox.payfast.co.za/registration/merchant',
    signupLabel: 'Register at PayFast sandbox',
    renderPath: 'Render → PAYFAST_MERCHANT_ID + PAYFAST_MERCHANT_KEY',
  },
  microsoft_graph: {
    steps: '5 steps',
    time: '15 min',
    value: 'Activates M365 email (requires Exchange Online) + OneDrive document storage',
    signupUrl: 'https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade',
    signupLabel: 'portal.azure.com → App registrations',
    renderPath: 'Render → MS_TENANT_ID + MS_CLIENT_ID + MS_CLIENT_SECRET',
  },
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

  // Highlight email first — it's the highest-value single activation
  const emailMissing = notConfigured.includes('email');

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

        {/* Quick-win banner when email is not configured */}
        {emailMissing && (
          <div className="mb-3 p-2.5 rounded-md bg-teal-500/10 border border-teal-500/30">
            <p className="text-xs text-teal-300 font-medium mb-1">Quickest win — activate email in 2 min</p>
            <p className="text-xs text-slate-400 mb-2">resend.com free tier (3 000 emails/month) unblocks all automated client communication.</p>
            <div className="flex gap-2">
              <a
                href="https://resend.com/signup"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-teal-600 hover:bg-teal-500 text-white px-2.5 py-1 rounded font-medium transition-colors"
              >
                Sign up free →
              </a>
              <span className="text-xs text-slate-500 self-center">then set RESEND_API_KEY on Render</span>
            </div>
          </div>
        )}

        {/* Not configured — expandable with activation wizard */}
        {notConfigured.length > 0 && (
          <div className="mb-2">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1.5">Needs activation</p>
            {notConfigured.map(key => {
              const svc  = services[key];
              const meta = SERVICE_META[key];
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
                      {meta && (
                        <span className="text-xs text-slate-600 shrink-0">{meta.steps} · {meta.time}</span>
                      )}
                    </div>
                    <span className="text-slate-500 text-xs shrink-0">{open ? '▲' : '▼'}</span>
                  </button>

                  {open && (
                    <div className="px-3 pb-3 space-y-2.5 border-t border-amber-500/20 pt-2.5">

                      {/* Value unlocked */}
                      {meta && (
                        <div className="flex items-start gap-1.5">
                          <span className="text-emerald-400 text-xs mt-0.5 shrink-0">✓</span>
                          <p className="text-xs text-slate-300">{meta.value}</p>
                        </div>
                      )}

                      {/* Activation steps */}
                      {meta && (
                        <div className="space-y-1.5">
                          <p className="text-xs text-slate-500 font-medium">How to activate:</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-600 font-mono bg-slate-700/50 px-1.5 py-0.5 rounded shrink-0">1</span>
                            <a
                              href={meta.signupUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-sky-400 hover:text-sky-300 underline underline-offset-2 transition-colors"
                            >
                              {meta.signupLabel}
                            </a>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-xs text-slate-600 font-mono bg-slate-700/50 px-1.5 py-0.5 rounded shrink-0">2</span>
                            <p className="text-xs text-slate-400">{meta.renderPath}</p>
                          </div>
                        </div>
                      )}

                      {/* Env var codes */}
                      {svc.missing.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Env vars to set:</p>
                          <div className="flex flex-wrap gap-1">
                            {svc.missing.map(v => (
                              <code key={v} className="text-xs bg-slate-700 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                                {v}
                              </code>
                            ))}
                          </div>
                        </div>
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
