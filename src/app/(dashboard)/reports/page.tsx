'use client'

import { useEffect, useState } from 'react'

import { apiFetch } from '@/lib/api-client'
import { StatCard } from '@/components/stat-card'
import { formatCurrency } from '@/lib/utils'

interface Summary {
  collected: { amount: number; count: number }
  pending: { amount: number; count: number }
  overdue: { amount: number; count: number }
}

export default function ReportsPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<Summary>('/api/reports/collection-summary')
      .then(setSummary)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {summary && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            label="Collected"
            value={formatCurrency(summary.collected.amount)}
            accent="success"
          />
          <StatCard
            label="Pending"
            value={formatCurrency(summary.pending.amount)}
          />
          <StatCard
            label="Overdue"
            value={formatCurrency(summary.overdue.amount)}
            accent="danger"
          />
        </div>
      )}
    </div>
  )
}
