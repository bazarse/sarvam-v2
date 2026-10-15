'use client'

import { useCallback, useEffect, useState } from 'react'

import { apiFetch } from '@/lib/api-client'
import { StatCard } from '@/components/stat-card'
import { formatCurrency } from '@/lib/utils'

interface Summary {
  collected: { amount: number; count: number }
  pending: { amount: number; count: number }
  overdue: { amount: number; count: number }
}
interface DailyCash {
  date: string
  perStaff: { actorId: string; count: number; total: number }[]
  shopTotal: number
}

export default function ReportsPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [daily, setDaily] = useState<DailyCash | null>(null)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<Summary>('/api/reports/collection-summary')
      .then(setSummary)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
  }, [])

  const loadDaily = useCallback(() => {
    apiFetch<DailyCash>(`/api/reports/daily-cash?date=${date}`)
      .then(setDaily)
      .catch(() => setDaily(null))
  }, [date])
  useEffect(() => loadDaily(), [loadDaily])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {summary && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard label="Collected" value={formatCurrency(summary.collected.amount)} accent="success" />
          <StatCard label="Pending" value={formatCurrency(summary.pending.amount)} />
          <StatCard label="Overdue" value={formatCurrency(summary.overdue.amount)} accent="danger" />
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Daily Cash Collection</h2>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        {daily && (
          <>
            <p className="mb-2 text-sm text-slate-700">
              Total for {daily.date}: <strong>{formatCurrency(daily.shopTotal)}</strong>
            </p>
            <div className="space-y-1 text-sm">
              {daily.perStaff.map((s) => (
                <div key={s.actorId} className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="font-mono text-xs text-slate-500">{s.actorId.slice(0, 10)}</span>
                  <span>{s.count} payments</span>
                  <span className="font-medium">{formatCurrency(s.total)}</span>
                </div>
              ))}
              {daily.perStaff.length === 0 && (
                <p className="text-slate-500">No cash collected on this date.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
