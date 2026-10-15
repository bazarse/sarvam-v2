'use client'

import { useState } from 'react'

import { apiPost } from '@/lib/api-client'

export function NewShopForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setBusy(true)
    try {
      await apiPost('/api/shops', {
        name: String(f.get('name')),
        city: String(f.get('city') || ''),
        state: String(f.get('state') || ''),
        phone: String(f.get('phone') || ''),
        address: String(f.get('address') || ''),
      })
      ;(e.target as HTMLFormElement).reset()
      setOpen(false)
      onCreated()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
      >
        + New Shop
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-slate-900">New Shop</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input name="name" required placeholder="Shop name" className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
        <input name="phone" placeholder="Phone" className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
        <input name="city" placeholder="City" className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
        <input name="state" placeholder="State" className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
        <input name="address" placeholder="Address" className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm sm:col-span-2" />
      </div>
      <div className="flex gap-2">
        <button disabled={busy} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
          Create
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">
          Cancel
        </button>
      </div>
    </form>
  )
}
