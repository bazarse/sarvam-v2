'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

import { apiFetch } from '@/lib/api-client'
import type { MapPoint } from '@/components/live-map'

// Leaflet touches the DOM, so load the map only on the client.
const LiveMap = dynamic(
  () => import('@/components/live-map').then((m) => m.LiveMap),
  { ssr: false, loading: () => <p className="text-sm text-slate-500">Loading map...</p> }
)

export default function MapPage() {
  const [points, setPoints] = useState<MapPoint[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<{ items: MapPoint[] }>('/api/devices/locations')
      .then((d) => setPoints(d.items))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
  }, [])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Live Map</h1>
      <div className="flex gap-4 text-sm text-slate-600">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full bg-emerald-600" /> Active
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full bg-red-600" /> Locked
        </span>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <LiveMap points={points} />
    </div>
  )
}
