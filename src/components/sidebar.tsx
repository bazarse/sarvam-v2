'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Smartphone,
  Store,
  Map,
  BarChart3,
  ScrollText,
  LogOut,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { apiPost } from '@/lib/api-client'
import { useAuth } from '@/hooks/use-auth'
import { ShieldAlert } from 'lucide-react'

const LINKS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/devices', label: 'Devices', icon: Smartphone },
  { href: '/shops', label: 'Shops', icon: Store },
  { href: '/map', label: 'Live Map', icon: Map },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/audit', label: 'Audit Log', icon: ScrollText },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth(false)
  const links =
    user?.role === 'SUPER_ADMIN'
      ? [{ href: '/admin', label: 'Platform', icon: ShieldAlert }, ...LINKS]
      : LINKS

  async function logout() {
    await apiPost('/api/auth/logout').catch(() => {})
    router.push('/login')
  }

  return (
    <aside className="flex h-screen w-60 flex-col bg-slate-900 text-slate-200">
      <div className="px-5 py-5 text-lg font-bold text-white">
        Sarvam<span className="text-brand-500"> DM</span>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                active
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </nav>
      <button
        onClick={logout}
        className="m-3 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </aside>
  )
}
