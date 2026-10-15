'use client'

import { use, useCallback, useEffect, useState } from 'react'

import { apiFetch } from '@/lib/api-client'
import { NewUserForm } from '@/components/new-user-form'
import { useAuth } from '@/hooks/use-auth'

interface Shop {
  id: string
  name: string
  city: string | null
  phone: string | null
  address: string | null
}
interface UserRow {
  id: string
  username: string
  role: string
  isActive: boolean
  lastLoginAt: string | null
}

export default function ShopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const [shop, setShop] = useState<Shop | null>(null)
  const [users, setUsers] = useState<UserRow[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    apiFetch<Shop>(`/api/shops/${id}`).then(setShop).catch((e) => setError(e.message))
    apiFetch<{ items: UserRow[] }>(`/api/users?shopId=${id}`)
      .then((d) => setUsers(d.items))
      .catch(() => setUsers([]))
  }, [id])

  useEffect(() => load(), [load])

  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (!shop) return <p className="text-sm text-slate-500">Loading...</p>

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{shop.name}</h1>
        <p className="text-sm text-slate-500">
          {shop.city} · {shop.phone} · {shop.address}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Staff</h2>
        <div className="space-y-2 text-sm">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
              <span className="font-medium">{u.username}</span>
              <span className="text-xs text-slate-500">{u.role}</span>
              <span className={u.isActive ? 'text-emerald-600' : 'text-slate-400'}>
                {u.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
          {users.length === 0 && <p className="text-slate-500">No staff yet.</p>}
        </div>
      </div>

      {user?.role === 'OWNER' && <NewUserForm shopId={id} onCreated={load} />}
    </div>
  )
}
