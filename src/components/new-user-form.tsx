'use client'

import { useState } from 'react'

import { apiPost } from '@/lib/api-client'

export function NewUserForm({ shopId, onCreated }: { shopId: string; onCreated: () => void }) {
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setBusy(true)
    try {
      await apiPost('/api/users', {
        shopId,
        username: String(f.get('username')),
        password: String(f.get('password')),
        role: String(f.get('role')),
        email: String(f.get('email') || '') || undefined,
      })
      ;(e.target as HTMLFormElement).reset()
      onCreated()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-slate-900">Add Staff</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input name="username" required placeholder="Username" className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
        <input name="password" required type="text" placeholder="Password (min 6)" className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
        <input name="email" placeholder="Email (optional)" className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
        <select name="role" className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
          <option value="STAFF">STAFF</option>
          <option value="MANAGER">MANAGER</option>
          <option value="OWNER">OWNER</option>
        </select>
      </div>
      <button disabled={busy} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
        Add
      </button>
    </form>
  )
}
