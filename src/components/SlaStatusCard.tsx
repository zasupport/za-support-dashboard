'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SlaStatus {
  client_id: string
  sla_active: boolean
  sla_start_date: string | null
  sla_renewal_date: string | null
  days_until_renewal: number | null
  renewal_status: 'current' | 'due_soon' | 'overdue'
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function SlaStatusCard({ clientId }: { clientId: string }) {
  const [status, setStatus] = useState<SlaStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/clients/${clientId}/sla-status`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setStatus(d))
      .catch(() => setStatus(null))
      .finally(() => setLoading(false))
  }, [clientId])

  if (loading) return <div className="animate-pulse h-24 bg-slate-700/50 rounded-xl" />
  if (!status) return null

  const { sla_active, sla_start_date, sla_renewal_date, days_until_renewal, renewal_status } = status

  const renewalColour =
    renewal_status === 'overdue'
      ? 'text-red-400'
      : renewal_status === 'due_soon'
      ? 'text-amber-400'
      : 'text-slate-400'

  const renewalBg =
    renewal_status === 'overdue'
      ? 'bg-red-500/10 border-red-500/30'
      : renewal_status === 'due_soon'
      ? 'bg-amber-500/10 border-amber-500/30'
      : 'bg-slate-700/20 border-slate-700'

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-sm flex items-center justify-between">
          SLA Agreement
          {sla_active ? (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
              Active
            </span>
          ) : (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-700/50 text-slate-400 border border-slate-600 font-medium">
              No SLA
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0 pt-0">
        {sla_active && sla_start_date && (
          <>
            <div className="flex gap-4 py-1.5 border-b border-slate-700/50">
              <span className="text-slate-500 text-xs w-32 shrink-0">Start date</span>
              <span className="text-slate-200 text-xs">{formatDate(sla_start_date)}</span>
            </div>
            <div className="flex gap-4 py-1.5 border-b border-slate-700/50">
              <span className="text-slate-500 text-xs w-32 shrink-0">Renewal date</span>
              <span className="text-slate-200 text-xs">{formatDate(sla_renewal_date)}</span>
            </div>
            <div className={`mt-3 rounded-md border px-3 py-2 text-xs font-medium ${renewalColour} ${renewalBg}`}>
              {renewal_status === 'overdue' && `Renewal overdue by ${Math.abs(days_until_renewal!)} days`}
              {renewal_status === 'due_soon' && `Renewal due in ${days_until_renewal} days`}
              {renewal_status === 'current' && `Renewal in ${days_until_renewal} days`}
            </div>
          </>
        )}
        {!sla_active && (
          <p className="text-slate-500 text-xs py-2">
            No SLA agreement recorded. Set one when assigning a machine or via the client record.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
