'use client'

import { useState, useEffect } from 'react'

interface SlaConfig {
  client_id: string
  mode: 'diagnostic' | 'continuous'
  collection_interval_seconds: number | null
  tier_code: string
  tier_name: string
  sla_active: boolean
  device_token: string | null
  features: Record<string, unknown>
}

const TIERS = [
  { code: 'standard', name: 'Scout Standard', price: 'R 299/mo', interval: '6 hours' },
  { code: 'pro', name: 'Scout Pro', price: 'R 599/mo', interval: '3 hours' },
]

export default function SlaPanel({ clientId }: { clientId: string }) {
  const [config, setConfig] = useState<SlaConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedTier, setSelectedTier] = useState('standard')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch(`/api/clients/${clientId}/sla`)
      .then(r => r.json())
      .then(d => {
        setConfig(d)
        if (d.tier_code && d.tier_code !== 'diagnostic_only') setSelectedTier(d.tier_code)
      })
      .catch(() => setConfig(null))
      .finally(() => setLoading(false))
  }, [clientId])

  const activate = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/sla`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate', tier_code: selectedTier }),
      })
      const data = await res.json()
      if (data.success) {
        setConfig(prev =>
          prev
            ? { ...prev, sla_active: true, tier_code: selectedTier, device_token: data.device_token }
            : prev
        )
      }
    } finally {
      setSaving(false)
    }
  }

  const deactivate = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/sla`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deactivate' }),
      })
      const data = await res.json()
      if (data.success) {
        setConfig(prev => (prev ? { ...prev, sla_active: false } : prev))
      }
    } finally {
      setSaving(false)
    }
  }

  const copyToken = () => {
    if (config?.device_token) {
      navigator.clipboard.writeText(config.device_token)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) return <div className="animate-pulse h-32 bg-slate-700/50 rounded-xl" />

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white text-sm">Health Check Scout</h3>
          <p className="text-xs text-slate-400 mt-0.5">Ongoing monitoring — activates after diagnostic</p>
        </div>
        {/* Toggle */}
        <button
          onClick={config?.sla_active ? deactivate : activate}
          disabled={saving}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
            config?.sla_active ? 'bg-emerald-500' : 'bg-slate-600'
          }`}
          aria-label={config?.sla_active ? 'Deactivate Scout' : 'Activate Scout'}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              config?.sla_active ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Status badge */}
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          config?.sla_active
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
            : 'bg-slate-700/50 text-slate-400 border border-slate-600'
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${config?.sla_active ? 'bg-emerald-500' : 'bg-slate-500'}`}
        />
        {config?.sla_active ? config.tier_name : 'Diagnostic only'}
      </div>

      {/* Tier selector (shown when inactive) */}
      {!config?.sla_active && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Select tier to activate</p>
          <div className="grid grid-cols-2 gap-2">
            {TIERS.map(t => (
              <button
                key={t.code}
                onClick={() => setSelectedTier(t.code)}
                className={`text-left p-3 rounded-lg border text-xs transition-colors ${
                  selectedTier === t.code
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-600 hover:border-slate-500 text-slate-400'
                }`}
              >
                <div className="font-semibold">{t.name}</div>
                <div className="text-slate-500 mt-0.5">
                  {t.price} · {t.interval}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Device token (shown when active) */}
      {config?.sla_active && config.device_token && (
        <div className="space-y-1.5">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Device Token</p>
          <div className="flex items-center gap-2 bg-slate-900/60 rounded-lg px-3 py-2">
            <code className="text-xs text-slate-300 font-mono flex-1 truncate">{config.device_token}</code>
            <button
              onClick={copyToken}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium shrink-0 transition-colors"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-slate-500">Auto-embedded in PKG — no manual entry needed</p>
        </div>
      )}

      {/* Collection interval info */}
      {config?.sla_active && config.collection_interval_seconds && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Collecting every {config.collection_interval_seconds / 3600}h
        </div>
      )}
    </div>
  )
}
