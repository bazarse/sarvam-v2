'use client'

import { useEffect, useState } from 'react'

import { apiFetch } from '@/lib/api-client'
import type { DeviceRow } from '@/components/device-table'

interface DeviceList {
  items: DeviceRow[]
  total: number
  page: number
  pageSize: number
}

export function useDevices(search: string, status: string, page: number) {
  const [data, setData] = useState<DeviceList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    params.set('page', String(page))

    setLoading(true)
    apiFetch<DeviceList>(`/api/devices?${params.toString()}`)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
      .finally(() => setLoading(false))
  }, [search, status, page])

  return { data, loading, error }
}
