'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

import { apiFetch } from '@/lib/api-client'
import { NewShopForm } from '@/components/new-shop-form'
import { useAuth } from '@/hooks/use-auth'

interface ShopRow {
  id: string
  name: string
  city: string | null
  phone: string | null
  isActive: boolean
  _count: { devices: number; users: number }
}

export default function ShopsPage() {
  const { user } = useAuth()
  const [shops, setShops] = useState<ShopRow[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    apiFetch<{ items: ShopRow[] }>('/api/shops')
      .then((d) => setShops(d.items))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
  }, [])

  useEffect(() => load(), [load])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Shops</h1>
        {(user?.role === 'OWNER' || user?.role === 'SUPER_ADMIN') && (
          <NewShopForm onCreated={load} superAdmin={user?.role === 'SUPER_ADMIN'} />
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {shops.map((s) => (
          <Link
            key={s.id}
            href={`/shops/${s.id}`}
            className="rounded-xl border border-slate-200 bg-white p-5 hover:border-brand-500"
          >
            <h2 className="font-semibold text-slate-900">{s.name}</h2>
            <p className="text-sm text-slate-500">{s.city ?? '-'}</p>
            <p className="mt-1 text-sm text-slate-500">{s.phone ?? ''}</p>
            <div className="mt-3 flex gap-4 text-sm">
              <span className="text-slate-700">{s._count.devices} devices</span>
              <span className="text-slate-700">{s._count.users} staff</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
