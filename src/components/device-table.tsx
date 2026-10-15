'use client'

import Link from 'next/link'

import { StatusBadge } from './status-badge'

export interface DeviceRow {
  id: string
  imei1: string
  brand: string | null
  model: string | null
  customerName: string | null
  customerPhone: string | null
  isLocked: boolean
  status: string
  batteryLevel: number | null
  isCharging: boolean
  lastOnlineAt: string | null
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function DeviceTable({ devices }: { devices: DeviceRow[] }) {
  if (devices.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">No devices found.</p>
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">IMEI</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Battery</th>
            <th className="px-4 py-3">Last Online</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((d) => (
            <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-3">
                <Link href={`/devices/${d.id}`} className="font-medium text-brand-600">
                  {d.imei1}
                </Link>
                <div className="text-xs text-slate-400">
                  {d.brand} {d.model}
                </div>
              </td>
              <td className="px-4 py-3">
                {d.customerName ?? '-'}
                <div className="text-xs text-slate-400">{d.customerPhone}</div>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={d.status} />
              </td>
              <td className="px-4 py-3">
                {d.batteryLevel != null ? `${d.batteryLevel}%` : '-'}
                {d.isCharging && <span className="ml-1 text-emerald-600">⚡</span>}
              </td>
              <td className="px-4 py-3 text-slate-500">{timeAgo(d.lastOnlineAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
