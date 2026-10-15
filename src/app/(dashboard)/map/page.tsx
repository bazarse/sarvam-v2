'use client'

import { useEffect, useState } from 'react'

import { apiFetch } from '@/lib/api-client'

interface MapDevice {
  id: string
  imei1: string
  customerName: string | null
  lastLatitude: number | null
  lastLongitude: number | null
}

// Placeholder map view. A tile-based map (Leaflet/Mapbox) can be dropped in
// later; for now we list the latest known coordinates per device.
export default function MapPage() {
  const [devices, setDevices] = useState<MapDevice[]>([])

  useEffect(() => {
    apiFetch<{ items: MapDevice[] }>('/api/devices?pageSize=100')
      .then((d) => setDevices(d.items.filter((x) => x.lastLatitude != null)))
      .catch(() => setDevices([]))
  }, [])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Live Map</h1>
      <p className="text-sm text-slate-500">
        Latest known device locations. Map tiles integration coming next.
      </p>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {devices.map((d) => (
          <a
            key={d.id}
            href={`https://www.google.com/maps?q=${d.lastLatitude},${d.lastLongitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-slate-200 bg-white p-4 text-sm hover:border-brand-500"
          >
            <p className="font-medium text-slate-900">{d.customerName ?? d.imei1}</p>
            <p className="text-slate-500">
              {d.lastLatitude?.toFixed(5)}, {d.lastLongitude?.toFixed(5)}
            </p>
            <span className="text-xs text-brand-600">Open in Google Maps →</span>
          </a>
        ))}
      </div>
      {devices.length === 0 && (
        <p className="text-sm text-slate-500">No location data yet.</p>
      )}
    </div>
  )
}
