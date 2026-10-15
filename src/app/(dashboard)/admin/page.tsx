'use client'

import { useState } from 'react'

import { OrgSection } from '@/components/org-section'
import { PlatformShopSection } from '@/components/platform-shop-section'
import { useAuth } from '@/hooks/use-auth'

// Platform console — SUPER_ADMIN only. Create organizations, shops across any
// org, and (via each shop) create owner/admin accounts with their own login.
export default function AdminPage() {
  const { user, loading } = useAuth()
  const [reloadKey, setReloadKey] = useState(0)

  if (loading) return <p className="text-sm text-slate-500">Loading...</p>
  if (user && user.role !== 'SUPER_ADMIN') {
    return <p className="text-sm text-red-600">Not permitted. Super admin only.</p>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Console</h1>
        <p className="text-sm text-slate-500">
          Manage organizations, shops, and shop admin accounts across the platform.
        </p>
      </div>
      <OrgSection onChange={() => setReloadKey((k) => k + 1)} />
      <PlatformShopSection reloadKey={reloadKey} />
      <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        Tip: open any shop to add its owner/admin and staff accounts (username +
        password). Those users then log in and see only their own shop.
      </p>
    </div>
  )
}
