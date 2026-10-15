'use client'

import { Sidebar } from '@/components/sidebar'
import { useAuth } from '@/hooks/use-auth'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        Loading...
      </div>
    )
  }
  if (!user) return null

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <span className="text-sm text-slate-500">{user.shopName}</span>
          <span className="text-sm font-medium text-slate-700">
            {user.username} · {user.role}
          </span>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
