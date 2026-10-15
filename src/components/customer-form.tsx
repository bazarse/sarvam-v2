'use client'

import { useState } from 'react'

import { apiFetch } from '@/lib/api-client'

export function CustomerForm({
  deviceId,
  initial,
  onChange,
}: {
  deviceId: string
  initial: {
    customerName: string | null
    customerPhone: string | null
    customerAddress: string | null
  }
  onChange: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setBusy(true)
    setSaved(false)
    try {
      await apiFetch(`/api/devices/${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({
          customerName: String(f.get('customerName') || ''),
          customerPhone: String(f.get('customerPhone') || ''),
          customerAddress: String(f.get('customerAddress') || ''),
        }),
      })
      setSaved(true)
      onChange()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-slate-900">Edit Customer</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input name="customerName" defaultValue={initial.customerName ?? ''} placeholder="Customer name" className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
        <input name="customerPhone" defaultValue={initial.customerPhone ?? ''} placeholder="Phone" className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
        <input name="customerAddress" defaultValue={initial.customerAddress ?? ''} placeholder="Address" className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div className="flex items-center gap-3">
        <button disabled={busy} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
          Save
        </button>
        {saved && <span className="text-sm text-emerald-600">Saved</span>}
      </div>
    </form>
  )
}
