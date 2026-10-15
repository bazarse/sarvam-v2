'use client'

import { useCallback, useEffect, useState } from 'react'

import { apiFetch, apiPost } from '@/lib/api-client'

export interface Org {
  id: string
  name: string
  slug: string
  plan: string
  _count: { shops: number; users: number }
}

export function OrgSection({ onChange }: { onChange: () => void }) {
  const [orgs, setOrgs] = useState<Org[]>([])
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    apiFetch<{ items: Org[] }>('/api/orgs').then((d) => setOrgs(d.items)).catch(() => {})
  }, [])
  useEffect(() => load(), [load])

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setBusy(true)
    try {
      await apiPost('/api/orgs', {
        name: String(f.get('name')),
        slug: String(f.get('slug')).toLowerCase(),
        plan: String(f.get('plan')),
      })
      ;(e.target as HTMLFormElement).reset()
      load()
      onChange()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">Organizations</h2>
      <form onSubmit={create} className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-4">
        <input name="name" required placeholder="Org name" className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
        <input name="slug" required placeholder="slug (a-z-)" className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
        <select name="plan" className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
          <option>FREE</option><option>PRO</option><option>ENTERPRISE</option>
        </select>
        <button disabled={busy} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
          Create Org
        </button>
      </form>
      <div className="grid gap-3 md:grid-cols-3">
        {orgs.map((o) => (
          <div key={o.id} className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <p className="font-semibold text-slate-900">{o.name}</p>
            <p className="text-xs text-slate-500">{o.slug} · {o.plan}</p>
            <p className="mt-2 text-slate-700">{o._count.shops} shops · {o._count.users} users</p>
          </div>
        ))}
      </div>
    </section>
  )
}
