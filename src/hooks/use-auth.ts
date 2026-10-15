'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { apiFetch } from '@/lib/api-client'

export interface CurrentUser {
  id: string
  username: string
  email: string | null
  role: 'OWNER' | 'MANAGER' | 'STAFF'
  shopId: string
  shopName: string
}

export function useAuth(redirectOnFail = true) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let active = true
    apiFetch<CurrentUser>('/api/auth/me')
      .then((u) => active && setUser(u))
      .catch(() => {
        if (active && redirectOnFail) router.push('/login')
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [router, redirectOnFail])

  return { user, loading }
}
