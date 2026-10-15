'use client'

import { useEffect, useState } from 'react'

import { apiFetch } from '@/lib/api-client'
import { formatCurrency } from '@/lib/utils'

interface ShopRow {
  id: string
  name: string
  city: string | null
  phone: string | null
  isActive: boolean
  _count: { devices: number; users: number }
}

export default function ShopsPage() {
  const [shops, setShops] = useState<ShopRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<{ items: ShopRow[] }>('/api/shops')
      .then((d) => setShops(d.items))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
  }, [])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Shops</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {shops.map((s) => (
          <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-900">{s.name}</h2>
            <p className="text-sm text-slate-500">{s.city ?? '-'}</p>
            <p className="mt-1 text-sm text-slate-500">{s.phone ?? ''}</p>
            <div className="mt-3 flex gap-4 text-sm">
              <span className="text-slate-700">{s._count.devices} devices</span>
              <span className="text-slate-700">{s._count.users} staff</span>
            </div>
          </div>
        ))}
      </div>
      {/* Currency helper kept available for future shop revenue stats */}
      <span className="hidden">{formatCurrency(0)}</span>
    </div>
  )
}
