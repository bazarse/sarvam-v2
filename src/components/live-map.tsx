'use client'

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

export interface MapPoint {
  id: string
  imei1: string
  customerName: string | null
  status: string
  isLocked: boolean
  lastLatitude: number | null
  lastLongitude: number | null
  lastLocationAt: string | null
}

// Free OpenStreetMap tiles — no API key, no usage quota. Device points are
// drawn as circle markers colored by lock state.
export function LiveMap({ points }: { points: MapPoint[] }) {
  const withCoords = points.filter((p) => p.lastLatitude != null)
  const center: [number, number] = withCoords.length
    ? [withCoords[0].lastLatitude!, withCoords[0].lastLongitude!]
    : [22.7196, 75.8577] // Indore default

  return (
    <MapContainer
      center={center}
      zoom={withCoords.length ? 11 : 5}
      style={{ height: '70vh', width: '100%', borderRadius: '0.75rem' }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {withCoords.map((p) => (
        <CircleMarker
          key={p.id}
          center={[p.lastLatitude!, p.lastLongitude!]}
          radius={8}
          pathOptions={{
            color: p.isLocked ? '#dc2626' : '#059669',
            fillColor: p.isLocked ? '#dc2626' : '#059669',
            fillOpacity: 0.7,
          }}
        >
          <Popup>
            <div className="text-xs">
              <strong>{p.customerName ?? p.imei1}</strong>
              <br />
              IMEI: {p.imei1}
              <br />
              Status: {p.status}
              <br />
              {p.lastLocationAt
                ? new Date(p.lastLocationAt).toLocaleString('en-IN')
                : ''}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
