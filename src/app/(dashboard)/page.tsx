'use client'

import { useEffect, useState } from 'react'

import { apiFetch } from '@/lib/api-client'
import { StatCard } from '@/components/stat-card'
import { formatCurrency } from '@/lib/utils'

interface Stats {
  total: number
  locked: number
  active: number
  offline: number
  collectionToday: number
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<Stats>('/api/stats')
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard label="Total Devices" value={stats.total} />
          <StatCard label="Active" value={stats.active} accent="success" />
          <StatCard label="Locked" value={stats.locked} accent="danger" />
          <StatCard label="Offline 48h+" value={stats.offline} accent="warning" />
          <StatCard
            label="Collected Today"
            value={formatCurrency(stats.collectionToday)}
          />
        </div>
      )}
    </div>
  )
}
