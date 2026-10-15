'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

import { apiFetch, apiPost } from '@/lib/api-client'
import type { Org } from './org-section'

interface Shop {
  id: string
  name: string
  city: string | null
  org: { name: string } | null
  _count: { devices: number; users: number }
}

export function PlatformShopSection({ reloadKey }: { reloadKey: number }) {
  const [shops, setShops] = useState<Shop[]>([])
  const [orgs, setOrgs] = useState<Org[]>([])
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    apiFetch<{ items: Shop[] }>('/api/shops?pageSize=100').then((d) => setShops(d.items)).catch(() => {})
    apiFetch<{ items: Org[] }>('/api/orgs').then((d) => setOrgs(d.items)).catch(() => {})
  }, [])
  useEffect(() => load(), [load, reloadKey])

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setBusy(true)
    try {
      await apiPost('/api/shops', {
        orgId: String(f.get('orgId')),
        name: String(f.get('name')),
        city: String(f.get('city') || ''),
        phone: String(f.get('phone') || ''),
      })
      ;(e.target as HTMLFormElement).reset()
      load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">All Shops</h2>
      <form onSubmit={create} className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-4">
        <select name="orgId" required className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
          <option value="">Select org…</option>
          {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <input name="name" required placeholder="Shop name" className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
        <input name="city" placeholder="City" className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
        <input name="phone" placeholder="Phone" className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
        <button disabled={busy} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
          Create Shop
        </button>
      </form>
      <div className="grid gap-3 md:grid-cols-3">
        {shops.map((s) => (
          <Link key={s.id} href={`/shops/${s.id}`} className="rounded-xl border border-slate-200 bg-white p-4 text-sm hover:border-brand-500">
            <p className="font-semibold text-slate-900">{s.name}</p>
            <p className="text-xs text-slate-500">{s.org?.name} · {s.city ?? '-'}</p>
            <p className="mt-2 text-slate-700">{s._count.devices} devices · {s._count.users} staff</p>
            <span className="text-xs text-brand-600">Manage staff →</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
